import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';

import { AnimatedToggle } from '../Shared/AnimatedToggle';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
  interpolateColor,
  FadeIn,
} from 'react-native-reanimated';

import { useBudgetStore } from '../../store/useBudgetStore';
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
  onSave: (categoryId: number, amount: number | null, percentage?: number | null) => void;
  showOnDashboard: boolean;
  onToggleDashboard: (categoryId: number) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
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
  const storeBudget = useBudgetStore((state) =>
    state.categoryBudgets.find((cb) => cb.category.id === category.id)
  );

  const budgetData = storeBudget ?? item;
  const hasBudget = budgetData != null;
  const budget_amount = budgetData?.budget_amount ?? 0;
  const spent = budgetData?.spent ?? 0;
  const percentage_used = budgetData?.percentage_used ?? 0;
  const [amountText, setAmountText] = useState(budget_amount > 0 ? budget_amount.toString() : '');
  const [budgetMode, setBudgetMode] = useState<BudgetMode>(
    category.budget_percentage != null && category.budget_percentage > 0 ? 'percentage' : 'fixed'
  );
  const [percentText, setPercentText] = useState(
    category.budget_percentage != null && category.budget_percentage > 0
      ? category.budget_percentage.toString()
      : ''
  );

  const handleModeChange = (newMode: BudgetMode) => {
    if (newMode === budgetMode) return;

    if (newMode === 'percentage') {
      const currentAmount = parseFloat(amountText) || budget_amount;
      if (currentAmount > 0 && monthlyIncome > 0) {
        const pct = (currentAmount / monthlyIncome) * 100;
        setPercentText(pct.toFixed(1));
      }
    } else {
      const currentPct = parseFloat(percentText);
      if (!isNaN(currentPct) && currentPct > 0 && monthlyIncome > 0) {
        const amount = Math.round((currentPct / 100) * monthlyIncome);
        setAmountText(amount.toString());
      }
    }
    setBudgetMode(newMode);
  };

  const isOver = hasBudget && percentage_used > 100;
  const isWarning = hasBudget && percentage_used >= 90 && percentage_used <= 100;
  const remaining = Math.max(budget_amount - spent, 0);

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (hasBudget) {
      progressWidth.value = withDelay(
        100,
        withSpring(Math.min(Math.max(percentage_used, 0), 100) / 100, {
          damping: 20,
          stiffness: 90,
        })
      );
    } else {
      progressWidth.value = withTiming(0, { duration: 200 });
    }
  }, [percentage_used, hasBudget]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const toggleProgress = useSharedValue(0);

  useEffect(() => {
    setAmountText(budget_amount > 0 ? budget_amount.toString() : '');
  }, [budget_amount]);

  useEffect(() => {
    if (category.budget_percentage != null && category.budget_percentage > 0) {
      setBudgetMode('percentage');
      setPercentText(category.budget_percentage.toString());
    } else {
      setBudgetMode('fixed');
    }
  }, [category.budget_percentage]);

  useEffect(() => {
    toggleProgress.value = withTiming(budgetMode === 'percentage' ? 1 : 0, { duration: 200 });
  }, [budgetMode]);

  const sliderStyle = useAnimatedStyle(() => ({
    left: `${toggleProgress.value * 50}%`,
  }));

  const fixedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(toggleProgress.value, [0, 1], ['#ffffff', '#64748B']),
  }));

  const percentTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(toggleProgress.value, [0, 1], ['#64748B', '#ffffff']),
  }));

  const handleSave = () => {
    if (budgetMode === 'percentage') {
      const pct = parseFloat(percentText);
      if (isNaN(pct) || pct <= 0 || monthlyIncome <= 0) return;
      const computedAmount = Math.round((pct / 100) * monthlyIncome);
      onSave(category.id, computedAmount, pct);
    } else {
      const amount = parseFloat(amountText);
      if (isNaN(amount) || amount <= 0) return;
      onSave(category.id, amount, null);
    }
    onToggleExpand();
  };

  const handleClear = () => {
    onToggleExpand();
    setAmountText('');
    setPercentText('');
    setBudgetMode('fixed');
    onSave(category.id, null, null);
  };

  const progressColor = isOver ? '#F2514A' : isWarning ? '#F4A623' : '#22D97A';
  const statusColor = isOver ? '#FCA5A5' : isWarning ? '#FCD34D' : '#22D97A';

  return (
    <Pressable onPress={onToggleExpand}>
      <View
        className="rounded-2xl overflow-hidden border bg-surfaceDark"
        style={{ borderColor: expanded ? `${category.color}40` : '#2A3250' }}
      >
        {/* Top row: icon, name, amount */}
        <View className="p-4 flex-row items-center">
          <View
            className="w-11 h-11 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: category.color }}
          >
            <Ionicons name={category.icon as any} size={22} color="#fff" />
          </View>

          <View className="flex-1">
            <Text className="text-slate50 text-[15px] font-semibold">
              {category.category_name}
            </Text>
            {hasBudget && (
              <Text className="text-xs mt-0.5" style={{ color: statusColor }}>
                {isOver
                  ? `${formatAmount(spent - budget_amount, currencySymbol)} over`
                  : `${formatAmount(remaining, currencySymbol)} left`}
              </Text>
            )}
          </View>

          <View className="items-end">
            {hasBudget ? (
              <>
                <Text className="text-slate50 text-base font-bold">
                  {formatAmount(spent, currencySymbol)}
                </Text>
                <Text className="text-slateMuted text-xs mt-0.5">
                  / {formatAmount(budget_amount, currencySymbol)}
                </Text>
              </>
            ) : (
              <View className="px-3 py-1 rounded-full bg-gray600">
                <Text className="text-slateMuted text-xs">No budget</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress bar */}
        {hasBudget && (
          <View className="px-4 pb-3">
            <View className="h-1.5 rounded-full overflow-hidden bg-gray600">
              <Animated.View
                className="h-full rounded-full"
                style={[{ backgroundColor: progressColor }, progressBarStyle]}
              />
            </View>
            <View className="flex-row justify-end mt-1">
              <Text className="text-[11px] font-semibold" style={{ color: progressColor }}>
                {Math.round(percentage_used)}%
              </Text>
            </View>
          </View>
        )}

        {/* Expanded Edit Section */}
        {expanded && (
          <View className="px-4 pb-4 pt-[14px] border-t border-borderDark">
            {/* Mode toggle */}
            <Animated.View entering={FadeIn.duration(200).delay(50)}>
              <View className="rounded-xl flex-row mb-4 bg-inputDark border border-borderDark overflow-hidden">
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      width: '50%',
                      borderRadius: 11,
                      backgroundColor: '#1DB8A3',
                    },
                    sliderStyle,
                  ]}
                />
                <TouchableOpacity
                  onPress={() => handleModeChange('fixed')}
                  className="flex-1 py-2.5 z-10"
                  activeOpacity={0.7}
                >
                  <Animated.Text style={[{ textAlign: 'center', fontWeight: '500', fontSize: 13 }, fixedTextStyle]}>
                    Fixed Amount
                  </Animated.Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleModeChange('percentage')}
                  className="flex-1 py-2.5 z-10"
                  activeOpacity={0.7}
                >
                  <Animated.Text style={[{ textAlign: 'center', fontWeight: '500', fontSize: 13 }, percentTextStyle]}>
                    % of Income
                  </Animated.Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeIn.duration(200).delay(100)}>
              {budgetMode === 'fixed' ? (
                <View>
                  <Text className="text-secondaryDark text-[11px] mb-1.5 uppercase tracking-wide">
                    Budget Amount
                  </Text>
                  <View className="flex-row items-center px-3 h-12 rounded-xl bg-inputDark border border-borderDark">
                    <Text className="text-slateMuted text-base mr-1">{currencySymbol}</Text>
                    <TextInput
                      className="flex-1 py-0 text-slate50 text-base"
                      value={amountText}
                      onChangeText={setAmountText}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      selectionColor={category.color}
                    />
                  </View>
                  {amountText !== '' && !isNaN(parseFloat(amountText)) && monthlyIncome > 0 && (
                    <Text className="text-secondaryDark text-xs mt-1.5">
                      = {((parseFloat(amountText) / monthlyIncome) * 100).toFixed(1)}% of income
                    </Text>
                  )}
                </View>
              ) : (
                <View>
                  <Text className="text-secondaryDark text-[11px] mb-1.5 uppercase tracking-wide">
                    Percentage of Income ({formatAmount(monthlyIncome, currencySymbol)}/mo)
                  </Text>
                  <View className="flex-row items-center px-3 h-12 rounded-xl bg-inputDark border border-borderDark">
                    <TextInput
                      className="flex-1 py-0 text-slate50 text-base"
                      value={percentText}
                      onChangeText={setPercentText}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      selectionColor={category.color}
                    />
                    <Text className="text-slateMuted text-base ml-1">%</Text>
                  </View>
                  {percentText !== '' && !isNaN(parseFloat(percentText)) && monthlyIncome > 0 && (
                    <Text className="text-secondaryDark text-xs mt-1.5">
                      = {formatAmount(Math.round((parseFloat(percentText) / 100) * monthlyIncome), currencySymbol)}
                    </Text>
                  )}
                </View>
              )}
            </Animated.View>

            {/* Action buttons */}
            <Animated.View entering={FadeIn.duration(200).delay(150)} className="mt-4 flex-row gap-2.5">
              {hasBudget && (
                <TouchableOpacity
                  onPress={handleClear}
                  className="flex-1 rounded-xl py-3 items-center bg-accentRed"
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold text-sm">Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 rounded-xl py-3 items-center bg-accentTeal"
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold text-sm">
                  {hasBudget ? 'Save' : 'Set Budget'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Show on Dashboard toggle */}
            {hasBudget && (
              <Animated.View entering={FadeIn.duration(200).delay(200)} className="mt-4 flex-row items-center justify-between">
                <Text className="text-secondaryDark text-[13px]">Show on Dashboard</Text>
                <View onStartShouldSetResponder={() => true}>
                  <AnimatedToggle
                    value={showOnDashboard}
                    onValueChange={() => onToggleDashboard(category.id)}
                    activeColor="#1DB8A3"
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
