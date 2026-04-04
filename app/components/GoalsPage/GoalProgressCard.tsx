import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Goal } from '../../types/types';
import { RipplePressable } from '../Shared/RipplePressable';

interface GoalProgressCardProps {
  goal: Goal;
  currencySymbol: string;
  onPress?: () => void;
  onAddPress?: () => void;
  onWithdrawPress?: () => void;
  compact?: boolean;
  noBg?: boolean;
}

export function GoalProgressCard({
  goal,
  currencySymbol,
  onPress,
  onAddPress,
  onWithdrawPress,
  compact = false,
  noBg = false,
}: GoalProgressCardProps) {
  const progress = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;

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
                <RipplePressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onAddPress();
                  }}
                  className="flex-row items-center justify-center py-1.5 rounded-lg bg-green-600/20 border border-green-600/30 overflow-hidden"
                  rippleColor="rgba(16, 185, 129, 0.3)"
                >
                  <Ionicons name="add-circle" size={14} color="#10B981" />
                  <Text className="text-green-500 font-medium ml-1 text-xs">Add</Text>
                </RipplePressable>
              </View>
            )}
            {onWithdrawPress && (
              <View style={{ flex: 1, marginLeft: 4 }}>
                <RipplePressable
                  onPress={() => {
                    if (goal.current_amount > 0) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onWithdrawPress();
                    }
                  }}
                  disabled={goal.current_amount === 0}
                  className={`flex-row items-center justify-center py-1.5 rounded-lg overflow-hidden ${
                    goal.current_amount > 0
                      ? 'bg-accentRed/20 border border-accentRed/30'
                      : 'bg-gray-600/20 border border-gray-600/30'
                  }`}
                  rippleColor={goal.current_amount > 0 ? "rgba(242, 81, 74, 0.3)" : "rgba(107, 114, 128, 0.2)"}
                >
                  <Ionicons
                    name="remove-circle"
                    size={14}
                    color={goal.current_amount > 0 ? "#F2514A" : "#6B7280"}
                  />
                  <Text className={`font-medium ml-1 text-xs ${
                    goal.current_amount > 0 ? 'text-accentRed' : 'text-gray-500'
                  }`}>
                    Withdraw
                  </Text>
                </RipplePressable>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  const accentColor = goal.color || '#a78bfa';

  return (
    <View className={noBg ? 'p-4' : 'bg-surfaceDark rounded-xl p-2 mb-2'}>
      {/* Header */}
      <Container
        onPress={onPress}
        className="flex-row items-center"
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View
          className="w-14 h-14 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: accentColor }}
        >
          <Ionicons
            name={isComplete ? 'checkmark' : (goal.icon as any) || 'flag-outline'}
            size={28}
            color="#fff"
          />
        </View>
        <View className="flex-1">
          <Text className="text-textDark font-bold text-2xl" numberOfLines={1}>
            {goal.name}
          </Text>
        </View>
      </Container>

      {/* Inner progress box */}
      <View className="rounded-xl p-3 mt-1">
        {/* Amount row */}
        <Text className="text-right text-base font-semibold">
          <Text style={{ color: accentColor }}>{formatCurrency(goal.current_amount)}</Text>
          <Text className="text-secondaryDark"> of {formatCurrency(goal.target_amount)}</Text>
        </Text>

        {/* Progress bar */}
        <View className="h-2 rounded-full overflow-hidden mt-2" style={{ backgroundColor: '#2A3250' }}>
          <View
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: accentColor,
              borderRadius: 999,
            }}
          />
        </View>

        {/* Percentage */}
        <View className="flex-row justify-end mt-1.5">
          <Text className="text-xs font-semibold" style={{ color: accentColor }}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      {(onAddPress || onWithdrawPress) && (
        <View className="flex-row mt-3 pt-3 border-t border-borderDark">
          {onAddPress && (
            <View style={{ flex: 1, marginRight: 4 }}>
              <RipplePressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onAddPress();
                }}
                className="flex-row items-center justify-center py-2 rounded-lg bg-green-600/20 border border-green-600/30 overflow-hidden"
                rippleColor="rgba(16, 185, 129, 0.3)"
              >
                <Ionicons name="add-circle" size={16} color="#10B981" />
                <Text className="text-green-500 font-medium ml-2">Add</Text>
              </RipplePressable>
            </View>
          )}
          {onWithdrawPress && (
            <View style={{ flex: 1, marginLeft: 4 }}>
              <RipplePressable
                onPress={() => {
                  if (goal.current_amount > 0) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onWithdrawPress();
                  }
                }}
                disabled={goal.current_amount === 0}
                className={`flex-row items-center justify-center py-2 rounded-lg overflow-hidden ${
                  goal.current_amount > 0
                    ? 'bg-accentRed/20 border border-accentRed/30'
                    : 'bg-gray-600/20 border border-gray-600/30'
                }`}
                rippleColor={goal.current_amount > 0 ? "rgba(242, 81, 74, 0.3)" : "rgba(107, 114, 128, 0.2)"}
              >
                <Ionicons
                  name="remove-circle"
                  size={16}
                  color={goal.current_amount > 0 ? "#F2514A" : "#6B7280"}
                />
                <Text className={`font-medium ml-2 ${
                  goal.current_amount > 0 ? 'text-accentRed' : 'text-gray-500'
                }`}>
                  Withdraw
                </Text>
              </RipplePressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
