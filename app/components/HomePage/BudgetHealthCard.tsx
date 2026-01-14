import { AlertCircle } from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import { Text, View } from 'react-native';

import { BudgetWithSpent } from '../../types/types';

interface BudgetHealthCardProps {
  budgets: BudgetWithSpent[];
  currencySymbol: string;
  isLoading?: boolean;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const BudgetHealthCard: React.FC<BudgetHealthCardProps> = ({
  budgets,
  currencySymbol,
  isLoading = false,
}) => {

  // Only show monthly budgets for the dashboard view
  const monthlyBudgets = budgets.filter((b) => b.period_type === 'monthly');

  // Show nothing while loading to prevent flash of "No budget" message
  if (isLoading) {
    return null;
  }

  if (monthlyBudgets.length === 0) {
    return (
      <MotiView
        from={{ opacity: 0 }}
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

  const totalSpent = monthlyBudgets.reduce((sum, b) => sum + Math.abs(b.spent), 0);
  const totalLimit = monthlyBudgets.reduce((sum, b) => sum + b.limit, 0);

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 400 }}
    >
      <View className="bg-surfaceDark rounded-2xl p-5 border border-borderDark mb-6">
        {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-xl font-bold">Budget Health</Text>
        <Text className="text-xs text-slate-400">This Month</Text>
      </View>

      {/* Individual Budget Progress Bars */}
      <View className="gap-4">
        {monthlyBudgets.map((budget, index) => {
          // Use absolute value since expenses are stored as negative
          const spentAbs = Math.abs(budget.spent);
          const percentage = budget.limit > 0
            ? (spentAbs / budget.limit) * 100
            : 0;
          const isOver = percentage > 100;
          const isWarning = percentage >= 80 && percentage < 100;
          const remaining = Math.max(budget.limit - spentAbs, 0);

          return (
            <MotiView
              key={budget.id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 400,
                delay: 150 + index * 100,
              }}
            >
              {/* Budget Header */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-4 h-4 rounded-full border border-slate-600"
                    style={{ backgroundColor: budget.color }}
                  />
                  <Text className="text-base text-textDark">{budget.name}</Text>
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
                    {formatAmount(spentAbs, currencySymbol)} /{' '}
                    {formatAmount(budget.limit, currencySymbol)}
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
                      : budget.color,
                  }}
                />
              </View>

              {/* Footer Stats */}
              <View className="flex-row justify-between mt-1">
                <Text className="text-sm text-textDark">
                  {formatAmount(remaining, currencySymbol)} left
                </Text>
                <Text
                  className={`text-sm ${
                    isOver
                      ? 'text-rose-400'
                      : isWarning
                      ? 'text-yellow-400'
                      : 'text-accentTeal'
                  }`}
                >
                  {Math.round(percentage)}%
                </Text>
              </View>
            </MotiView>
          );
        })}
      </View>

      {/* Total Progress Bar */}
      {monthlyBudgets.length >= 1 && (() => {
        const totalPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
        const totalIsOver = totalPercentage > 100;
        const totalIsWarning = totalPercentage >= 80 && totalPercentage < 100;
        const totalRemaining = Math.max(totalLimit - totalSpent, 0);

        return (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 400,
              delay: 150 + monthlyBudgets.length * 100 + 50,
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
                {monthlyBudgets.map((budget) => {
                  const budgetSpentAbs = Math.abs(budget.spent);
                  const widthPercent =
                    totalLimit > 0 ? (budgetSpentAbs / totalLimit) * 100 : 0;

                  return (
                    <View
                      key={budget.id}
                      style={{
                        height: '100%',
                        width: `${Math.min(Math.max(widthPercent, 0), 100)}%`,
                        backgroundColor: budget.color,
                      }}
                    />
                  );
                })}
              </View>
            </View>

            {/* Footer Stats */}
            <View className="flex-row justify-between mt-1">
              <Text
                className={`text-sm ${
                  totalIsOver
                    ? 'text-rose-400'
                    : totalIsWarning
                    ? 'text-yellow-400'
                    : 'text-accentTeal'
                }`}
              >
                {formatAmount(totalRemaining, currencySymbol)} left
              </Text>
              <Text
                className={`text-sm ${
                  totalIsOver
                    ? 'text-rose-400'
                    : totalIsWarning
                    ? 'text-yellow-400'
                    : 'text-accentTeal'
                }`}
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
