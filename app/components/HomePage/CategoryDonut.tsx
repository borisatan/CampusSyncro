import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';
import { Text } from '../Shared/AppText';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Category, CategoryAggregation } from '../../types/types';
import ExpenseCategoryCard from './ExpenseCategoryCard';

interface CategoryDonutProps {
  aggregates: CategoryAggregation[];
  categories: Category[];
  timeFrame: string;
  isUnlocked?: boolean;
  currency: string;
  onCategoryPress: (category_name: string) => void;
}

const VISIBLE_COUNT = 5;

export const CategoryDonut = React.memo(function CategoryDonut({ aggregates, categories, timeFrame, isUnlocked = true, currency, onCategoryPress }: CategoryDonutProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryData = useMemo(() => {
    return aggregates
      .filter(cat => cat.total_amount < 0)
      .sort((a, b) => a.total_amount - b.total_amount);
  }, [aggregates]);

  const displayCategories = useMemo(() =>
    categories
      .filter(cat => {
        const agg = aggregates.find(c => c.category_name === cat.category_name);
        return agg && agg.total_amount < 0;
      })
      .sort((a, b) => {
        const aggA = aggregates.find(c => c.category_name === a.category_name)?.total_amount ?? 0;
        const aggB = aggregates.find(c => c.category_name === b.category_name)?.total_amount ?? 0;
        return aggA - aggB;
      }),
  [categories, aggregates]);

  const total = useMemo(() => categoryData.reduce((sum, item) => sum + item.total_amount, 0), [categoryData]);
  const hasData = categoryData.length > 0;

  const size = 150;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  const instanceKey = `${timeFrame}-${total}-${isUnlocked}`;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => !prev);
  };

  return (
    <View className="mb-24">
      <View className="bg-surfaceDark rounded-2xl p-5 border border-borderDark">
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-textDark text-xl font-semibold">Spending by Category</Text>
          {hasData && (
            <Pressable onPress={handleToggle} className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center">
              {isExpanded
                ? <ChevronUp size={20} color="#94a3b8" />
                : <ChevronDown size={20} color="#94a3b8" />
              }
            </Pressable>
          )}
        </View>

        {!hasData ? (
          <View className="h-[140px] items-center justify-center">
            <Text className="text-secondaryDark text-2xl font-bold tracking-widest ">No Data - Add a transaction</Text>
          </View>
        ) : (
          <View className="flex-row items-start justify-between">
            <MotiView
              key={`chart-${instanceKey}`}
              from={isUnlocked ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600 }}
              className="w-[140px] h-[140px] items-center justify-center"
            >
              <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: [{ rotate: '-90deg' }] }}>
                <SvgCircle cx={center} cy={center} r={radius - strokeWidth/2} fill="#161B2E" />
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
                      strokeDasharray={`${Math.max(0, arcLength - 3).toFixed(2)} ${(circumference - arcLength + 3).toFixed(2)}`}
                      strokeDashoffset={(-accumulatedAngle).toFixed(2)}
                    />
                  );
                  accumulatedAngle += arcLength;
                  return segment;
                })}
              </Svg>
            </MotiView>

            <View className="flex-1 pl-10 gap-2">
              {categoryData.slice(0, VISIBLE_COUNT).map((agg, index) => {
                const category = categories.find(c => c.category_name === agg.category_name);
                return (
                  <MotiView
                    key={`label-${instanceKey}-${index}`}
                    from={isUnlocked ? { opacity: 0, translateX: 15 } : { opacity: 1, translateX: 0 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{
                      type: 'timing',
                      duration: 400,
                      delay: isUnlocked ? 200 + (index * 80) : 0
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

      {isExpanded && hasData && (
        <AnimatePresence>
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -8 }}
            transition={{ type: 'timing', duration: 300 }}
            className="mt-2 mb-6"
          >
            {displayCategories.map((cat) => {
              const agg = aggregates.find(c => c.category_name === cat.category_name);
              return (
                <ExpenseCategoryCard
                  key={cat.id}
                  currency={currency}
                  name={cat.category_name}
                  icon={cat.icon}
                  color={cat.color}
                  amount={agg ? Math.round(Math.abs(agg.total_amount)) : 0}
                  percent={agg ? Number(agg.percent.toPrecision(2)) : 0}
                  onPress={onCategoryPress}
                />
              );
            })}
          </MotiView>
        </AnimatePresence>
      )}
    </View>
  );
});
