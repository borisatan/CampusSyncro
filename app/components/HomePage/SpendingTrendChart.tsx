import { Circle, Group } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

import { CartesianChart, Line, useChartPressState, } from 'victory-native';
import { BudgetWithSpent } from '../../types/types';

interface ChartProps {
  data: any[];
  font: any;
  timeFrame: 'week' | 'month' | 'year';
  currencySymbol: string;
  budgets?: BudgetWithSpent[];
  isUnlocked?: boolean;
}

function ToolTip({
  x,
  y,
  yPace,
  color,
  showPaceCircle
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  yPace: SharedValue<number>;
  color: string;
  showPaceCircle: boolean;
}) {
  return (
    <Group>
      {/* Budget pace circle (gray dashed style) */}
      {showPaceCircle && (
        <>
          <Circle cx={x} cy={yPace} r={8} color="#64748b" opacity={0.6} />
          <Circle cx={x} cy={yPace} r={4} color="#fff" />
        </>
      )}
      {/* Actual spending circle */}
      <Circle cx={x} cy={y} r={8} color={color} opacity={0.8} />
      <Circle cx={x} cy={y} r={4} color="#fff" />
    </Group>
  );
}

// Helper to normalize budget limits to the chart's timeframe
const normalizeBudgetToTimeframe = (
  budget: { limit: number; period_type: 'weekly' | 'monthly' | 'custom' },
  timeFrame: 'week' | 'month' | 'year'
): number => {
  const { limit, period_type } = budget;

  if (timeFrame === 'week') {
    if (period_type === 'weekly') return limit;
    if (period_type === 'monthly') return limit / 4;
    return limit / 4; // custom defaults to monthly-ish
  }

  if (timeFrame === 'month') {
    if (period_type === 'weekly') return limit * 4;
    if (period_type === 'monthly') return limit;
    return limit;
  }

  // year view
  if (period_type === 'weekly') return limit * 52;
  if (period_type === 'monthly') return limit * 12;
  return limit * 12;
};

