import { Circle, Group } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { CartesianChart, Line, useChartPressState, } from 'victory-native';
interface ChartProps {
  data: any[]; 
  font: any;
  timeFrame: 'week' | 'month' | 'year';
  currencySymbol: string;
}

function ToolTip({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
  return (
    <Group>
      <Circle cx={x} cy={y} r={8} color="#6366f1" opacity={0.8} />
      <Circle cx={x} cy={y} r={4} color="#fff" />
    </Group>
  );
}

export const SpendingTrendChart = ({ data, currencySymbol, font, timeFrame }: ChartProps) => {
  const [tooltipData, setTooltipData] = useState({ label: '', value: '' });
  const { state, isActive } = useChartPressState({ x: 0, y: { amount: 0 } });
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Track last index to prevent redundant JS bridge calls
  const lastIndex = useSharedValue(-1);

  const paddedData = useMemo(() => {
    let fullLabels: string[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
  
    if (timeFrame === 'week') {
      fullLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    } else if (timeFrame === 'month') {
      fullLabels = ['W1', 'W2', 'W3', 'W4', 'W5'];
    } else if (timeFrame === 'year') {
      fullLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
  
    return fullLabels.map((label, index) => {
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
  
      return {
        x: index,
        label: label,
        amount: existingPoint ? existingPoint.amount : 0,
        isFuture: isFuture 
      };
    });
  }, [data, timeFrame]);

  const maxValue = useMemo(() => {
    const max = Math.max(...paddedData.map((d) => d.amount || 0));
    return max === 0 ? 100 : max * 1.2;
  }, [paddedData]);

  const instanceKey = useMemo(() => {
    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    return `${timeFrame}-${total}`;
  }, [timeFrame, data]);

  const smoothY = useDerivedValue(() => {
    const currentX = state.x.position.value;
    
    // We map the raw pixel X to the corresponding Y values of our data points
    return interpolate(
      currentX,
      paddedData.map((_, i) => (state.x.position.value / state.x.value.value) * i), 
      paddedData.map((d) => state.y.amount.position.value), // This needs to be the point's y-coord
      Extrapolation.CLAMP
    );
  });

  const animatedTooltipStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: state.x.position.value - 60 },
        // Use the smoothY value for a fluid vertical movement
        { translateY: state.y.amount.position.value - 75 }, 
      ],
    } as any;
  });

  const labelStep = useMemo(() => {
    if (timeFrame === 'year') return 3; // Show every 3rd month (Jan, Apr, Jul, Oct)
    if (timeFrame === 'month') return 1; // Show W1, W2...
    return 1; // Show Mon, Tue...
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
          runOnJS(setTooltipData)({ label: '', value: '' });
        }
        return;
      }
  
      const index = Math.round(current.x);
      if (index >= 0 && index < paddedData.length) {
        if (!showTooltip) runOnJS(setShowTooltip)(true);
        
        if (index !== lastIndex.value) {
          lastIndex.value = index;
          
          // --- HAPTIC TRIGGER ---
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
  
          const dataPoint = paddedData[index];
          const label = dataPoint?.label || '';
          const valueStr = dataPoint?.isFuture 
            ? 'Upcoming' 
            : `${currencySymbol}${Math.round(current.y).toLocaleString()}`;
  
          runOnJS(setTooltipData)({ label, value: valueStr });
        }
      }
    }
  );

  return (
    <View className="bg-surfaceDark rounded-2xl p-5 border border-borderDark mb-6">
      <Text className="text-white text-xl font-bold mb-5">Spending Trend</Text>

      <MotiView
        key={instanceKey}
        from={{ opacity: 0, translateY: 10 }}
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
            <View className="flex-row items-center">
              <Text className="text-slate-400 text-sm font-medium">{tooltipData.label}:</Text>
              <Text className="text-white text-sm font-bold ml-2">{tooltipData.value}</Text>
            </View>
          </Animated.View>)}

          <View className="h-[250px] -ml-2">
            <CartesianChart
              data={paddedData}
              xKey="x"
              yKeys={["amount"]}
              padding={10}
              domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
              domain={{ y: [0, maxValue] }}
              xAxis={{
                font,
                tickCount: paddedData.length,
                labelOffset: -8,
                labelColor: "#94a3b8",
                formatXLabel: (v) => {
                  const idx = Math.round(v);
                  if (idx >= 0 && idx < paddedData.length && idx % labelStep === 0) {
                    return paddedData[idx].label;
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
              {({ points }) => (
                <>
                  <Line
                    points={points.amount.filter((_, i) => {
                      const isFuture = paddedData[i].isFuture;
                      const isLastPurplePoint = !isFuture && paddedData[i + 1]?.isFuture;
                      return isFuture || isLastPurplePoint;
                    })}
                    color="#475569"
                    strokeWidth={2}
                    opacity={0.2} 
                    curveType="catmullRom"
                  />

                  <Line
                    points={points.amount.filter((_, i) => !paddedData[i].isFuture)}
                    color="#6366f1"
                    strokeWidth={3}
                    curveType="catmullRom"
                  />

                  {points.amount.map((point, index) => {
                    const isFuture = paddedData[index]?.isFuture;
                    return (
                      <Group key={index}>
                        {isFuture ? (
                          <Circle cx={point.x} cy={point.y} r={2} color="#475569" opacity={0.5} />
                        ) : (
                          <>
                            <Circle cx={point.x} cy={point.y} r={6} color="#6366f1" opacity={0.1} />
                            <Circle cx={point.x} cy={point.y} r={3.5} color="#6366f1" />
                          </>
                        )}
                      </Group>
                    );
                  })}

{showTooltip && (
  <ToolTip 
    x={state.x.position} 
    y={state.y.amount.position} 
  />
)}
                </>
              )}
            </CartesianChart>
          </View>
        </View>
      </MotiView>
    </View>
  );
};