import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Goal } from '../../types/types';

interface GoalProgressCardProps {
  goal: Goal;
  currencySymbol: string;
  onPress?: () => void;
  onAddPress?: () => void;
  onWithdrawPress?: () => void;
  compact?: boolean;
}

export function GoalProgressCard({
  goal,
  currencySymbol,
  onPress,
  onAddPress,
  onWithdrawPress,
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
      <View className="mb-2">
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

        {/* Compact Action Buttons */}
        {(onAddPress || onWithdrawPress) && (
          <View className="flex-row mt-2" style={{ marginLeft: 44 }}>
            {onAddPress && (
              <View style={{ flex: 1, marginRight: 4 }}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onAddPress();
                  }}
                  className="flex-row items-center justify-center py-1.5 rounded-lg bg-green-600/20 border border-green-600/30"
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  <Ionicons name="add-circle" size={14} color="#10B981" />
                  <Text className="text-green-500 font-medium ml-1 text-xs">Add</Text>
                </Pressable>
              </View>
            )}
            {onWithdrawPress && (
              <View style={{ flex: 1, marginLeft: 4 }}>
                <Pressable
                  onPress={() => {
                    if (goal.current_amount > 0) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onWithdrawPress();
                    }
                  }}
                  disabled={goal.current_amount === 0}
                  className={`flex-row items-center justify-center py-1.5 rounded-lg ${
                    goal.current_amount > 0
                      ? 'bg-orange-600/20 border border-orange-600/30'
                      : 'bg-gray-600/20 border border-gray-600/30'
                  }`}
                  style={({ pressed }) => [{ opacity: pressed && goal.current_amount > 0 ? 0.6 : 1 }]}
                >
                  <Ionicons
                    name="remove-circle"
                    size={14}
                    color={goal.current_amount > 0 ? "#F59E0B" : "#6B7280"}
                  />
                  <Text className={`font-medium ml-1 text-xs ${
                    goal.current_amount > 0 ? 'text-orange-500' : 'text-gray-500'
                  }`}>
                    Withdraw
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="bg-surfaceDark rounded-xl p-4 mb-3">
      <Container
        onPress={onPress}
        className="flex-1"
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

      {/* Action Buttons */}
      {(onAddPress || onWithdrawPress) && (
        <View className="flex-row mt-3 pt-3 border-t border-borderDark">
          {onAddPress && (
            <View style={{ flex: 1, marginRight: 4 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onAddPress();
                }}
                className="flex-row items-center justify-center py-2 rounded-lg bg-green-600/20 border border-green-600/30"
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="add-circle" size={16} color="#10B981" />
                <Text className="text-green-500 font-medium ml-2">Add</Text>
              </Pressable>
            </View>
          )}
          {onWithdrawPress && (
            <View style={{ flex: 1, marginLeft: 4 }}>
              <Pressable
                onPress={() => {
                  if (goal.current_amount > 0) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onWithdrawPress();
                  }
                }}
                disabled={goal.current_amount === 0}
                className={`flex-row items-center justify-center py-2 rounded-lg ${
                  goal.current_amount > 0
                    ? 'bg-orange-600/20 border border-orange-600/30'
                    : 'bg-gray-600/20 border border-gray-600/30'
                }`}
                style={({ pressed }) => [{ opacity: pressed && goal.current_amount > 0 ? 0.6 : 1 }]}
              >
                <Ionicons
                  name="remove-circle"
                  size={16}
                  color={goal.current_amount > 0 ? "#F59E0B" : "#6B7280"}
                />
                <Text className={`font-medium ml-2 ${
                  goal.current_amount > 0 ? 'text-orange-500' : 'text-gray-500'
                }`}>
                  Withdraw
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
