import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../Shared/AppText';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Goal } from '../../types/types';

interface GoalProgressCardProps {
  goal: Goal;
  currencySymbol: string;
  onPress?: () => void;
  noBg?: boolean;
  isEditMode?: boolean;
}

const formatAmount = (amount: number, symbol: string) =>
  `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export function GoalProgressCard({ goal, currencySymbol, onPress, noBg: _noBg, isEditMode = false }: GoalProgressCardProps) {
  const accentColor = goal.color || '#a78bfa';
  const progress = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;
  const isComplete = goal.current_amount >= goal.target_amount;

  const hasMonthly = !!goal.monthly_contribution && goal.monthly_contribution > 0 && !isComplete;
  const totalSegments = hasMonthly
    ? Math.min(Math.ceil(goal.target_amount / goal.monthly_contribution!), 12)
    : 0;
  const fullSegments = hasMonthly
    ? Math.floor(goal.current_amount / goal.monthly_contribution!)
    : 0;
  const partialFill = hasMonthly
    ? (goal.current_amount % goal.monthly_contribution!) / goal.monthly_contribution!
    : 0;

  let statusText: string;
  if (isComplete) {
    statusText = 'Goal reached!';
  } else if (hasMonthly) {
    const monthsLeft = Math.ceil((goal.target_amount - goal.current_amount) / goal.monthly_contribution!);
    statusText = `${monthsLeft} month${monthsLeft !== 1 ? 's' : ''} left`;
  } else {
    statusText = `${Math.round(progress)}% complete`;
  }
  const statusColor = isComplete ? '#22c55e' : accentColor;

  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withDelay(100, withSpring(progress / 100, { damping: 20, stiffness: 90 }));
  }, [progress]);
  const progressBarStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value * 100}%` }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress}>
      <View
        className={_noBg ? 'overflow-hidden' : 'rounded-2xl overflow-hidden border bg-surfaceDark'}
        style={_noBg ? undefined : { borderColor: '#2A3250' }}
      >
        {/* Top row: icon, name, amounts */}
        <View className="p-4 flex-row items-center">
          <View
            className="w-11 h-11 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: accentColor }}
          >
            <Ionicons
              name={isComplete ? 'checkmark' : (goal.icon as any) || 'flag-outline'}
              size={22}
              color="#fff"
            />
            {isEditMode && (
              <View className="absolute -top-1 -right-1 bg-white rounded-full" style={{ padding: 1 }}>
                <Ionicons name="pencil" size={9} color="#000" />
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-slate50 text-[15px] font-semibold" numberOfLines={1}>
              {goal.name}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: statusColor }}>
              {statusText}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-slate50 text-base font-bold">
              {formatAmount(goal.current_amount, currencySymbol)}
            </Text>
            <Text className="text-slateMuted text-xs mt-0.5">
              / {formatAmount(goal.target_amount, currencySymbol)}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View className="px-4 pb-3">
          {hasMonthly ? (
            <View className="flex-row h-1.5" style={{ gap: 3 }}>
              {Array.from({ length: totalSegments }).map((_, i) => {
                const isFull = i < fullSegments;
                const isPartial = i === fullSegments && partialFill > 0;
                return (
                  <View key={i} className="flex-1 rounded-full overflow-hidden bg-gray600">
                    {(isFull || isPartial) && (
                      <View
                        style={{
                          width: isFull ? '100%' : `${partialFill * 100}%`,
                          height: '100%',
                          backgroundColor: accentColor,
                          borderRadius: 999,
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="h-1.5 rounded-full overflow-hidden bg-gray600">
              <Animated.View
                className="h-full rounded-full"
                style={[{ backgroundColor: isComplete ? '#22c55e' : accentColor }, progressBarStyle]}
              />
            </View>
          )}
          <View className="flex-row justify-end mt-1">
            <Text className="text-[11px] font-semibold" style={{ color: isComplete ? '#22c55e' : accentColor }}>
              {Math.round(progress)}%
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
