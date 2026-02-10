import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React from "react";
import { Text, View } from "react-native";
import { PiggyBank } from "lucide-react-native";

import { CategoryBudgetStatus } from "../../types/types";

interface SavingsData {
  target: number;
  saved: number;
  percentage: number;
}

interface BudgetHealthCardProps {
  categoryBudgets: CategoryBudgetStatus[];
  allCategoryBudgets: CategoryBudgetStatus[];
  currencySymbol: string;
  isLoading?: boolean;
  isUnlocked?: boolean;
  savingsData?: SavingsData | null;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString("en-US", {
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
  savingsData = null,
}) => {
  if (isLoading) {
    return (
      <View className="rounded-xl p-4 mb-6 bg-surfaceDark border border-borderDark">
        <View className="flex-row items-center mb-4">
          <Text className="text-xl font-semibold text-white">
            Budget health
          </Text>
        </View>
        <View className="h-3 rounded-full overflow-hidden w-3/4 bg-borderDark" />
        <View className="h-3 rounded-full overflow-hidden w-1/2 mt-3 bg-borderDark" />
      </View>
    );
  }

  const hasSavings = savingsData && savingsData.target > 0;

  if (categoryBudgets.length === 0 && !hasSavings) {
    return (
      <MotiView
        from={
          isUnlocked
            ? { opacity: 0, translateY: 8 }
            : { opacity: 1, translateY: 0 }
        }
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 350 }}
      >
        <View className="rounded-2xl p-4 mb-6 bg-surfaceDark border border-borderDark">
          <View className="flex-row items-center mb-3">
            <Text className="text-xl font-semibold text-white">
              Budget health
            </Text>
          </View>
          <Text className="text-sm text-secondaryDark">
            No budget set up yet.
          </Text>
        </View>
      </MotiView>
    );
  }

  const totalSpent = allCategoryBudgets.reduce((sum, cb) => sum + cb.spent, 0);
  const totalLimit = allCategoryBudgets.reduce(
    (sum, cb) => sum + cb.budget_amount,
    0,
  );

  return (
    <MotiView
      from={
        isUnlocked
          ? { opacity: 0, translateY: 8 }
          : { opacity: 1, translateY: 0 }
      }
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 350 }}
    >
      <View className="rounded-2xl overflow-hidden mb-6 bg-surfaceDark border border-borderDark">
        {/* Header */}
        <View className="p-4 pb-0">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-white">
              Budget health
            </Text>
            <Text className="text-xs text-secondaryDark">This month</Text>
          </View>
        </View>

        {/* Individual Category Budget Items */}
        <View className="px-4">
          {categoryBudgets.map((cb, index) => {
            const percentage = cb.percentage_used;
            const isOver = percentage > 100;
            const isWarning = percentage >= 80 && percentage < 100;
            const remaining = Math.max(cb.budget_amount - cb.spent, 0);

            const progressColor = isOver
              ? "#ef4444"
              : isWarning
                ? "#F59E0B"
                : "#22c55e";
            const statusColor = isOver
              ? "#ef4444"
              : isWarning
                ? "#FCD34D"
                : "#22c55e";

            return (
              <MotiView
                key={cb.category.id}
                from={
                  isUnlocked
                    ? { opacity: 0, translateY: 8 }
                    : { opacity: 1, translateY: 0 }
                }
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
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
                    <Text className="text-[15px] font-semibold text-slate-100">
                      {cb.category.category_name}
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: statusColor }}>
                      {isOver
                        ? `${formatAmount(cb.spent - cb.budget_amount, currencySymbol)} over`
                        : `${formatAmount(remaining, currencySymbol)} left`}
                    </Text>
                  </View>

                  {/* Amount Display */}
                  <View className="items-end">
                    <Text className="text-base font-bold text-slate-100">
                      {formatAmount(cb.spent, currencySymbol)}
                    </Text>
                    <Text className="text-xs mt-px text-secondaryDark">
                      / {formatAmount(cb.budget_amount, currencySymbol)}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="h-1.5 rounded-full overflow-hidden bg-borderDark">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                      backgroundColor: progressColor,
                    }}
                  />
                </View>

                {/* Percentage */}
                <View className="flex-row justify-end mt-1">
                  <Text
                    className="text-[11px] font-semibold"
                    style={{ color: progressColor }}
                  >
                    {Math.round(percentage)}%
                  </Text>
                </View>
              </MotiView>
            );
          })}

          {/* Savings Progress Item */}
          {hasSavings && savingsData && (
            <MotiView
              from={
                isUnlocked
                  ? { opacity: 0, translateY: 8 }
                  : { opacity: 1, translateY: 0 }
              }
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "timing",
                duration: 250,
                delay: isUnlocked ? 100 + categoryBudgets.length * 50 : 0,
              }}
              className="mb-4"
            >
              {/* Savings Row */}
              <View className="flex-row items-center mb-2">
                {/* Savings Icon */}
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: "#8A00C2" }}
                >
                  <PiggyBank size={22} color="#fff" />
                </View>

                {/* Savings Name & Status */}
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-slate-100">
                    Monthly Savings
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: "#22C55E" }}>
                    {formatAmount(savingsData.target - savingsData.saved, currencySymbol)} to go
                  </Text>
                </View>

                {/* Amount Display */}
                <View className="items-end">
                  <Text className="text-base font-bold" style={{ color: "#22C55E" }}>
                    {formatAmount(savingsData.saved, currencySymbol)}
                  </Text>
                  <Text className="text-xs mt-px text-secondaryDark">
                    / {formatAmount(savingsData.target, currencySymbol)}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="h-1.5 rounded-full overflow-hidden bg-borderDark">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(Math.max(savingsData.percentage, 0), 100)}%`,
                    backgroundColor: "#22C55E",
                  }}
                />
              </View>

              {/* Percentage */}
              <View className="flex-row justify-end mt-1">
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: "#22C55E" }}
                >
                  {Math.round(savingsData.percentage)}%
                </Text>
              </View>
            </MotiView>
          )}
        </View>

        {/* Total Budget Summary */}
        {categoryBudgets.length >= 1 &&
          (() => {
            const totalPercentage =
              totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
            const totalIsOver = totalPercentage > 100;
            const totalIsWarning =
              totalPercentage >= 80 && totalPercentage < 100;
            const totalRemaining = Math.max(totalLimit - totalSpent, 0);

            const totalProgressColor = totalIsOver
              ? "#ef4444"
              : totalIsWarning
                ? "#F59E0B"
                : "#22c55e";
            const totalStatusColor = totalIsOver
              ? "#ef4444"
              : totalIsWarning
                ? "#FCD34D"
                : "#22c55e";

            const itemCount = categoryBudgets.length + (hasSavings ? 1 : 0);

            return (
              <MotiView
                from={
                  isUnlocked
                    ? { opacity: 0, translateY: 8 }
                    : { opacity: 1, translateY: 0 }
                }
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 250,
                  delay: isUnlocked
                    ? 100 + itemCount * 50 + 50
                    : 0,
                }}
                className="px-4 py-3 border-t border-borderDark"
                style={{ backgroundColor: "#1E2536" }}
              >
                {/* Total Header */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-11 h-11 rounded-xl items-center justify-center mr-3 bg-accentTeal">
                      <Ionicons name="wallet-outline" size={22} color="#fff" />
                    </View>
                    <View>
                      <Text className="text-sm font-semibold text-slate-100">
                        Total Budget
                      </Text>
                      <Text
                        className="text-[11px] mt-px"
                        style={{ color: totalStatusColor }}
                      >
                        {totalIsOver
                          ? `${formatAmount(totalSpent - totalLimit, currencySymbol)} over`
                          : `${formatAmount(totalRemaining, currencySymbol)} left`}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-[15px] font-bold text-slate-100">
                      {formatAmount(totalSpent, currencySymbol)}
                    </Text>
                    <Text className="text-[11px] mt-px text-secondaryDark">
                      / {formatAmount(totalLimit, currencySymbol)}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="h-2 rounded-full overflow-hidden bg-borderDark">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(Math.max(totalPercentage, 0), 100)}%`,
                      backgroundColor: totalProgressColor,
                    }}
                  />
                </View>

                {/* Percentage */}
                <View className="flex-row justify-end mt-1">
                  <Text
                    className="text-[11px] font-semibold"
                    style={{ color: totalProgressColor }}
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
