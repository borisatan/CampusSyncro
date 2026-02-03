import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';

import { AnimatedToggle } from '../Shared/AnimatedToggle';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
  FadeIn,
} from 'react-native-reanimated';

import { Category, CategoryBudgetStatus } from '../../types/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type BudgetMode = 'fixed' | 'percentage';

interface CategoryBudgetRowProps {
  item: CategoryBudgetStatus | null;
  category: Category;
  currencySymbol: string;
  monthlyIncome: number;
  onSave: (categoryId: number, amount: number | null) => void;
  showOnDashboard: boolean;
  onToggleDashboard: (categoryId: number) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const CategoryBudgetRow: React.FC<CategoryBudgetRowProps> = ({
  item,
  category,
  currencySymbol,
  monthlyIncome,
  onSave,
  showOnDashboard,
  onToggleDashboard,
  expanded,
  onToggleExpand,
}) => {
  const hasBudget = item != null;
  const budget_amount = item?.budget_amount ?? 0;
  const spent = item?.spent ?? 0;
  const percentage_used = item?.percentage_used ?? 0;
  const [amountText, setAmountText] = useState(budget_amount > 0 ? budget_amount.toString() : '');
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('fixed');
  const [percentText, setPercentText] = useState('');

  const isOver = hasBudget && percentage_used > 100;
  const isWarning = hasBudget && percentage_used >= 80 && percentage_used < 100;
  const remaining = Math.max(budget_amount - spent, 0);

  // Animated toggle: 0 = fixed, 1 = percentage
  const toggleProgress = useSharedValue(0);

  useEffect(() => {
    setAmountText(budget_amount > 0 ? budget_amount.toString() : '');
  }, [budget_amount]);

  useEffect(() => {
    toggleProgress.value = withTiming(budgetMode === 'percentage' ? 1 : 0, { duration: 200 });
  }, [budgetMode]);

  const sliderStyle = useAnimatedStyle(() => ({
    left: `${toggleProgress.value * 50}%`,
    backgroundColor: '#2563EB',
  }));

  const fixedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      toggleProgress.value,
      [0, 1],
      ['#ffffff', '#94a3b8']
    ),
  }));

  const percentTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      toggleProgress.value,
      [0, 1],
      ['#94a3b8', '#ffffff']
    ),
  }));

  const toggleExpanded = () => {
    onToggleExpand();
  };

  const handleSave = () => {
    if (budgetMode === 'percentage') {
      const pct = parseFloat(percentText);
      if (isNaN(pct) || pct <= 0 || monthlyIncome <= 0) return;
      const computedAmount = Math.round((pct / 100) * monthlyIncome);
      onSave(category.id, computedAmount);
    } else {
      const amount = parseFloat(amountText);
      if (isNaN(amount) || amount <= 0) return;
      onSave(category.id, amount);
    }
    onToggleExpand();
  };

  const handleClear = () => {
    onToggleExpand();
    setAmountText('');
    setPercentText('');
    setBudgetMode('fixed');
    onSave(category.id, null);
  };

  const progressColor = isOver
    ? '#f43f5e'
    : isWarning
    ? '#eab308'
    : '#22c55e';

  return (
    <Pressable onPress={toggleExpanded}>
      <View className="rounded-2xl p-4 shadow-lg bg-surfaceDark border border-borderDark">
        {/* Top row: icon, name, amount */}
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: category.color }}
          >
            <Ionicons name={category.icon as any} size={24} color="#fff" />
          </View>

          <View className="flex-1">
            <Text className="text-white text-lg">{category.category_name}</Text>
          </View>

          <View className="items-end">
            {hasBudget ? (
              <>
                <Text className="text-white text-lg font-bold">
                  {formatAmount(spent, currencySymbol)}
                </Text>
                <Text className="text-secondaryDark text-sm">
                  of {formatAmount(budget_amount, currencySymbol)}
                </Text>
              </>
            ) : (
              <Text className="text-secondaryDark text-sm">No budget</Text>
            )}
          </View>
        </View>

        {/* Progress bar */}
        {hasBudget && (
          <View className="mt-3">
            <View className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <View
                style={{
                  height: '100%',
                  width: `${Math.min(Math.max(percentage_used, 0), 100)}%`,
                  borderRadius: 9999,
                  backgroundColor: progressColor,
                }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-textDark text-xs">
                {formatAmount(remaining, currencySymbol)} left
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: isOver
                    ? '#fb7185'
                    : isWarning
                    ? '#facc15'
                    : '#22c55e',
                }}
              >
                {Math.round(percentage_used)}%
              </Text>
            </View>
          </View>
        )}

        {/* Expanded Edit Section */}
        {expanded && (
          <View
            className={`${hasBudget ? 'mt-4' : 'mt-3'} pt-4 border-t border-slate-700`}
          >
            {/* Animated sliding toggle */}
            <Animated.View entering={FadeIn.duration(300).delay(50)}>
              <View className="bg-slate-800 rounded-2xl p-1 flex-row mb-4 border border-slate-700" style={{ position: 'relative' }}>
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      top: 4,
                      width: '50%',
                      height: '100%',
                      borderRadius: 12,
                    },
                    sliderStyle,
                  ]}
                />
                <TouchableOpacity
                  onPress={() => {
                    setBudgetMode('fixed');
                  }}
                  className="flex-1 py-2.5 rounded-xl z-10"
                  activeOpacity={0.7}
                >
                  <Animated.Text style={[{ textAlign: 'center', fontWeight: '500', fontSize: 14 }, fixedTextStyle]}>
                    Fixed Amount
                  </Animated.Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setBudgetMode('percentage');
                  }}
                  className="flex-1 py-2.5 rounded-xl z-10"
                  activeOpacity={0.7}
                >
                  <Animated.Text style={[{ textAlign: 'center', fontWeight: '500', fontSize: 14 }, percentTextStyle]}>
                    % of Income
                  </Animated.Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeIn.duration(300).delay(100)}>
              {budgetMode === 'fixed' ? (
                <View>
                  <Text className="text-secondaryDark text-xs mb-2">Budget Amount</Text>
                  <View className="flex-row items-center bg-slate-800 rounded-xl border border-slate-700 px-3 h-12">
                    <Text className="text-secondaryDark text-base mr-1">{currencySymbol}</Text>
                    <TextInput
                      className="flex-1 text-white text-base py-0"
                      value={amountText}
                      onChangeText={setAmountText}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      selectionColor={category.color}
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <Text className="text-secondaryDark text-xs mb-2">
                    Percentage of Income ({formatAmount(monthlyIncome, currencySymbol)}/mo)
                  </Text>
                  <View className="flex-row items-center bg-slate-800 rounded-xl border border-slate-700 px-3 h-12">
                    <TextInput
                      className="flex-1 text-white text-base py-0"
                      value={percentText}
                      onChangeText={setPercentText}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      selectionColor={category.color}
                    />
                    <Text className="text-secondaryDark text-base ml-1">%</Text>
                  </View>
                  {percentText !== '' && !isNaN(parseFloat(percentText)) && monthlyIncome > 0 && (
                    <Text className="text-secondaryDark text-xs mt-2">
                      = {formatAmount(Math.round((parseFloat(percentText) / 100) * monthlyIncome), currencySymbol)}
                    </Text>
                  )}
                </View>
              )}
            </Animated.View>

            {/* Action buttons */}
            <Animated.View entering={FadeIn.duration(300).delay(150)} className="mt-4 flex-row gap-3">
              {hasBudget && (
                <TouchableOpacity
                  onPress={handleClear}
                  className="flex-1 rounded-xl py-3 items-center bg-accentRed"
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold text-base">Remove Budget</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 bg-accentTeal rounded-xl py-3 items-center"
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold text-base">
                  {hasBudget ? 'Save' : 'Set Budget'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Show on Dashboard toggle */}
            {hasBudget && (
              <Animated.View entering={FadeIn.duration(300).delay(200)} className="mt-4 flex-row items-center justify-between">
                <Text className="text-secondaryDark text-sm">Show on Dashboard</Text>
                <View onStartShouldSetResponder={() => true}>
                  <AnimatedToggle
                    value={showOnDashboard}
                    onValueChange={() => onToggleDashboard(category.id)}
                    activeColor="#22c55e"
                    inactiveColor="#334155"
                  />
                </View>
              </Animated.View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};
