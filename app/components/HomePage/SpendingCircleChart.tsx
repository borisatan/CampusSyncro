import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { ChartSegment } from '../../types/types';

interface SpendingCircleChartProps {
  segments: ChartSegment[];
  total: number;
}

const CIRCLE_SIZE = Dimensions.get('window').width * 0.6;
const STROKE_WIDTH = 18;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SpendingCircleChart: React.FC<SpendingCircleChartProps> = ({ segments, total }) => {
  let offset = 0;
  const totalValue = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <View className="items-center justify-center my-6">
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
        <G rotation="-90" origin={`${CIRCLE_SIZE / 2},${CIRCLE_SIZE / 2}`}> 
          {segments.map((seg, idx) => {
            const percent = seg.value / totalValue;
            const strokeDasharray = percent * CIRCUMFERENCE;
            const circle = (
              <Circle
                key={seg.key}
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={seg.color}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={`${strokeDasharray},${CIRCUMFERENCE - strokeDasharray}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += strokeDasharray;
            return circle;
          })}
        </G>
      </Svg>
      <View className="absolute left-0 right-0 items-center" style={{ top: '38%' }} pointerEvents="none">
        <Text className="text-white text-base opacity-70 font-medium">Spent:</Text>
        <Text className="text-white text-3xl font-bold mt-0.5">${total.toLocaleString(undefined, { minimumFractionDigits: 0 })}</Text>
      </View>
    </View>
  );
};

export default SpendingCircleChart; 