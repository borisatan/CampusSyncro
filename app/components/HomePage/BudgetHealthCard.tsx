import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React from 'react';
import { Text, View } from 'react-native';

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
    return (
      <View
        className="rounded-2xl p-4 mb-6"
        style={{
          backgroundColor: '#20283A',
          borderWidth: 1,
          borderColor: '#4B5563',
        }}
      >
        <View className="flex-row items-center mb-4">
          <View className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: '#2A9D8F' }} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#7C8CA0', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Budget Health
          </Text>
        </View>
        <View className="h-3 rounded-full overflow-hidden w-3/4" style={{ backgroundColor: '#4B5563' }} />
        <View className="h-3 rounded-full overflow-hidden w-1/2 mt-3" style={{ backgroundColor: '#4B5563' }} />
      </View>
    );
  }

  if (categoryBudgets.length === 0) {
    return (
      <MotiView
        from={isUnlocked ? { opacity: 0, translateY: 8 } : { opacity: 1, translateY: 0 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350 }}
      >
        <View
          className="rounded-2xl p-4 mb-6"
          style={{
            backgroundColor: '#20283A',
            borderWidth: 1,
            borderColor: '#4B5563',
          }}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: '#7C8CA0' }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#7C8CA0', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Budget Health
            </Text>
          </View>
          <Text style={{ color: '#7C8CA0', fontSize: 14 }}>
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
      from={isUnlocked ? { opacity: 0, translateY: 8 } : { opacity: 1, translateY: 0 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350 }}
    >
      <View
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          backgroundColor: '#20283A',
          borderWidth: 1,
          borderColor: '#4B5563',
        }}
      >
        {/* Header */}
        <View className="p-4 pb-0">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: '#2A9D8F' }} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#7C8CA0', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Budget Health
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: '#7C8CA0' }}>This Period</Text>
          </View>
        </View>

        {/* Individual Category Budget Items */}
        <View className="px-4">
          {categoryBudgets.map((cb, index) => {
            const percentage = cb.percentage_used;
            const isOver = percentage > 100;
            const isWarning = percentage >= 80 && percentage < 100;
            const remaining = Math.max(cb.budget_amount - cb.spent, 0);

            const progressColor = isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#2A9D8F';
            const statusColor = isOver ? '#FCA5A5' : isWarning ? '#FCD34D' : '#5EEAD4';

            return (
              <MotiView
                key={cb.category.id}
                from={isUnlocked ? { opacity: 0, translateY: 8 } : { opacity: 1, translateY: 0 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: 250,
                  delay: isUnlocked ? 100 + index * 50 : 0,
                }}
                className="mb-4"
              >
                {/* Category Row */}
                <View className="flex-row items-center mb-2">
                  {/* Category Icon */}
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: cb.category.color }}
                  >
                    <Ionicons
                      name={cb.category.icon as any}
                      size={22}
                      color="#fff"
                    />
                  </View>

                  {/* Category Name & Status */}
                  <View className="flex-1">
                    <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600' }}>
                      {cb.category.category_name}
                    </Text>
                    <Text style={{ color: statusColor, fontSize: 12, marginTop: 2 }}>
                      {isOver
                        ? `${formatAmount(cb.spent - cb.budget_amount, currencySymbol)} over`
                        : `${formatAmount(remaining, currencySymbol)} left`}
                    </Text>
                  </View>

                  {/* Amount Display */}
                  <View className="items-end">
                    <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '700' }}>
                      {formatAmount(cb.spent, currencySymbol)}
                    </Text>
                    <Text style={{ color: '#7C8CA0', fontSize: 12, marginTop: 1 }}>
                      / {formatAmount(cb.budget_amount, currencySymbol)}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: '#4B5563' }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                      borderRadius: 9999,
                      backgroundColor: progressColor,
                    }}
                  />
                </View>

                {/* Percentage */}
                <View className="flex-row justify-end mt-1">
                  <Text style={{ fontSize: 11, color: progressColor, fontWeight: '600' }}>
                    {Math.round(percentage)}%
                  </Text>
                </View>
              </MotiView>
            );
          })}
        </View>

        {/* Total Budget Summary */}
        {categoryBudgets.length >= 1 && (() => {
          const totalPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
          const totalIsOver = totalPercentage > 100;
          const totalIsWarning = totalPercentage >= 80 && totalPercentage < 100;
          const totalRemaining = Math.max(totalLimit - totalSpent, 0);

          const totalProgressColor = totalIsOver ? '#EF4444' : totalIsWarning ? '#F59E0B' : '#2A9D8F';
          const totalStatusColor = totalIsOver ? '#FCA5A5' : totalIsWarning ? '#FCD34D' : '#5EEAD4';

          return (
            <MotiView
              from={isUnlocked ? { opacity: 0, translateY: 8 } : { opacity: 1, translateY: 0 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 250,
                delay: isUnlocked ? 100 + categoryBudgets.length * 50 + 50 : 0,
              }}
              className="px-4 py-3"
              style={{
                borderTopWidth: 1,
                borderTopColor: '#4B5563',
                backgroundColor: '#1E2536',
              }}
            >
              {/* Total Header */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                    style={{ backgroundColor: '#2A9D8F' }}
                  >
                    <Ionicons name="wallet-outline" size={16} color="#fff" />
                  </View>
                  <View>
                    <Text style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '600' }}>
                      Total Budget
                    </Text>
                    <Text style={{ color: totalStatusColor, fontSize: 11, marginTop: 1 }}>
                      {totalIsOver
                        ? `${formatAmount(totalSpent - totalLimit, currencySymbol)} over`
                        : `${formatAmount(totalRemaining, currencySymbol)} left`}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
                    {formatAmount(totalSpent, currencySymbol)}
                  </Text>
                  <Text style={{ color: '#7C8CA0', fontSize: 11, marginTop: 1 }}>
                    / {formatAmount(totalLimit, currencySymbol)}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: '#4B5563' }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${Math.min(Math.max(totalPercentage, 0), 100)}%`,
                    borderRadius: 9999,
                    backgroundColor: totalProgressColor,
                  }}
                />
              </View>

              {/* Percentage */}
              <View className="flex-row justify-end mt-1">
                <Text style={{ fontSize: 11, color: totalProgressColor, fontWeight: '600' }}>
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
