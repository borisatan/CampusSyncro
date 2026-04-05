import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Goal } from '../../types/types';

interface GoalProgressCardProps {
  goal: Goal;
  currencySymbol: string;
  onPress?: () => void;
  compact?: boolean;
  noBg?: boolean;
  isEditMode?: boolean;
}

export function GoalProgressCard({
  goal,
  currencySymbol,
  onPress,
  compact = false,
  noBg = false,
  isEditMode = false,
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
      <Container
        onPress={onPress}
        className="flex-row items-center py-2 mb-2"
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
                style={{ width: `${progress}%`, backgroundColor: goal.color || '#a78bfa' }}
              />
            </View>
            <Text className="text-secondaryDark text-xs">{Math.round(progress)}%</Text>
          </View>
        </View>
      </Container>
    );
  }

  const accentColor = goal.color || '#a78bfa';

  return (
    <Container
      onPress={onPress}
      className={noBg ? 'p-4' : 'bg-surfaceDark rounded-xl p-2 mb-2'}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header */}
      <View className="flex-row items-center">
        <View
          className="w-14 h-14 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: accentColor }}
        >
          <Ionicons
            name={isComplete ? 'checkmark' : (goal.icon as any) || 'flag-outline'}
            size={28}
            color="#fff"
          />
          {isEditMode && (
            <View className="absolute -top-1 -right-1 bg-white rounded-full border border-white">
              <Ionicons name="pencil" size={10} color="#000" />
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-textDark font-bold text-2xl" numberOfLines={1}>
            {goal.name}
          </Text>
        </View>
      </View>

      {/* Inner progress box */}
      <View className="rounded-xl p-3 mt-1">
        <Text className="text-right text-base font-semibold">
          <Text style={{ color: accentColor }}>{formatCurrency(goal.current_amount)}</Text>
          <Text className="text-secondaryDark"> of {formatCurrency(goal.target_amount)}</Text>
        </Text>

        <View className="h-2 rounded-full overflow-hidden mt-2" style={{ backgroundColor: '#2A3250' }}>
          <View
            style={{ width: `${progress}%`, height: '100%', backgroundColor: accentColor, borderRadius: 999 }}
          />
        </View>

        <View className="flex-row justify-end mt-1.5">
          <Text className="text-xs font-semibold" style={{ color: accentColor }}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>
    </Container>
  );
}
