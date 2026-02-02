import { AlertCircle } from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CategoryBudgetStatus } from '../../types/types';

interface BudgetHealthCardProps {
  categoryBudgets: CategoryBudgetStatus[];
  allCategoryBudgets: CategoryBudgetStatus[];
  currencySymbol: string;
  isLoading?: boolean;
  isUnlocked?: boolean;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const BudgetHealthCard: React.FC<BudgetHealthCardProps> = ({
  categoryBudgets,
  allCategoryBudgets,
  currencySymbol,
  isLoading = false,
  isUnlocked = true,
}) => {
  if (isLoading) {
    return null;
  }

  if (categoryBudgets.length === 0) {
    return (
      <MotiView
        from={isUnlocked ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <View className="bg-surfaceDark rounded-2xl p-5 border border-borderDark mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-xl font-bold">Budget Health</Text>
          </View>
          <Text className="text-slate-400 text-sm">
            No budget set up yet.
          </Text>
        </View>
      </MotiView>
    );
  }

  const totalSpent = allCategoryBudgets.reduce((sum, cb) => sum + cb.spent, 0);
  const totalLimit = allCategoryBudgets.reduce((sum, cb) => sum + cb.budget_amount, 0);

  return (
    <MotiView
      from={isUnlocked ? { opacity: 0 } : { opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 400 }}
    >
      <View className="bg-surfaceDark rounded-2xl p-5 border border-borderDark mb-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-bold">Budget Health</Text>
          <Text className="text-xs text-slate-400">This Period</Text>
        </View>

        {/* Individual Category Budget Progress Bars */}
        <View className="gap-4">
          {categoryBudgets.map((cb, index) => {
            const percentage = cb.percentage_used;
            const isOver = percentage > 100;
            const isWarning = percentage >= 80 && percentage < 100;
            const remaining = Math.max(cb.budget_amount - cb.spent, 0);

            return (
              <MotiView
                key={cb.category.id}
                from={isUnlocked ? { opacity: 0, translateY: 10 } : { opacity: 1, translateY: 0 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: 400,
                  delay: isUnlocked ? 150 + index * 100 : 0,
                }}
              >
                {/* Category Header */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-7 h-7 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: cb.category.color }}
                    >
                      <Ionicons
                        name={cb.category.icon as any}
                        size={16}
                        color="#fff"
                      />
                    </View>
                    <Text className="text-base text-textDark">{cb.category.category_name}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text
                      className={`text-sm ${
                        isOver
                          ? 'text-rose-400'
                          : isWarning
                          ? 'text-yellow-400'
                          : 'text-textDark'
                      }`}
                    >
                      {formatAmount(cb.spent, currencySymbol)} /{' '}
                      {formatAmount(cb.budget_amount, currencySymbol)}
                    </Text>
                    {isOver && <AlertCircle size={16} color="#fb7185" />}
                    {isWarning && !isOver && (
                      <AlertCircle size={16} color="#facc15" />
                    )}
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <View
                    style={{
                      height: '100%',
                      width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                      borderRadius: 9999,
                      backgroundColor:
                        isOver
                          ? '#f43f5e'
                          : isWarning
                          ? '#eab308'
                          : '#22c55e',
                    }}
                  />
                </View>

                {/* Footer Stats */}
                <View className="flex-row justify-between mt-1">
                  <Text className="text-sm text-textDark">
                    {formatAmount(remaining, currencySymbol)} left
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: isOver ? '#fb7185' : isWarning ? '#facc15' : '#22c55e',
                    }}
                  >
                    {Math.round(percentage)}%
                  </Text>
                </View>
              </MotiView>
            );
          })}
        </View>

        {/* Total Progress Bar */}
        {categoryBudgets.length >= 1 && (() => {
          const totalPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
          const totalIsOver = totalPercentage > 100;
          const totalIsWarning = totalPercentage >= 80 && totalPercentage < 100;
          const totalRemaining = Math.max(totalLimit - totalSpent, 0);

          return (
            <MotiView
              from={isUnlocked ? { opacity: 0, translateY: 10 } : { opacity: 1, translateY: 0 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 400,
                delay: isUnlocked ? 150 + categoryBudgets.length * 100 + 50 : 0,
              }}
              className="mt-4 pt-4 border-t border-slate-800"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-white">Total Budget</Text>
                <View className="flex-row items-center gap-2">
                  <Text
                    className={`text-sm ${
                      totalIsOver
                        ? 'text-rose-400'
                        : totalIsWarning
                        ? 'text-yellow-400'
                        : 'text-textDark'
                    }`}
                  >
                    {formatAmount(totalSpent, currencySymbol)} /{' '}
                    {formatAmount(totalLimit, currencySymbol)}
                  </Text>
                  {totalIsOver && <AlertCircle size={16} color="#fb7185" />}
                  {totalIsWarning && !totalIsOver && (
                    <AlertCircle size={16} color="#facc15" />
                  )}
                </View>
              </View>

              {/* Stacked Progress Bar */}
              <View className="h-5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <View className="flex-row h-full">
                  {allCategoryBudgets.map((cb) => {
                    const widthPercent =
                      totalLimit > 0 ? (cb.spent / totalLimit) * 100 : 0;

                    return (
                      <View
                        key={cb.category.id}
                        style={{
                          height: '100%',
                          width: `${Math.min(Math.max(widthPercent, 0), 100)}%`,
                          backgroundColor: cb.category.color,
                        }}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Footer Stats */}
              <View className="flex-row justify-between mt-1">
                <Text
                  style={{
                    fontSize: 14,
                    color: totalIsOver ? '#fb7185' : totalIsWarning ? '#facc15' : '#22c55e',
                  }}
                >
                  {formatAmount(totalRemaining, currencySymbol)} left
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: totalIsOver ? '#fb7185' : totalIsWarning ? '#facc15' : '#22c55e',
                  }}
                >
                  {Math.round(totalPercentage)}%
                </Text>
              </View>
            </MotiView>
          );
        })()}
      </View>
    </MotiView>
  );
};
