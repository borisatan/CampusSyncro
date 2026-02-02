import {
  Circle,
  Group,
  Rect,
  rect as skRect,
} from "@shopify/react-native-skia";
import { MotiView } from "moti";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";

import { CartesianChart, Line, useChartPressState } from "victory-native";
import { CategoryBudgetStatus } from "../../types/types";

interface ChartProps {
  data: any[];
  font: any;
  timeFrame: "week" | "month" | "year";
  currencySymbol: string;
  categoryBudgets?: CategoryBudgetStatus[];
  isUnlocked?: boolean;
}

function ToolTip({
  x,
  y,
  color,
  isActive,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  color: string;
  isActive: boolean;
}) {
  if (!isActive) return null;
  return (
    <Group>
      <Rect x={x} y={0} width={1} height={300} color="#94a3b8" opacity={0.3} />
      <Circle cx={x} cy={y} r={6} color={color} />
    </Group>
  );
}

// Normalize total budget to chart timeframe (budgets are always monthly for now)
const normalizeTotalBudgetToTimeframe = (
  totalBudget: number,
  timeFrame: "week" | "month" | "year",
): number => {
  if (timeFrame === "week") return totalBudget / 4;
  if (timeFrame === "month") return totalBudget;
  return totalBudget * 12; // year
};

// Format label for the tooltip display (not x-axis)
const formatDisplayLabel = (
  label: string,
  timeFrame: "week" | "month" | "year",
): string => {
  if (!label) return "";
  if (timeFrame === "week") {
    const dayMap: Record<string, string> = {
      Mon: "Monday",
      Tue: "Tuesday",
      Wed: "Wednesday",
      Thu: "Thursday",
      Fri: "Friday",
      Sat: "Saturday",
      Sun: "Sunday",
    };
    return dayMap[label] || label;
  }
  if (timeFrame === "year") {
    const monthMap: Record<string, string> = {
      Jan: "January",
      Feb: "February",
      Mar: "March",
      Apr: "April",
      May: "May",
      Jun: "June",
      Jul: "July",
      Aug: "August",
      Sep: "September",
      Oct: "October",
      Nov: "November",
      Dec: "December",
    };
    return monthMap[label] || label;
  }
  if (timeFrame === "month") {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(Number(label)).padStart(2, "0");
    return `${day}.${month}`;
  }
  return label;
};

