import { Circle, Group } from '@shopify/react-native-skia';
import { MotiView } from 'moti';
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { CartesianChart, Line, useChartPressState } from 'victory-native';

interface ChartProps {
  data: any[]; // Expecting e.g. [{ label: 'W1', amount: 50 }, ...]
  font: any;
  timeFrame: 'week' | 'month' | 'year';
  currencySymbol: string;
}


function ToolTip({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
  return (
    <>
      <Circle cx={x} cy={y} r={8} color="#6366f1" opacity={0.8} />
      <Circle cx={x} cy={y} r={4} color="#fff" />
    </>
  );
}


export const SpendingTrendChart = ({ data, currencySymbol, font, timeFrame }: ChartProps) => {
  const [tooltipData, setTooltipData] = useState({ label: '', value: 0 });
  const { state, isActive } = useChartPressState({ x: 0, y: { amount: 0 } });

  // 1. PAD THE DATA: Ensure X-axis always shows the full range

  const paddedData = useMemo(() => {
    let fullLabels: string[] = [];

    if (timeFrame === 'week') {
      fullLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    } else if (timeFrame === 'month') {
      fullLabels = ['W1', 'W2', 'W3', 'W4', 'W5'];

    } else if (timeFrame === 'year') {
      fullLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }


    // Map the full labels to data. If actual data exists for that label, use it. Otherwise, amount: 0.

    return fullLabels.map((label, index) => {
      const existingPoint = data.find(d => d.label === label);
      return {
        x: index,
        label: label,
        amount: existingPoint ? existingPoint.amount : 0,
        isFuture: !existingPoint // Flag to style dots differently
      };
    });

  }, [data, timeFrame]);


  // Use paddedData for calculations

  const maxValue = useMemo(() => {
    const max = Math.max(...paddedData.map((d) => d.amount || 0));
    return max === 0 ? 100 : max * 1.2;
  }, [paddedData]);


  const instanceKey = useMemo(() => {
    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    return `${timeFrame}-${total}`;
  }, [timeFrame, data]);


  const verticalLineTransform = useDerivedValue(() => {
    return [{ translateX: state.x.position.value }];
  }, [state.x.position]);


  const animatedTooltipStyle = useAnimatedStyle((): any => {
    return {
      transform: [
        { translateX: state.x.position.value - 60 },
        { translateY: state.y.amount.position.value - 70 },
        { scale: withTiming(isActive ? 1 : 0.8, { duration: 100 }) },
      ],

      opacity: withTiming(isActive ? 1 : 0, { duration: 100 }),
    };

  });


  const getLabelStep = (count: number) => {
    if (count <= 7) return 1;
    if (count <= 12) return 2;
    return 3;

  };

  const updateTooltip = (label: string, value: number) => {
    setTooltipData({ label, value });
  };

  useAnimatedReaction(
    () => ({ x: state.x.value.value, y: state.y.amount.value.value }),
    (current) => {

      const index = Math.round(current.x);
      const dataPoint = paddedData[index];
      const label = dataPoint?.label || '';


      // If it's a future point, show "Upcoming" or "€0" specifically

      const valueStr = dataPoint?.isFuture ? 'Upcoming' : `${currencySymbol}${Math.round(current.y).toLocaleString()}`;
     

      runOnJS(setTooltipData)({ label, value: valueStr as any });
      
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
          <Animated.View
            style={[
              {
                position: 'absolute', zIndex: 100, backgroundColor: '#1e293b',
                borderColor: '#334155', borderWidth: 1, borderRadius: 8,
                paddingHorizontal: 20, paddingVertical: 10, shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
                shadowRadius: 8, elevation: 6
              },

              animatedTooltipStyle
            ]}

            pointerEvents="none"
          >

            <View className="flex-row items-center">
              <Text className="text-slate-400 text-md font-medium">{tooltipData.label} : </Text>
              <Text className="text-white text-md font-bold ml-2">{tooltipData.value.toLocaleString()}</Text>
            </View>

          </Animated.View>

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
                  if (idx >= 0 && idx < paddedData.length && idx % getLabelStep(paddedData.length) === 0) {
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

              {({ points, chartBounds }) => (
                  <>
                    {/* 1. Draw the "Future/Empty" Line (Gray/Desaturated) */}
                    <Line
                      points={points.amount}
                      color="#475569" // Slate color for the "background" track
                      strokeWidth={2}
                      opacity={0.3} // Very light
                      curveType="catmullRom"
                    />


                    {/* 2. Overlay the "Actual" Line (Bright)
                    */}

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
                          {/* Future dots: Small, gray, no glow */}
                          {isFuture ? (
                            <Circle
                              cx={point.x}
                              cy={point.y}
                              r={2}
                              color="#475569"
                              opacity={0.5}
                            />
                          ) : (
                            /* Actual dots: Larger, bright indigo, with a slight "glow" */
                            <>

                              <Circle cx={point.x} cy={point.y} r={6} color="#6366f1" opacity={0.2} />
                              <Circle cx={point.x} cy={point.y} r={4} color="#6366f1" />
                            </>

                          )}

                        </Group>
                      );
                    })}

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