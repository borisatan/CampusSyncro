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
  // Subscribe to this category's budget from the store for reactive updates
  const storeBudget = useBudgetStore((state) =>
    state.categoryBudgets.find((cb) => cb.category.id === category.id)
  );

  // Use store data if available, otherwise fall back to prop
  const budgetData = storeBudget ?? item;
  const hasBudget = budgetData != null;
  const budget_amount = budgetData?.budget_amount ?? 0;
  const spent = budgetData?.spent ?? 0;
  const percentage_used = budgetData?.percentage_used ?? 0;
  const [amountText, setAmountText] = useState(budget_amount > 0 ? budget_amount.toString() : '');
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('fixed');
  const [percentText, setPercentText] = useState('');

  // Calculate budget as percentage of income (for display)
  const budgetPercentOfIncome = monthlyIncome > 0 ? (budget_amount / monthlyIncome) * 100 : 0;

  // Handle mode toggle with pre-population
  const handleModeChange = (newMode: BudgetMode) => {
    if (newMode === budgetMode) return;

    if (newMode === 'percentage') {
      // Switching to percentage mode - calculate % from current amount
      const currentAmount = parseFloat(amountText) || budget_amount;
      if (currentAmount > 0 && monthlyIncome > 0) {
        const pct = (currentAmount / monthlyIncome) * 100;
        setPercentText(pct.toFixed(1));
      }
    } else {
      // Switching to fixed mode - calculate amount from current percentage
      const currentPct = parseFloat(percentText);
      if (!isNaN(currentPct) && currentPct > 0 && monthlyIncome > 0) {
        const amount = Math.round((currentPct / 100) * monthlyIncome);
        setAmountText(amount.toString());
      }
    }
    setBudgetMode(newMode);
  };

  const isOver = hasBudget && percentage_used > 100;
  const isWarning = hasBudget && percentage_used >= 80 && percentage_used < 100;
  const remaining = Math.max(budget_amount - spent, 0);

  // Animated progress bar
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
  }));

  const fixedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      toggleProgress.value,
      [0, 1],
      ['#ffffff', '#64748B']
    ),
  }));

  const percentTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      toggleProgress.value,
      [0, 1],
      ['#64748B', '#ffffff']
    ),
  }));

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
    ? '#EF4444'
    : isWarning
    ? '#F59E0B'
    : '#22c55e';

  const statusColor = isOver
    ? '#FCA5A5'
    : isWarning
    ? '#FCD34D'
    : '#22c55e';

  return (
    <Pressable onPress={onToggleExpand}>
      <View
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: '#20283A',
          borderWidth: 1,
          borderColor: expanded ? `${category.color}40` : '#4B5563',
        }}
      >
        {/* Top row: icon, name, amount */}
        <View className="p-4 flex-row items-center">
          {/* Category icon */}
          <View
            className="w-11 h-11 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: category.color }}
          >
            <Ionicons name={category.icon as any} size={22} color="#fff" />
          </View>

          <View className="flex-1">
            <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600' }}>
              {category.category_name}
            </Text>
            {hasBudget && (
              <Text style={{ color: statusColor, fontSize: 12, marginTop: 2 }}>
                {isOver
                  ? `${formatAmount(spent - budget_amount, currencySymbol)} over`
                  : `${formatAmount(remaining, currencySymbol)} left`}
              </Text>
            )}
          </View>

          <View className="items-end">
            {hasBudget ? (
              <>
                <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '700' }}>
                  {formatAmount(spent, currencySymbol)}
                </Text>
                <Text style={{ color: '#7C8CA0', fontSize: 12, marginTop: 1 }}>
                  / {formatAmount(budget_amount, currencySymbol)}
                </Text>
              </>
            ) : (
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: '#4B5563' }}
              >
                <Text style={{ color: '#7C8CA0', fontSize: 12 }}>No budget</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress bar — thin and refined */}
        {hasBudget && (
          <View className="px-4 pb-3">
            <View
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: '#4B5563' }}
            >
              <Animated.View
                style={[
                  {
                    height: '100%',
                    borderRadius: 9999,
                    backgroundColor: progressColor,
                  },
                  progressBarStyle,
                ]}
              />
            </View>
            {/* Percentage label */}
            <View className="flex-row justify-end mt-1">
              <Text style={{ fontSize: 11, color: progressColor, fontWeight: '600' }}>
                {Math.round(percentage_used)}%
              </Text>
            </View>
          </View>
        )}

        {/* Expanded Edit Section */}
        {expanded && (
          <View
            className="px-4 pb-4"
            style={{
              borderTopWidth: 1,
              borderTopColor: '#4B5563',
              paddingTop: 14,
            }}
          >
            {/* Mode toggle */}
            <Animated.View entering={FadeIn.duration(200).delay(50)}>
              <View
                className="rounded-xl p-1 flex-row mb-4"
                style={{
                  backgroundColor: '#1F2937',
                  position: 'relative',
                }}
              >
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      top: 4,
                      width: '50%',
                      height: '100%',
                      borderRadius: 10,
                      backgroundColor: '#2A9D8F',
                    },
                    sliderStyle,
                  ]}
                />
                <TouchableOpacity
                  onPress={() => handleModeChange('fixed')}
                  className="flex-1 py-2.5 rounded-lg z-10"
                  activeOpacity={0.7}
                >
                  <Animated.Text style={[{ textAlign: 'center', fontWeight: '500', fontSize: 13 }, fixedTextStyle]}>
                    Fixed Amount
                  </Animated.Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleModeChange('percentage')}
                  className="flex-1 py-2.5 rounded-lg z-10"
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
                  <Text style={{ color: '#8B99AE', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Budget Amount
                  </Text>
                  <View
                    className="flex-row items-center px-3 h-12 rounded-xl"
                    style={{
                      backgroundColor: '#1F2937',
                      borderWidth: 1,
                      borderColor: '#4B5563',
                    }}
                  >
                    <Text style={{ color: '#7C8CA0', fontSize: 16, marginRight: 4 }}>{currencySymbol}</Text>
                    <TextInput
                      className="flex-1 py-0"
                      style={{ color: '#F1F5F9', fontSize: 16 }}
                      value={amountText}
                      onChangeText={setAmountText}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      selectionColor={category.color}
                    />
                  </View>
                  {amountText !== '' && !isNaN(parseFloat(amountText)) && monthlyIncome > 0 && (
                    <Text style={{ color: '#8B99AE', fontSize: 12, marginTop: 6 }}>
                      = {((parseFloat(amountText) / monthlyIncome) * 100).toFixed(1)}% of income
                    </Text>
                  )}
                </View>
              ) : (
                <View>
                  <Text style={{ color: '#8B99AE', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Percentage of Income ({formatAmount(monthlyIncome, currencySymbol)}/mo)
                  </Text>
                  <View
                    className="flex-row items-center px-3 h-12 rounded-xl"
                    style={{
                      backgroundColor: '#1F2937',
                      borderWidth: 1,
                      borderColor: '#4B5563',
                    }}
                  >
                    <TextInput
                      className="flex-1 py-0"
                      style={{ color: '#F1F5F9', fontSize: 16 }}
                      value={percentText}
                      onChangeText={setPercentText}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      selectionColor={category.color}
                    />
                    <Text style={{ color: '#7C8CA0', fontSize: 16, marginLeft: 4 }}>%</Text>
                  </View>
                  {percentText !== '' && !isNaN(parseFloat(percentText)) && monthlyIncome > 0 && (
                    <Text style={{ color: '#8B99AE', fontSize: 12, marginTop: 6 }}>
                      = {formatAmount(Math.round((parseFloat(percentText) / 100) * monthlyIncome), currencySymbol)}
                    </Text>
                  )}
                </View>
              )}
            </Animated.View>

            {/* Action buttons */}
            <Animated.View entering={FadeIn.duration(200).delay(150)} className="mt-4 flex-row" style={{ gap: 10 }}>
              {hasBudget && (
                <TouchableOpacity
                  onPress={handleClear}
                  className="flex-1 rounded-xl py-3 items-center bg-accentRed"
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 rounded-xl py-3 items-center"
                style={{ backgroundColor: '#2A9D8F' }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
                  {hasBudget ? 'Save' : 'Set Budget'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Show on Dashboard toggle */}
            {hasBudget && (
              <Animated.View entering={FadeIn.duration(200).delay(200)} className="mt-4 flex-row items-center justify-between">
                <Text style={{ color: '#8B99AE', fontSize: 13 }}>Show on Dashboard</Text>
                <View onStartShouldSetResponder={() => true}>
                  <AnimatedToggle
                    value={showOnDashboard}
                    onValueChange={() => onToggleDashboard(category.id)}
                    activeColor="#2A9D8F"
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
