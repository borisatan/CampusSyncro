import React from 'react';
import { View } from 'react-native';
import { Category, CategoryAggregation } from '../../types/types';
import ExpenseCategoryCard from './ExpenseCategoryCard';

interface CategoryBreakdownListProps {
  currency: string;
  categories: Category[];
  categoriesAggregated: CategoryAggregation[];
  onCategoryPress: (category_name: string) => void;
}

export const CategoryBreakdownList = ({
  currency,
  categories,
  categoriesAggregated,
  onCategoryPress,
}: CategoryBreakdownListProps) => {
  const displayCategories = categories
    .filter(cat => {
      const agg = categoriesAggregated.find(c => c.category_name === cat.category_name);
      return agg && agg.total_amount < 0; // Only show expenses
    })
    .sort((a, b) => {
      const aggA = categoriesAggregated.find(c => c.category_name === a.category_name)?.total_amount || 0;
      const aggB = categoriesAggregated.find(c => c.category_name === b.category_name)?.total_amount || 0;
      return aggA - aggB; // Most negative first
    });

  return (
    <View className="mt-1 mb-10">
      {displayCategories.map((cat) => {
        const agg = categoriesAggregated.find(c => c.category_name === cat.category_name);
        
        return (
          <ExpenseCategoryCard
            key={cat.id}
            currency={currency}
            name={cat.category_name}
            icon={cat.icon}
            color={cat.color}
            // Use Math.abs or negative sign to display as positive spending number
            amount={agg ? Math.round(Math.abs(agg.total_amount)) : 0}
            percent={agg ? Number(agg.percent.toPrecision(2)) : 0}
            onPress={onCategoryPress}
          />
        );
      })}
    </View>
  );
};