import { useRouter } from 'expo-router';
import { AlertCircle, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { BudgetWithSpent } from '../../types/types';

interface BudgetHealthCardProps {
  budgets: BudgetWithSpent[];
  currencySymbol: string;
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
}) => {
  const router = useRouter();

  // Only show monthly budgets for the dashboard view
  const monthlyBudgets = budgets.filter((b) => b.period_type === 'monthly');

  if (monthlyBudgets.length === 0) {
    return (
      <TouchableOpacity
        onPress={() => router.push('/budgets')}
        className="bg-surfaceDark rounded-2xl p-5 border border-borderDark mb-6"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white text-xl font-bold">Budget Health</Text>
          <ChevronRight size={20} color="#94a3b8" />
        </View>
        <Text className="text-slate-400 text-sm">
          No budget set up yet. Tap to create one.
        </Text>
      </TouchableOpacity>
    );
  }

  const totalSpent = monthlyBudgets.reduce((sum, b) => sum + Math.abs(b.spent), 0);
  const totalLimit = monthlyBudgets.reduce((sum, b) => sum + b.limit, 0);

  return (
    <TouchableOpacity
      onPress={() => router.push('/budgets')}
      className="bg-surfaceDark rounded-2xl p-5 border border-borderDark mb-6"
      activeOpacity={0.7}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-xl font-bold">Budget Health</Text>
        <View className="flex-row items-center">
          <Text className="text-xs text-slate-400 mr-1">This Month</Text>
          <ChevronRight size={16} color="#94a3b8" />
        </View>
      </View>

      {/* Individual Budget Progress Bars */}
      <View className="gap-4">
        {monthlyBudgets.map((budget) => {
          // Use absolute value since expenses are stored as negative
          const spentAbs = Math.abs(budget.spent);
          const percentage = budget.limit > 0
            ? (spentAbs / budget.limit) * 100
            : 0;
          const isOver = percentage > 100;
          const isWarning = percentage >= 80 && percentage < 100;
          const remaining = Math.max(budget.limit - spentAbs, 0);

          return (
            <View key={budget.id}>
              {/* Budget Header */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-3 h-3 rounded-full border border-slate-600"
                    style={{ backgroundColor: budget.color }}
                  />
                  <Text className="text-sm text-slate-300">{budget.name}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text
                    className={`text-sm ${
                      isOver
                        ? 'text-rose-400'
                        : isWarning
                        ? 'text-yellow-400'
                        : 'text-slate-400'
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
              <View className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <View
                  style={{
                    height: '100%',
                    width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                    borderRadius: 9999,
                    backgroundColor: isOver
                      ? '#f43f5e'
                      : isWarning
                      ? '#eab308'
                      : budget.color,
                  }}
                />
              </View>

              {/* Footer Stats */}
              <View className="flex-row justify-between mt-1">
                <Text className="text-xs text-slate-500">
                  {formatAmount(remaining, currencySymbol)} left
                </Text>
                <Text
                  className={`text-xs ${
                    isOver
                      ? 'text-rose-400'
                      : isWarning
                      ? 'text-yellow-400'
                      : 'text-slate-500'
                  }`}
                >
                  {Math.round(percentage)}%
                </Text>
              </View>
            </View>
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
          <View className="mt-4 pt-4 border-t border-slate-800">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-white">Total Budget</Text>
              <View className="flex-row items-center gap-2">
                <Text
                  className={`text-sm ${
                    totalIsOver
                      ? 'text-rose-400'
                      : totalIsWarning
                      ? 'text-yellow-400'
                      : 'text-slate-400'
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
            <View className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <View className="flex-row h-full">
                {monthlyBudgets.map((budget) => {
                  const budgetSpentAbs = Math.abs(budget.spent);
                  const widthPercent =
                    totalLimit > 0 ? (budgetSpentAbs / totalLimit) * 100 : 0;
                  const isOver = budgetSpentAbs > budget.limit;

                  return (
                    <View
                      key={budget.id}
                      style={{
                        height: '100%',
                        width: `${Math.min(Math.max(widthPercent, 0), 100)}%`,
                        backgroundColor: isOver ? '#f43f5e' : budget.color,
                      }}
                    />
                  );
                })}
              </View>
            </View>

            {/* Footer Stats */}
            <View className="flex-row justify-between mt-1">
              <Text
                className={`text-xs ${
                  totalIsOver
                    ? 'text-rose-400'
                    : totalIsWarning
                    ? 'text-yellow-400'
                    : 'text-emerald-400'
                }`}
              >
                {formatAmount(totalRemaining, currencySymbol)} left
              </Text>
              <Text
                className={`text-xs ${
                  totalIsOver
                    ? 'text-rose-400'
                    : totalIsWarning
                    ? 'text-yellow-400'
                    : 'text-slate-500'
                }`}
              >
                {Math.round(totalPercentage)}%
              </Text>
            </View>
          </View>
        );
      })()}
    </TouchableOpacity>
  );
};