export const SpendingTrendChart = ({ data, currencySymbol, font, timeFrame, budgets = [], isUnlocked = true }: ChartProps) => {
  const [tooltipData, setTooltipData] = useState({
    label: '',
    value: '',
    paceValue: '',
    isOverBudget: false,
    isFuture: false
  });
  const { state, isActive } = useChartPressState({ x: 0, y: { amount: 0, pace: 0 } });
  const [showTooltip, setShowTooltip] = useState(false);

  // Track last index to prevent redundant JS bridge calls
  const lastIndex = useSharedValue(-1);

  // Calculate total budget normalized to the current timeframe
  const totalBudget = useMemo(() => {
    if (!budgets || budgets.length === 0) return 0;
    return budgets.reduce((sum, budget) => {
      return sum + normalizeBudgetToTimeframe(budget, timeFrame);
    }, 0);
  }, [budgets, timeFrame]);

  // Build cumulative spending data with pace comparison
  const { cumulativeData, lastActualIndex } = useMemo(() => {
    let fullLabels: string[] = [];

    if (timeFrame === 'week') {
      fullLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    } else if (timeFrame === 'month') {
      fullLabels = ['W1', 'W2', 'W3', 'W4', 'W5'];
    } else if (timeFrame === 'year') {
      fullLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }

    let runningTotal = 0;
    let lastIdx = -1;
    const totalPoints = fullLabels.length;

    const result = fullLabels.map((label, index) => {
      const existingPoint = data.find(d => d.label === label);

      let isFuture = false;
      if (timeFrame === 'week') {
        const dayMap: Record<string, number> = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };
        const todayNum = new Date().getDay();
        const labelNum = dayMap[label];
        const adjustedToday = todayNum === 0 ? 7 : todayNum;
        const adjustedLabel = labelNum === 0 ? 7 : labelNum;
        isFuture = adjustedLabel > adjustedToday;
      } else if (timeFrame === 'month') {
        const currentWeekIdx = Math.floor((new Date().getDate() - 1) / 7);
        isFuture = index > currentWeekIdx;
      } else if (timeFrame === 'year') {
        isFuture = index > new Date().getMonth();
      }

      if (!isFuture) {
        runningTotal += existingPoint ? existingPoint.amount : 0;
        lastIdx = index;
      }

      // Calculate pace value at this point (each period gets an equal share of budget)
      const paceValue = totalBudget > 0 ? (totalBudget / totalPoints) * (index + 1) : 0;
      const isOverBudget = runningTotal > paceValue;

      return {
        x: index,
        label: label,
        amount: isFuture ? 0 : runningTotal,
        pace: paceValue,
        isFuture: isFuture,
        isOverBudget: isOverBudget
      };
    });

    return { cumulativeData: result, lastActualIndex: lastIdx };
  }, [data, timeFrame, totalBudget]);

  const maxValue = useMemo(() => {
    const maxSpending = Math.max(...cumulativeData.map((d) => d.amount || 0));
    const maxPace = totalBudget;
    const max = Math.max(maxSpending, maxPace);
    return max === 0 ? 100 : max * 1.2;
  }, [cumulativeData, totalBudget]);

  const instanceKey = useMemo(() => {
    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    return `${timeFrame}-${total}-${totalBudget}-${isUnlocked}`;
  }, [timeFrame, data, totalBudget, isUnlocked]);

  const animatedTooltipStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: state.x.position.value - 100 },
        { translateY: state.y.amount.position.value - 95 },
      ],
    } as any;
  });

  const labelStep = useMemo(() => {
    if (timeFrame === 'year') return 3;
    if (timeFrame === 'month') return 1;
    return 1;
  }, [timeFrame]);

  useAnimatedReaction(
    () => ({
      x: state.x.value.value,
      y: state.y.amount.value.value,
      active: isActive
    }),
    (current) => {
      if (!current.active) {
        if (lastIndex.value !== -1) {
          lastIndex.value = -1;
          runOnJS(setShowTooltip)(false);
          runOnJS(setTooltipData)({ label: '', value: '', paceValue: '', isOverBudget: false, isFuture: false });
        }
        return;
      }

      const index = Math.round(current.x);
      if (index >= 0 && index < cumulativeData.length) {
        if (!showTooltip) runOnJS(setShowTooltip)(true);

        if (index !== lastIndex.value) {
          lastIndex.value = index;

          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);

          const dataPoint = cumulativeData[index];
          const label = dataPoint?.label || '';
          const isOverBudget = dataPoint?.isOverBudget || false;
          const isFuture = dataPoint?.isFuture || false;
          const valueStr = isFuture
            ? 'Upcoming'
            : `${currencySymbol}${Math.round(dataPoint?.amount || 0).toLocaleString()}`;
          const paceValueStr = `${currencySymbol}${Math.round(dataPoint?.pace || 0).toLocaleString()}`;

          runOnJS(setTooltipData)({ label, value: valueStr, paceValue: paceValueStr, isOverBudget, isFuture });
        }
      }
    }
  );

  return (
    <View className="bg-surfaceDark rounded-2xl p-5 border border-borderDark mb-6">
      <Text className="text-white text-xl font-bold mb-5">Spending Trend</Text>

      {/* Legend - outside MotiView to prevent re-animation on time period change */}
      {totalBudget > 0 && (
        <View className="flex-row items-center justify-center gap-6 mb-3">
          <View className="flex-row items-center gap-2">
            <View className="flex-row">
              <View className="w-[10px] h-[3px] bg-green-500 rounded-l-full" />
              <View className="w-[10px] h-[3px] bg-red-500 rounded-r-full" />
            </View>
            <Text className="text-slate-400 text-xs">Spending</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-[2px]">
              <View className="w-[6px] h-[2px] bg-slate-500 rounded-sm" />
              <View className="w-[6px] h-[2px] bg-slate-500 rounded-sm" />
            </View>
            <Text className="text-slate-400 text-xs">Budget Pace</Text>
          </View>
        </View>
      )}

      <MotiView
        key={instanceKey}
        from={isUnlocked ? { opacity: 0, translateY: 10 } : { opacity: 1, translateY: 0 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
      >
        <View>
          {showTooltip && (
          <Animated.View
            style={[
              {
                position: 'absolute', zIndex: 100, backgroundColor: '#1e293b',
                borderColor: '#334155', borderWidth: 1, borderRadius: 8,
                paddingHorizontal: 16, paddingVertical: 8, shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
                shadowRadius: 8, elevation: 6
              },
              animatedTooltipStyle
            ]}
            pointerEvents="none"
          >
            <Text className="text-slate-400 text-sm font-medium mb-1">{tooltipData.label}</Text>
            <View className="flex-row items-center">
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: tooltipData.isFuture
                    ? '#6b7280'
                    : totalBudget > 0
                      ? (tooltipData.isOverBudget ? '#ef4444' : '#22c55e')
                      : '#6366f1',
                  marginRight: 6
                }}
              />
              <Text className="text-white text-sm font-bold">Spent: {tooltipData.value}</Text>
            </View>
            {totalBudget > 0 && (
              <View className="flex-row items-center mt-1">
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#64748b',
                    marginRight: 6
                  }}
                />
                <Text className="text-slate-300 text-sm">Budget: {tooltipData.paceValue}</Text>
              </View>
            )}
          </Animated.View>)}

          <View className="h-[250px] -ml-2">
            <CartesianChart
              data={cumulativeData}
              xKey="x"
              yKeys={["amount", "pace"]}
              padding={10}
              domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
              domain={{ y: [0, maxValue] }}
              xAxis={{
                font,
                tickCount: cumulativeData.length,
                labelOffset: -8,
                labelColor: "#94a3b8",
                formatXLabel: (v) => {
                  const idx = Math.round(v);
                  if (idx >= 0 && idx < cumulativeData.length && idx % labelStep === 0) {
                    return cumulativeData[idx].label;
                  }
                  return "";
                },
              }}
              yAxis={[{
                font,
                tickCount: 5,
                labelOffset: -8,
                labelColor: "#94a3b8",
                formatYLabel: (v) => `${currencySymbol}${Math.round(v)}`,
              }]}
              chartPressState={state}
            >
              {({ points }) => {
                // Build enhanced pixel points with intersections
                const buildEnhancedPixelPoints = () => {
                  if (totalBudget === 0 || lastActualIndex < 0) return null;

                  const enhancedPixelPoints: Array<{ x: number; y: number; isOverBudget: boolean }> = [];

                  for (let i = 0; i <= lastActualIndex; i++) {
                    const currentData = cumulativeData[i];
                    const currentPixel = points.amount[i];
                    const currentPacePixel = points.pace[i];

                    if (!currentPixel || !currentPacePixel) continue;

                    const currentOver = currentData.amount > currentData.pace;
                    enhancedPixelPoints.push({
                      x: currentPixel.x,
                      y: currentPixel.y,
                      isOverBudget: currentOver
                    });

                    // Check for intersection with next point
                    if (i < lastActualIndex) {
                      const nextData = cumulativeData[i + 1];
                      const nextPixel = points.amount[i + 1];
                      const nextPacePixel = points.pace[i + 1];

                      if (!nextPixel || !nextPacePixel) continue;

                      const nextOver = nextData.amount > nextData.pace;

                      // If budget status changes, calculate intersection
                      if (currentOver !== nextOver) {
                        const da = nextData.amount - currentData.amount;
                        const dp = nextData.pace - currentData.pace;
                        const denominator = da - dp;

                        if (Math.abs(denominator) > 0.001) {
                          const t = (currentData.pace - currentData.amount) / denominator;

                          if (t > 0 && t < 1) {
                            // Interpolate pixel positions
                            const intersectPixelX = currentPixel.x + (nextPixel.x - currentPixel.x) * t;
                            const intersectPixelY = currentPixel.y + (nextPixel.y - currentPixel.y) * t;

                            enhancedPixelPoints.push({
                              x: intersectPixelX,
                              y: intersectPixelY,
                              isOverBudget: nextOver
                            });
                          }
                        }
                      }
                    }
                  }

                  return enhancedPixelPoints;
                };

                // Build segments from enhanced pixel points
                const buildSegmentsFromPixelPoints = (pixelPoints: Array<{ x: number; y: number; isOverBudget: boolean }> | null) => {
                  if (!pixelPoints || pixelPoints.length < 2) return [];

                  const segments: Array<{ points: Array<{ x: number; y: number }>; isOverBudget: boolean }> = [];
                  let currentSegment: Array<{ x: number; y: number }> = [{ x: pixelPoints[0].x, y: pixelPoints[0].y }];
                  let currentIsOver = pixelPoints[0].isOverBudget;

                  for (let i = 1; i < pixelPoints.length; i++) {
                    const point = pixelPoints[i];

                    if (point.isOverBudget !== currentIsOver) {
                      // Status changed - this point is an intersection
                      // Add it to current segment and start new one
                      currentSegment.push({ x: point.x, y: point.y });
                      segments.push({ points: [...currentSegment], isOverBudget: currentIsOver });

                      // Start new segment from intersection point
                      currentSegment = [{ x: point.x, y: point.y }];
                      currentIsOver = point.isOverBudget;
                    } else {
                      currentSegment.push({ x: point.x, y: point.y });
                    }
                  }

                  // Push final segment
                  if (currentSegment.length >= 1) {
                    segments.push({ points: currentSegment, isOverBudget: currentIsOver });
                  }

                  return segments;
                };

                const enhancedPixelPoints = buildEnhancedPixelPoints();
                const pixelSegments = buildSegmentsFromPixelPoints(enhancedPixelPoints);

                return (
                  <>
                    {/* Budget pace line (dashed gray) - only if budget exists */}
                    {totalBudget > 0 && (
                      <Line
                        points={points.pace}
                        color="#64748b"
                        strokeWidth={2}
                        strokeDasharray={[8, 4]}
                        opacity={0.6}
                      />
                    )}

                    {/* Segmented spending lines with intersection-accurate coloring */}
                    {totalBudget > 0 && pixelSegments.length > 0 ? (
                      pixelSegments.map((segment, segIdx) => {
                        if (segment.points.length < 2) return null;
                        return (
                          <Line
                            key={`segment-${segIdx}`}
                            points={segment.points}
                            color={segment.isOverBudget ? '#ef4444' : '#22c55e'}
                            strokeWidth={3}
                          />
                        );
                      })
                    ) : totalBudget === 0 ? (
                      /* Fallback purple line if no budget */
                      <Line
                        points={points.amount.filter((_, i) => i <= lastActualIndex)}
                        color="#6366f1"
                        strokeWidth={3}
                        curveType="catmullRom"
                      />
                    ) : null}

                    {/* Tooltip indicator - only shown when pressed */}
                    {showTooltip && (
                      <ToolTip
                        x={state.x.position}
                        y={state.y.amount.position}
                        yPace={state.y.pace.position}
                        color={
                          tooltipData.isFuture
                            ? '#6b7280'
                            : totalBudget > 0
                              ? (tooltipData.isOverBudget ? '#ef4444' : '#22c55e')
                              : '#6366f1'
                        }
                        showPaceCircle={totalBudget > 0}
                      />
                    )}
                  </>
                );
              }}
            </CartesianChart>
          </View>
        </View>
      </MotiView>
    </View>
  );
};