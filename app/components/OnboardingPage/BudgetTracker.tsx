import React from 'react';
import { View, Text } from 'react-native';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';

interface BudgetTrackerProps {
  target: number;
  remaining: number;
  currencySymbol: string;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  target,
  remaining,
  currencySymbol,
}) => {
  const spent = target - remaining;
  const progress = target > 0 ? (spent / target) * 100 : 0;

  return (
    <View className="bg-surfaceDark rounded-xl p-4 border border-borderDark mb-4">
      <Text className="text-secondaryDark text-sm mb-2">Remaining Budget</Text>
      <View className="flex-row items-baseline">
        <Text className="text-textDark text-lg mr-1">{currencySymbol}</Text>
        <AnimatedRollingNumber
          value={remaining}
          spinningAnimationConfig={{ duration: 400 }}
          textStyle={{ fontSize: 32, fontWeight: '600', color: '#FFFFFF' }}
          toFixed={0}
        />
      </View>
      <View className="w-full h-2 bg-borderDark rounded-full mt-3">
        <View
          className="h-2 bg-accentTeal rounded-full"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </View>
      <Text className="text-secondaryDark text-xs mt-2">
        {progress.toFixed(0)}% of {currencySymbol}
        {target.toLocaleString()} spent
      </Text>
    </View>
  );
};
