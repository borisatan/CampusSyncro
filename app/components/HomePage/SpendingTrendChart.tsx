import React, { useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle, Group, Line as SkiaLine } from '@shopify/react-native-skia';
import Animated, { 
  SharedValue, 
  useAnimatedReaction, 
  runOnJS, 
  useDerivedValue, 
  useAnimatedStyle,
  withTiming // Added for a smoother fade/scale
} from 'react-native-reanimated';
import { MotiView } from 'moti';

interface ChartProps {
  data: any[];
  font: any;
  timeFrame: string;
}

function ToolTip({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
  return (
    <>
      <Circle cx={x} cy={y} r={8} color="#6366f1" opacity={0.8} />
      <Circle cx={x} cy={y} r={4} color="#fff" />
    </>
  );
}

export const SpendingTrendChart = ({ data, font, timeFrame }: ChartProps) => {
  const [tooltipData, setTooltipData] = useState({ label: '', value: 0 });
  const { state, isActive } = useChartPressState({ x: 0, y: { amount: 0 } });

  const instanceKey = useMemo(() => {
    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    return `${timeFrame}-${total}`;
  }, [timeFrame, data]);

  // UI-Thread derived transform for the vertical line
  const verticalLineTransform = useDerivedValue(() => {
    return [{ translateX: state.x.position.value }];
  }, [state.x.position]);

  // The Tooltip Box Animation Logic
  const animatedTooltipStyle = useAnimatedStyle((): any => {
    return {
      transform: [
        { translateX: state.x.position.value - 60 },
        { translateY: state.y.amount.position.value - 70 },
        // Subtle scale effect when appearing/disappearing
        { scale: withTiming(isActive ? 1 : 0.8, { duration: 100 }) },
      ],
      // This is what makes it disappear when not touching
      opacity: withTiming(isActive ? 1 : 0, { duration: 100 }),
    };
  });

  const getLabelStep = (count: number) => {
    if (count <= 6) return 1;
    if (count <= 12) return 2;
    return 3;
  };

  useAnimatedReaction(
    () => ({ x: state.x.value.value, y: state.y.amount.value.value }),
    (current) => {
      const index = Math.round(current.x);
      const label = data[index]?.label || '';
      const value = Math.round(current.y);
      runOnJS(setTooltipData)({ label, value });
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
          {/* TOOLTIP BOX - Tracks finger and hides when inactive */}
          <Animated.View 
            style={[
              { 
                position: 'absolute',
                zIndex: 100,
                backgroundColor: '#1e293b', 
                borderColor: '#334155',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 20,
                paddingVertical: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6
              },
              animatedTooltipStyle
            ]}
            pointerEvents="none"
          >
            <View className="flex-row items-center space-x-2">
              <Text className="text-slate-400 text-md font-medium">
                {tooltipData.label} : 
              </Text>
              <Text className="text-slate-400 text-md font-medium"> </Text>
              <Text className="text-white text-md font-bold">
                €{tooltipData.value.toLocaleString()}
              </Text>
            </View>
          </Animated.View>

          <View className="h-[250px] -ml-2">
            <CartesianChart
              data={data}
              xKey="x"
              yKeys={["amount"]}
              padding={10}
              domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
              xAxis={{
                font,
                tickCount: data.length,
                labelOffset: -8,
                labelColor: "#94a3b8",
                formatXLabel: (v) => (Math.round(v) % getLabelStep(data.length) === 0 ? data[Math.round(v)] : { label: "" }).label,
              }}
              yAxis={[{
                font,
                tickCount: 5,
                labelOffset: -8,
                labelColor: "#94a3b8",
                formatYLabel: (v) => `$${Math.round(v)}`,
              }]}
              chartPressState={state}
            >
              {({ points, chartBounds }) => (
                <>
                  {/* Vertical Guide Line */}
                  {isActive && (
                    <Group transform={verticalLineTransform as any}>
                      <SkiaLine
                        p1={{ x: 0, y: chartBounds.top }}
                        p2={{ x: 0, y: chartBounds.bottom }}
                        color="#334155"
                        strokeWidth={1}
                        opacity={0.6}
                      />
                    </Group>
                  )}

                  <Line points={points.amount} color="#6366f1" strokeWidth={3} curveType="catmullRom" />
                  
                  {points.amount.map((point, index) => (
                    <Circle key={index} cx={point.x} cy={point.y} r={4} color="#6366f1" />
                  ))}

                  {/* Tooltip circles - isActive logic is handled inside victory-native's state */}
                  {isActive && <ToolTip x={state.x.position} y={state.y.amount.position} />}
                </>
              )}
            </CartesianChart>
          </View>
        </View>
      </MotiView>
    </View>
  );
};