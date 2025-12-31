import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { MotiView } from 'moti';
import { Category, CategoryAggregation } from '../../types/types';

interface CategoryDonutProps {
  aggregates: CategoryAggregation[];
  categories: Category[];
  timeFrame: string; 
}

export const CategoryDonut = ({ aggregates, categories, timeFrame }: CategoryDonutProps) => {
  // Sorting logic added here
  const categoryData = useMemo(() => {
    return aggregates
      .filter(cat => cat.total_amount < 0)
      .sort((a, b) => a.total_amount - b.total_amount);
  }, [aggregates]);

  const total = useMemo(() => categoryData.reduce((sum, item) => sum + item.total_amount, 0), [categoryData]);
  const hasData = categoryData.length > 0;

  const size = 150;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedAngle = 0;

  const instanceKey = `${timeFrame}-${total}`;

  return (
    <View className="bg-surfaceDark rounded-2xl p-5 border border-borderDark mb-6">
      <Text className="text-textDark text-xl mb-5 font-semibold">Spending by Category</Text>
      
      {!hasData ? (
        <View className="h-[140px] items-center justify-center">
          <Text className="text-secondaryDark text-2xl font-bold tracking-widest ">No Data</Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-between">
          <MotiView 
            key={`chart-${instanceKey}`} 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600 }}
            className="w-[140px] h-[140px] items-center justify-center"
          >
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: [{ rotate: '-90deg' }] }}>
              {categoryData.map((item, index) => {
                const category = categories.find(c => c.category_name === item.category_name);
                const color = category?.color || '#E4E4E4';
                const percentage = Math.abs(item.total_amount / (total || 1));
                const arcLength = percentage * circumference;
                
                const segment = (
                  <SvgCircle
                    key={`segment-${index}`}
                    cx={center} cy={center} r={radius}
                    stroke={color} strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${arcLength - 3} ${circumference - arcLength + 3}`}
                    strokeDashoffset={-accumulatedAngle}
                  />
                );
                accumulatedAngle += arcLength;
                return segment;
              })}
              <SvgCircle cx={center} cy={center} r={radius - strokeWidth/2} fill="#20283A" />
            </Svg>
          </MotiView>

          <View className="flex-1 pl-10 gap-2">
            {categoryData.slice(0, 5).map((agg, index) => {
              const category = categories.find(c => c.category_name === agg.category_name);
              return (
                <MotiView 
                  key={`label-${instanceKey}-${index}`}
                  from={{ opacity: 0, translateX: 15 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ 
                    type: 'timing', 
                    duration: 400, 
                    delay: 200 + (index * 80) 
                  }}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full" style={{ backgroundColor: category?.color }} />
                    <Text className="text-secondaryDark text-sm">{agg.category_name}</Text>
                  </View>
                  <Text className="text-textDark text-sm font-medium">
                    {total ? `${Math.round(Math.abs(agg.total_amount / total) * 100)}%` : '0%'}
                  </Text>
                </MotiView>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};