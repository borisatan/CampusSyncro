import { AlertCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BudgetWithSpent } from '../../types/types';

interface BudgetSpendingSummaryProps {
  budgets: BudgetWithSpent[];
  currencySymbol: string;
  isDarkMode: boolean;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const getStatus = (percentage: number): 'good' | 'warning' | 'over' => {
  if (percentage >= 100) return 'over';
  if (percentage >= 80) return 'warning';
  return 'good';
};

const getStatusColor = (status: 'good' | 'warning' | 'over', budgetColor: string): string => {
  if (status === 'over') return '#f43f5e';
  if (status === 'warning') return '#eab308';
  return budgetColor;
};

const getStatusTextColor = (status: 'good' | 'warning' | 'over'): string => {
  if (status === 'over') return 'text-rose-400';
  if (status === 'warning') return 'text-yellow-400';
  return 'text-emerald-400';
};

const BAR_HEIGHT = 120;

export const BudgetSpendingSummary: React.FC<BudgetSpendingSummaryProps> = ({
  budgets,
  currencySymbol,
  isDarkMode,
}) => {
  const [activeBarId, setActiveBarId] = useState<number | null>(null);

  if (budgets.length === 0) {
    return null;
  }

  const totalSpent = budgets.reduce((sum, b) => sum + Math.abs(b.spent), 0);
  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
  const totalStatus = getStatus(totalPercentage);

  return (
    <View
      className={`rounded-2xl p-4 mb-4 border ${
        isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Spending Overview
        </Text>
        <Text className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          This Month
        </Text>
      </View>

      {/* Vertical Bar Chart */}
      <View className="flex-row items-end justify-around" style={{ height: BAR_HEIGHT + 40 }}>
        {budgets.map((budget) => {
          const spentAbs = Math.abs(budget.spent);
          const percentage = budget.limit > 0 ? (spentAbs / budget.limit) * 100 : 0;
          const status = getStatus(percentage);
          const barColor = getStatusColor(status, budget.color);
          const fillHeight = Math.min(percentage, 100);
          const remaining = Math.max(budget.limit - spentAbs, 0);
          const isActive = activeBarId === budget.id;

          return (
            <View
              key={budget.id}
              className="items-center"
              style={{ flex: 1, maxWidth: 60 }}
            >
              {/* Tooltip - appears on press */}
              {isActive && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: BAR_HEIGHT + 50,
                    zIndex: 100,
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                    minWidth: 120,
                  }}
                >
                  <Text className="text-white text-base font-semibold mb-2">{budget.name}</Text>
                  <View className="flex-row items-center mb-1">
                    <Text className="text-slate-400 text-sm">Limit:</Text>
                    <Text className="text-white text-sm font-medium ml-2">
                      {formatAmount(budget.limit, currencySymbol)}
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <Text className="text-slate-400 text-sm">Spent:</Text>
                    <Text className="text-white text-sm font-medium ml-2">
                      {formatAmount(spentAbs, currencySymbol)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-slate-400 text-sm">
                      {status === 'over' ? 'Over:' : 'Left:'}
                    </Text>
                    <Text
                      className={`text-sm font-medium ml-2 ${
                        status === 'over' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {status === 'over'
                        ? formatAmount(spentAbs - budget.limit, currencySymbol)
                        : formatAmount(remaining, currencySymbol)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Percentage Label */}
              <Text className={`text-xs mb-1 font-medium ${getStatusTextColor(status)}`}>
                {Math.round(percentage)}%
              </Text>

              {/* Bar */}
              <Pressable
                onPressIn={() => setActiveBarId(budget.id)}
                onPressOut={() => setActiveBarId(null)}
                style={{
                  transform: [{ scale: isActive ? 1.08 : 1 }],
                }}
              >
                <View
                  className="w-10 rounded-lg overflow-hidden justify-end"
                  style={{
                    height: BAR_HEIGHT,
                    backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                    borderWidth: 1,
                    borderColor: isActive ? '#6366f1' : isDarkMode ? '#334155' : '#cbd5e1',
                  }}
                >
                  <View
                    style={{
                      width: '100%',
                      height: `${fillHeight}%`,
                      backgroundColor: barColor,
                      borderRadius: 6,
                      borderWidth: fillHeight > 0 ? 1 : 0,
                      borderColor: 'rgba(255,255,255,0.2)',
                    }}
                  />
                </View>
              </Pressable>

              {/* Budget Name */}
              <Text
                className={`text-xs mt-2 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                numberOfLines={1}
                style={{ width: 56 }}
              >
                {budget.name}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Total Summary */}
      <View className="mt-4 pt-4 border-t border-slate-700">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Total:
            </Text>
            <Text
              className={`text-sm font-medium ${
                totalStatus === 'over'
                  ? 'text-rose-400'
                  : totalStatus === 'warning'
                  ? 'text-yellow-400'
                  : isDarkMode
                  ? 'text-white'
                  : 'text-gray-900'
              }`}
            >
              {formatAmount(totalSpent, currencySymbol)} / {formatAmount(totalLimit, currencySymbol)}
            </Text>
            {totalStatus === 'over' && <AlertCircle size={14} color="#fb7185" />}
            {totalStatus === 'warning' && <AlertCircle size={14} color="#facc15" />}
          </View>
          <Text className={`text-sm ${getStatusTextColor(totalStatus)}`}>
            {Math.round(totalPercentage)}%
          </Text>
        </View>
      </View>
    </View>
  );
};