export const SpendingTrendChart = ({
  data,
  currencySymbol,
  font,
  timeFrame,
  categoryBudgets = [],
  isUnlocked = true,
}: ChartProps) => {
  const [tooltipData, setTooltipData] = useState({
    label: "",
    value: "",
    paceValue: "",
    diffStr: "",
    diffPctStr: "",
    isOverBudget: false,
    isFuture: false,
  });
  const { state, isActive } = useChartPressState({
    x: 0,
    y: { amount: 0, pace: 0 },
  });
  const [pressing, setPressing] = useState(false);

  // Track last index to prevent redundant JS bridge calls
  const lastIndex = useSharedValue(-1);

  // Calculate total budget normalized to the current timeframe
  const totalBudget = useMemo(() => {
    if (!categoryBudgets || categoryBudgets.length === 0) return 0;
    const rawTotal = categoryBudgets.reduce(
      (sum, cb) => sum + cb.budget_amount,
      0,
    );
    return normalizeTotalBudgetToTimeframe(rawTotal, timeFrame);
  }, [categoryBudgets, timeFrame]);

  // Build cumulative spending data with pace comparison
  const { cumulativeData, lastActualIndex } = useMemo(() => {
    let fullLabels: string[] = [];

    if (timeFrame === "week") {
      fullLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    } else if (timeFrame === "month") {
      fullLabels = ["1", "8", "15", "22", "29"];
    } else if (timeFrame === "year") {
      fullLabels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
    }

    let runningTotal = 0;
    let lastIdx = -1;
    const totalPoints = fullLabels.length;

    const result = fullLabels.map((label, index) => {
      const existingPoint = data.find((d) => d.label === label);

      let isFuture = false;
      if (timeFrame === "week") {
        const dayMap: Record<string, number> = {
          Mon: 1,
          Tue: 2,
          Wed: 3,
          Thu: 4,
          Fri: 5,
          Sat: 6,
          Sun: 0,
        };
        const todayNum = new Date().getDay();
        const labelNum = dayMap[label];
        const adjustedToday = todayNum === 0 ? 7 : todayNum;
        const adjustedLabel = labelNum === 0 ? 7 : labelNum;
        isFuture = adjustedLabel > adjustedToday;
      } else if (timeFrame === "month") {
        const currentWeekIdx = Math.floor((new Date().getDate() - 1) / 7);
        isFuture = index > currentWeekIdx;
      } else if (timeFrame === "year") {
        isFuture = index > new Date().getMonth();
      }

      if (!isFuture) {
        runningTotal += existingPoint ? existingPoint.amount : 0;
        lastIdx = index;
      }

      // Calculate pace value at this point (each period gets an equal share of budget)
      const paceValue =
        totalBudget > 0 ? (totalBudget / totalPoints) * (index + 1) : 0;
      const isOverBudget = runningTotal > paceValue;

      return {
        x: index,
        label: label,
        amount: isFuture ? 0 : runningTotal,
        pace: paceValue,
        isFuture: isFuture,
        isOverBudget: isOverBudget,
      };
    });

    return { cumulativeData: result, lastActualIndex: lastIdx };
  }, [data, timeFrame, totalBudget]);

  // Catmull-Rom spline interpolation for smooth curves
  const catmullRom = (
    p0: number,
    p1: number,
    p2: number,
    p3: number,
    t: number,
  ) => {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
  };

  // Upsample data for smooth scrubbing (inserts intermediate interpolated points)
  // week: 7 pts * 86 = ~602, month: 5 pts * 120 = ~600, year: 12 pts * 50 = ~600
  const INTERPOLATION_STEPS =
    timeFrame === "month" ? 120 : timeFrame === "week" ? 86 : 50;
  const { smoothData, smoothLastActualIndex } = useMemo(() => {
    if (cumulativeData.length < 2) {
      return {
        smoothData: cumulativeData,
        smoothLastActualIndex: lastActualIndex,
      };
    }

    const result: typeof cumulativeData = [];
    const len = cumulativeData.length;

    for (let i = 0; i < len; i++) {
      // Push original point with new x index
      result.push({ ...cumulativeData[i], x: i * INTERPOLATION_STEPS });

      // Insert intermediate points between this and next using Catmull-Rom
      if (i < len - 1) {
        const curr = cumulativeData[i];
        const next = cumulativeData[i + 1];
        // Catmull-Rom needs 4 control points: clamp at edges
        const prev = cumulativeData[Math.max(0, i - 1)];
        const nextNext = cumulativeData[Math.min(len - 1, i + 2)];

        for (let j = 1; j < INTERPOLATION_STEPS; j++) {
          const t = j / INTERPOLATION_STEPS;
          const interpAmount =
            curr.isFuture && next.isFuture
              ? 0
              : next.isFuture
                ? curr.amount
                : catmullRom(
                    prev.amount,
                    curr.amount,
                    next.amount,
                    nextNext.amount,
                    t,
                  );
          const interpPace = catmullRom(
            prev.pace,
            curr.pace,
            next.pace,
            nextNext.pace,
            t,
          );

          result.push({
            x: i * INTERPOLATION_STEPS + j,
            label: "", // no label for intermediate points
            amount: interpAmount,
            pace: interpPace,
            isFuture: next.isFuture && j > INTERPOLATION_STEPS / 2,
            isOverBudget: interpAmount > interpPace,
          });
        }
      }
    }

    const newLastIdx =
      lastActualIndex >= 0 ? lastActualIndex * INTERPOLATION_STEPS : -1;
    return { smoothData: result, smoothLastActualIndex: newLastIdx };
  }, [cumulativeData, lastActualIndex]);

  const maxValue = useMemo(() => {
    const maxSpending = Math.max(...smoothData.map((d) => d.amount || 0));
    const maxPace = totalBudget;
    const max = Math.max(maxSpending, maxPace);
    return max === 0 ? 100 : max * 1.2;
  }, [smoothData, totalBudget]);

  // Compute default tooltip from the last actual data point
  const defaultTooltip = useMemo(() => {
    if (lastActualIndex < 0 || cumulativeData.length === 0) {
      return {
        label: "",
        value: `${currencySymbol}0`,
        paceValue: "",
        diffStr: "",
        diffPctStr: "",
        isOverBudget: false,
        isFuture: false,
      };
    }
    const pt = cumulativeData[lastActualIndex];
    const amount = Math.round(pt.amount);
    const pace = Math.round(pt.pace);
    const diff = amount - pace;
    const sign = diff >= 0 ? "+" : "-";
    return {
      label: formatDisplayLabel(pt.label, timeFrame),
      value: `${currencySymbol}${amount.toLocaleString()}`,
      paceValue: `${currencySymbol}${pace.toLocaleString()}`,
      diffStr: `${sign}${currencySymbol}${Math.abs(diff).toLocaleString()}`,
      diffPctStr:
        pace > 0 ? `${(Math.abs(diff / pace) * 100).toFixed(1)}%` : "0.0%",
      isOverBudget: pt.isOverBudget,
      isFuture: false,
    };
  }, [cumulativeData, lastActualIndex, currencySymbol]);

  // Show scrubbed data if available, otherwise default to latest actual point
  const displayData = tooltipData.value ? tooltipData : defaultTooltip;

  const instanceKey = useMemo(() => {
    return `${timeFrame}-${totalBudget}-${isUnlocked}`;
  }, [timeFrame, totalBudget, isUnlocked]);

  // Clamped tooltip positions - never go past the last actual data point
  const clampedX = useSharedValue(0);
  const clampedY = useSharedValue(0);
  // Store the pixel position of the last actual data point (set during render)
  const lastActualPixelX = useSharedValue(0);
  const lastActualPixelY = useSharedValue(0);

  // Animated clip rect for highlight - runs on UI thread, no JS bridge lag
  const HIGHLIGHT_HALF_WIDTH = 30;
  const highlightClip = useDerivedValue(() => {
    return skRect(
      clampedX.value - HIGHLIGHT_HALF_WIDTH,
      0,
      HIGHLIGHT_HALF_WIDTH * 2,
      300,
    );
  });

  const handleTooltipUpdate = (
    rawIndex: number,
    xPos: number,
    yPos: number,
  ) => {
    const index = Math.min(
      Math.max(Math.round(rawIndex), 0),
      smoothLastActualIndex,
    );
    if (index < 0 || index >= smoothData.length) return;

    const originalIndex = Math.round(index / INTERPOLATION_STEPS);
    const dataPoint = smoothData[index];
    const nearestOriginal =
      cumulativeData[Math.min(originalIndex, cumulativeData.length - 1)];
    const label = formatDisplayLabel(nearestOriginal?.label || "", timeFrame);
    const isOverBudget = dataPoint?.isOverBudget || false;
    const amount = Math.round(dataPoint?.amount || 0);
    const pace = Math.round(dataPoint?.pace || 0);
    const valueStr = `${currencySymbol}${amount.toLocaleString()}`;
    const paceValueStr = `${currencySymbol}${pace.toLocaleString()}`;

    const diff = amount - pace;
    const sign = diff >= 0 ? "+" : "-";
    const diffStr = `${sign}${currencySymbol}${Math.abs(diff).toLocaleString()}`;
    const diffPct = pace > 0 ? Math.abs(diff / pace) * 100 : 0;
    const diffPctStr = `${diffPct.toFixed(1)}%`;

    setPressing(true);
    setTooltipData({
      label,
      value: valueStr,
      paceValue: paceValueStr,
      diffStr,
      diffPctStr,
      isOverBudget,
      isFuture: false,
    });
  };

  const handleTooltipClear = () => {
    setPressing(false);
    setTooltipData({
      label: "",
      value: "",
      paceValue: "",
      diffStr: "",
      diffPctStr: "",
      isOverBudget: false,
      isFuture: false,
    });
  };

  useAnimatedReaction(
    () => ({
      x: state.x.value.value,
      y: state.y.amount.value.value,
      active: isActive,
    }),
    (current) => {
      if (!current.active) {
        lastIndex.value = -1;
        runOnJS(handleTooltipClear)();
        return;
      }

      const rawIndex = Math.round(current.x);

      // Update clamped positions for tooltip rendering
      if (rawIndex > smoothLastActualIndex && smoothLastActualIndex >= 0) {
        clampedX.value = lastActualPixelX.value;
        clampedY.value = lastActualPixelY.value;
      } else {
        clampedX.value = state.x.position.value;
        clampedY.value = state.y.amount.position.value;
      }

      runOnJS(handleTooltipUpdate)(
        current.x,
        state.x.position.value,
        state.y.amount.position.value,
      );
    },
  );

  return (
    <View className="bg-surfaceDark rounded-2xl p-5 border border-borderDark mb-6">
      <MotiView
        key={instanceKey}
        from={
          isUnlocked
            ? { opacity: 0, translateY: 10 }
            : { opacity: 1, translateY: 0 }
        }
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500 }}
      >
        <View>
          <View className="mb-2">
            <View className="flex-row items-baseline">
              {!displayData.isFuture && displayData.label !== "" && (
                <Text className="text-textDark text-3xl font-bold mr-2">
                  {displayData.label}:
                </Text>
              )}
              <Text className="text-white text-3xl font-bold">
                {displayData.value}
              </Text>
              <Text className="text-slate-500 text-xl font-bold ml-2">
                spent
              </Text>
            </View>
            <View
              className="flex-row items-center mt-0.5"
              style={{ minHeight: 18 }}
            >
              {totalBudget > 0 && !displayData.isFuture && (
                <>
                  <Text
                    style={{
                      color: displayData.isOverBudget ? "#ef4444" : "#22c55e",
                      fontSize: 15,
                    }}
                  >
                    {displayData.diffStr}
                  </Text>
                  <Text
                    style={{
                      color: displayData.isOverBudget ? "#ef4444" : "#22c55e",
                      fontSize: 15,
                      marginLeft: 2,
                    }}
                  >
                    {displayData.isOverBudget ? "\u25B2" : "\u25BC"}
                  </Text>
                  <Text
                    style={{
                      color: displayData.isOverBudget ? "#ef4444" : "#22c55e",
                      fontSize: 15,
                      fontWeight: "700",
                      marginLeft: 4,
                    }}
                  >
                    {displayData.diffPctStr}
                  </Text>
                  <Text className="text-slate-500 text-sm ml-1.5">
                    {displayData.isOverBudget ? "over budget" : "under budget"}
                  </Text>
                </>
              )}
            </View>
          </View>

          <View className="h-[270px] -ml-2">
            <CartesianChart
              data={smoothData}
              xKey="x"
              yKeys={["amount", "pace"]}
              padding={{ left: 10, right: 10, top: 10, bottom: 30 }}
              domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
              domain={{ y: [0, maxValue] }}
              gestureLongPressDelay={100}
              xAxis={{
                font,
                tickValues: (() => {
                  if (timeFrame === "week") {
                    // All 7 days
                    return cumulativeData.map(
                      (_, i) => i * INTERPOLATION_STEPS,
                    );
                  } else if (timeFrame === "month") {
                    // All 5 week-start dates
                    return cumulativeData.map(
                      (_, i) => i * INTERPOLATION_STEPS,
                    );
                  } else {
                    // Year: show ~5 labels including first and last
                    const indices = [0, 2, 5, 8, 11].filter(
                      (i) => i < cumulativeData.length,
                    );
                    return indices.map((i) => i * INTERPOLATION_STEPS);
                  }
                })(),
                labelColor: "#94a3b8",
                formatXLabel: (v) => {
                  const idx = Math.round(Number(v) / INTERPOLATION_STEPS);
                  if (idx < 0 || idx >= cumulativeData.length) return "";
                  return cumulativeData[idx]?.label || "";
                },
              }}
              yAxis={[
                {
                  font,
                  tickCount: 2,
                  labelOffset: -8,
                  labelColor: "#94a3b8",
                  formatYLabel: (v) => `${currencySymbol}${Math.round(v)}`,
                },
              ]}
              chartPressState={state}
            >
              {({ points }) => {
                // Build enhanced pixel points with intersections
                const buildEnhancedPixelPoints = () => {
                  if (totalBudget === 0 || smoothLastActualIndex < 0)
                    return null;

                  const enhancedPixelPoints: Array<{
                    x: number;
                    y: number;
                    isOverBudget: boolean;
                  }> = [];

                  for (let i = 0; i <= smoothLastActualIndex; i++) {
                    const currentData = smoothData[i];
                    const currentPixel = points.amount[i];
                    const currentPacePixel = points.pace[i];

                    if (!currentPixel || !currentPacePixel) continue;

                    const currentOver = currentData.amount > currentData.pace;
                    enhancedPixelPoints.push({
                      x: currentPixel.x,
                      y: currentPixel.y,
                      isOverBudget: currentOver,
                    });

                    // Check for intersection with next point
                    if (i < smoothLastActualIndex) {
                      const nextData = smoothData[i + 1];
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
                          const t =
                            (currentData.pace - currentData.amount) /
                            denominator;

                          if (t > 0 && t < 1) {
                            const intersectPixelX =
                              currentPixel.x +
                              (nextPixel.x - currentPixel.x) * t;
                            const intersectPixelY =
                              currentPixel.y +
                              (nextPixel.y - currentPixel.y) * t;

                            enhancedPixelPoints.push({
                              x: intersectPixelX,
                              y: intersectPixelY,
                              isOverBudget: nextOver,
                            });
                          }
                        }
                      }
                    }
                  }

                  return enhancedPixelPoints;
                };

                // Build segments from enhanced pixel points
                const buildSegmentsFromPixelPoints = (
                  pixelPoints: Array<{
                    x: number;
                    y: number;
                    isOverBudget: boolean;
                  }> | null,
                ) => {
                  if (!pixelPoints || pixelPoints.length < 2) return [];

                  const segments: Array<{
                    points: Array<{ x: number; y: number }>;
                    isOverBudget: boolean;
                  }> = [];
                  let currentSegment: Array<{ x: number; y: number }> = [
                    { x: pixelPoints[0].x, y: pixelPoints[0].y },
                  ];
                  let currentIsOver = pixelPoints[0].isOverBudget;

                  for (let i = 1; i < pixelPoints.length; i++) {
                    const point = pixelPoints[i];

                    if (point.isOverBudget !== currentIsOver) {
                      // Status changed - this point is an intersection
                      // Add it to current segment and start new one
                      currentSegment.push({ x: point.x, y: point.y });
                      segments.push({
                        points: [...currentSegment],
                        isOverBudget: currentIsOver,
                      });

                      // Start new segment from intersection point
                      currentSegment = [{ x: point.x, y: point.y }];
                      currentIsOver = point.isOverBudget;
                    } else {
                      currentSegment.push({ x: point.x, y: point.y });
                    }
                  }

                  // Push final segment
                  if (currentSegment.length >= 1) {
                    segments.push({
                      points: currentSegment,
                      isOverBudget: currentIsOver,
                    });
                  }

                  return segments;
                };

                const enhancedPixelPoints = buildEnhancedPixelPoints();
                const pixelSegments =
                  buildSegmentsFromPixelPoints(enhancedPixelPoints);

                // Determine endpoint circle color
                const endpointColor =
                  totalBudget > 0
                    ? smoothData[smoothLastActualIndex]?.isOverBudget
                      ? "#ef4444"
                      : "#22c55e"
                    : "#6366f1";

                const endpointPixel =
                  smoothLastActualIndex >= 0
                    ? points.amount[smoothLastActualIndex]
                    : null;

                // Store endpoint pixel position for tooltip clamping
                if (endpointPixel) {
                  lastActualPixelX.value = endpointPixel.x;
                  lastActualPixelY.value = endpointPixel.y;
                }

                const renderLines = () => (
                  <>
                    {/* White spending line */}
                    <Line
                      points={points.amount.filter(
                        (_, i) => i <= smoothLastActualIndex,
                      )}
                      color="#ffffff"
                      strokeWidth={3}
                      curveType="catmullRom"
                    />
                  </>
                );

                return (
                  <>
                    {/* Dimmed lines when scrubbing, full opacity otherwise */}
                    <Group opacity={pressing ? 0.25 : 1}>{renderLines()}</Group>

                    {/* Highlighted section near tooltip at full opacity */}
                    {pressing && (
                      <Group clip={highlightClip}>{renderLines()}</Group>
                    )}

                    {/* Endpoint circle at cutoff - hidden when tooltip is active */}
                    {!pressing && endpointPixel && (
                      <Circle
                        cx={endpointPixel.x}
                        cy={endpointPixel.y}
                        r={6}
                        color={endpointColor}
                      />
                    )}

                    {/* Tooltip indicator */}
                    <ToolTip
                      x={clampedX}
                      y={clampedY}
                      isActive={pressing}
                      color={
                        totalBudget > 0
                          ? tooltipData.isOverBudget
                            ? "#ef4444"
                            : "#22c55e"
                          : "#6366f1"
                      }
                    />
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
