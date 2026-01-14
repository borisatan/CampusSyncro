import React from 'react';
import { Text, View } from 'react-native';

import { BudgetWithSpent } from '../../types/types';

interface BudgetAllocationBarProps {
  budgets: BudgetWithSpent[];
  totalIncome: number;
  currencySymbol: string;
  isDarkMode: boolean;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const BudgetAllocationBar: React.FC<BudgetAllocationBarProps> = ({
  budgets,
  totalIncome,
  currencySymbol,
  isDarkMode,
}) => {
  if (budgets.length === 0 || totalIncome <= 0) {
    return null;
  }

  // Calculate each budget's percentage of total income
  const budgetAllocations = budgets.map((budget) => ({
    id: budget.id,
    name: budget.name,
    color: budget.color,
    limit: budget.limit,
    percentage: (budget.limit / totalIncome) * 100,
  }));

  const totalAllocated = budgetAllocations.reduce((sum, b) => sum + b.limit, 0);
  const totalPercentage = (totalAllocated / totalIncome) * 100;
  const unallocatedPercentage = Math.max(100 - totalPercentage, 0);

  return (
    <View
      className={`rounded-2xl p-4 mb-10 border ${
        isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3 border-b border-borderDark pb-2">
        <Text className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Budget Allocation
        </Text>
        <Text className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          {Math.round(totalPercentage)}% of income
        </Text>
      </View>

      {/* Stacked Bar Chart */}
      <View className="h-6 bg-slate-800 rounded-full border border-borderDark overflow-hidden flex-row mb-4">
        {budgetAllocations.map((budget) => (
          <View
            key={budget.id}
            style={{
              width: `${Math.min(budget.percentage, 100)}%`,
              backgroundColor: budget.color,
              height: '100%',
            }}
          />
        ))}
        {/* Unallocated space shown as darker area */}
        {unallocatedPercentage > 0 && (
          <View
            style={{
              width: `${unallocatedPercentage}%`,
              backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0',
              height: '100%',
            }}
          />
        )}
      </View>

      {/* Legend */}
      <View className="flex-row flex-wrap gap-x-4 gap-y-2">
        {budgetAllocations.map((budget) => (
          <View key={budget.id} className="flex-row items-center">
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: budget.color }}
            />
            <Text
              className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}
              numberOfLines={1}
            >
              {budget.name}
            </Text>
            <Text
              className={`text-xs ml-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
            >
              ({Math.round(budget.percentage)}%)
            </Text>
          </View>
        ))}
        {unallocatedPercentage > 0 && (
          <View className="flex-row items-center">
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}
            />
            <Text
              className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}
            >
              Unallocated
            </Text>
            <Text
              className={`text-xs ml-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
            >
              ({Math.round(unallocatedPercentage)}%)
            </Text>
          </View>
        )}
      </View>

      {/* Summary Row */}
      <View className="flex-row justify-between mt-3 pt-3 border-t border-slate-700">
        <Text className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          Total Budgeted: {formatAmount(totalAllocated, currencySymbol)}
        </Text>
        <Text className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          Remaining: {formatAmount(Math.max(totalIncome - totalAllocated, 0), currencySymbol)}
        </Text>
      </View>
    </View>
  );
};
