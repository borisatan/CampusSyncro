import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Goal } from '../../types/types';

interface GoalProgressCardProps {
  goal: Goal;
  currencySymbol: string;
  onPress?: () => void;
  compact?: boolean;
}

export function GoalProgressCard({
  goal,
  currencySymbol,
  onPress,
  compact = false,
}: GoalProgressCardProps) {
  const progress = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
  const isComplete = goal.current_amount >= goal.target_amount;

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const Container = onPress ? TouchableOpacity : View;

  if (compact) {
    return (
      <Container
        onPress={onPress}
        className="flex-row items-center py-2"
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: goal.color || '#a78bfa' }}
        >
          <Ionicons
            name={isComplete ? 'checkmark' : (goal.icon as any) || 'flag-outline'}
            size={16}
            color="#fff"
          />
        </View>
        <View className="flex-1">
          <Text className="text-textDark font-medium" numberOfLines={1}>{goal.name}</Text>
          <View className="flex-row items-center mt-1">
            <View className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden mr-2">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  backgroundColor: goal.color || '#a78bfa'
                }}
              />
            </View>
            <Text className="text-secondaryDark text-xs">{Math.round(progress)}%</Text>
          </View>
        </View>
      </Container>
    );
  }

  return (
    <Container
      onPress={onPress}
      className="bg-surfaceDark rounded-xl p-4 mb-3"
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View className="flex-row items-center mb-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: goal.color || '#a78bfa' }}
        >
          <Ionicons
            name={isComplete ? 'checkmark' : (goal.icon as any) || 'flag-outline'}
            size={20}
            color="#fff"
          />
        </View>
        <View className="flex-1">
          <Text className="text-textDark font-semibold text-base">{goal.name}</Text>
          <Text className="text-secondaryDark text-sm">
            {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
          </Text>
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        )}
      </View>

      {/* Progress bar */}
      <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: goal.color || '#a78bfa'
          }}
        />
      </View>

      <View className="flex-row justify-between mt-2">
        <Text className="text-secondaryDark text-xs">
          {isComplete ? 'Goal reached!' : `${formatCurrency(remaining)} to go`}
        </Text>
        <Text className="text-secondaryDark text-xs">
          {Math.round(progress)}%
        </Text>
      </View>
    </Container>
  );
}
