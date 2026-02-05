import { Ionicons } from '@expo/vector-icons';
import { PiggyBank, TrendingUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { LayoutAnimation, Text, TouchableOpacity, View } from 'react-native';

interface AccountBreakdown {
  account: {
    id: number;
    account_name: string;
    type: string;
  };
  savedThisMonth: number;
  goal: number | null;
  progressPercent: number;
}

interface SavingsCardProps {
  totalSavedThisMonth: number;
  savingsGoalTotal: number;
  goalProgress: number;
  accountBreakdown: AccountBreakdown[];
  currencySymbol: string;
  isLoading: boolean;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const SavingsCard: React.FC<SavingsCardProps> = ({
  totalSavedThisMonth,
  savingsGoalTotal,
  goalProgress,
  accountBreakdown,
  currencySymbol,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const hasGoal = savingsGoalTotal > 0;

  return (
    <View className="bg-accentPurple rounded-2xl mb-4 overflow-hidden border border-borderDark">
      {/* Main card content */}
      <View className="p-5">
        {/* Header with chevron */}
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <PiggyBank size={16} color="rgba(255,255,255,0.8)" />
            <Text className="text-white/80 text-sm ml-2">Saved This Month</Text>
          </View>
          <TouchableOpacity
            onPress={handleToggleExpand}
            className="w-8 h-8 bg-white/20 rounded-lg items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <Text style={{ fontSize: 32, fontWeight: '700', color: '#FFFFFF' }}>
          {isLoading ? '...' : formatAmount(totalSavedThisMonth, currencySymbol)}
        </Text>

        {/* Goal progress bar */}
        {hasGoal && (
          <View className="mt-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-white/60 text-xs">
                {Math.round(goalProgress)}% of goal
              </Text>
              <Text className="text-white/60 text-xs">
                {formatAmount(savingsGoalTotal, currencySymbol)}
              </Text>
            </View>
            <View className="h-2 bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-white rounded-full"
                style={{ width: `${Math.min(goalProgress, 100)}%` }}
              />
            </View>
          </View>
        )}
      </View>

      {/* Expanded breakdown section */}
      {isExpanded && (
        <View className="border-t border-white/15 px-5 pt-4 pb-5 bg-surfaceDark rounded-b-2xl">
          <Text className="text-white/60 text-xs uppercase tracking-wide mb-3">
            By Account
          </Text>
          {accountBreakdown.map((item) => (
            <View
              key={item.account.id}
              className="flex-row items-center justify-between py-3 border-b border-borderDark"
            >
              <View className="flex-row items-center flex-1">
                {item.account.type === 'investment' ? (
                  <View className="w-8 h-8 rounded-full bg-accentTeal/20 items-center justify-center mr-3">
                    <TrendingUp size={16} color="#2dd4bf" />
                  </View>
                ) : (
                  <View className="w-8 h-8 rounded-full bg-accentPurple/20 items-center justify-center mr-3">
                    <PiggyBank size={16} color="#a78bfa" />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-white font-medium" numberOfLines={1}>
                    {item.account.account_name}
                  </Text>
                  {item.goal && item.goal > 0 && (
                    <Text className="text-white/50 text-xs">
                      Goal: {formatAmount(item.goal, currencySymbol)}/mo
                    </Text>
                  )}
                </View>
              </View>
              <View className="items-end">
                <Text className="text-white font-semibold">
                  {formatAmount(item.savedThisMonth, currencySymbol)}
                </Text>
                {item.goal && item.goal > 0 && (
                  <Text
                    className="text-xs"
                    style={{
                      color: item.progressPercent >= 100 ? '#4ade80' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {Math.round(item.progressPercent)}%
                  </Text>
                )}
              </View>
            </View>
          ))}

          {accountBreakdown.length === 0 && (
            <Text className="text-white/40 text-center py-4">
              No savings or investment accounts yet
            </Text>
          )}

          <Text className="text-white/40 text-xs text-center mt-4 italic">
            Savings calculated as balance change since start of month
          </Text>
        </View>
      )}
    </View>
  );
};
