import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategorySelector } from '../components/BudgetsPage/CategorySelector';
import { PeriodSelector } from '../components/BudgetsPage/PeriodSelector';
import { ColorPicker, PRESET_COLORS } from '../components/Shared/ColorPicker';
import { SuccessModal } from '../components/Shared/SuccessModal';
import { useTheme } from '../context/ThemeContext';
import { useBudgetsData } from '../hooks/useBudgetsData';
import {
  deleteBudget,
  reorderBudgetPosition,
  saveBudget,
  shiftBudgetsForInsert,
  updateCategoryBudgetId,
} from '../services/backendService';
import { useBudgetsStore } from '../store/useBudgetsStore';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useIncomeStore } from '../store/useIncomeStore';
import { BudgetAmountType, BudgetPeriodType } from '../types/types';

export default function EditBudgetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const budgetId = params.id ? Number(params.id) : undefined;

  const { isDarkMode } = useTheme();
  const { currencySymbol } = useCurrencyStore();
  const { budgets, loadBudgets, addBudgetOptimistic, updateBudgetOptimistic, deleteBudgetOptimistic } = useBudgetsStore();
  const { categories, loadCategories, updateCategoryOptimistic } = useCategoriesStore();
  const { monthlyIncome } = useBudgetsData();
  const { useDynamicIncome, manualIncome } = useIncomeStore();

  // Calculate effective income (same logic as useBudgetsData)
  const effectiveIncome = useDynamicIncome ? monthlyIncome : manualIncome;

  const existingBudget = budgetId
    ? budgets.find((b) => b.id === budgetId)
    : undefined;

  // Calculate already allocated by OTHER budgets (excluding current one)
  const otherBudgets = budgets.filter((b) => b.id !== budgetId);

  // Sum of all percentages from OTHER percentage-type budgets
  const allocatedPercentageByOthers = otherBudgets
    .filter((b) => b.amount_type === 'percentage')
    .reduce((sum, b) => sum + b.amount, 0);

  // Sum of all amounts from OTHER budgets (converting percentage to amount)
  const allocatedAmountByOthers = otherBudgets.reduce((sum, b) => {
    if (b.amount_type === 'money_amount') {
      return sum + b.amount;
    } else {
      // Convert percentage to amount
      return sum + (b.amount / 100) * effectiveIncome;
    }
  }, 0);

  // Calculate remaining available
  const remainingPercentage = Math.max(0, 100 - allocatedPercentageByOthers);
  const remainingAmount = Math.max(0, effectiveIncome - allocatedAmountByOthers);

  // Form state
  const [name, setName] = useState(existingBudget?.name || '');
  const [color, setColor] = useState(existingBudget?.color || PRESET_COLORS[0]);
  const [amountType, setAmountType] = useState<BudgetAmountType>(
    existingBudget?.amount_type || 'money_amount'
  );
  const [amount, setAmount] = useState(
    existingBudget?.amount?.toString() || ''
  );
  const [periodType, setPeriodType] = useState<BudgetPeriodType>(
    existingBudget?.period_type || 'monthly'
  );
  const [customStartDate, setCustomStartDate] = useState(
    existingBudget?.custom_start_date || ''
  );
  const [customEndDate, setCustomEndDate] = useState(
    existingBudget?.custom_end_date || ''
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    categories
      .filter((cat) => cat.budget_id === budgetId)
      .map((cat) => cat.id)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sortOrder, setSortOrder] = useState(
    existingBudget?.sort_order ?? budgets.length
  );
  const [showSortOrderPicker, setShowSortOrderPicker] = useState(false);

  // Compute available sort order positions (0-indexed internally, displayed as 1-indexed)
  const sortOrderOptions = Array.from(
    { length: budgetId ? budgets.length : budgets.length + 1 },
    (_, i) => i
  );

  // Load data on mount
  useEffect(() => {
    loadCategories();
    loadBudgets();
  }, []);

  // Reset form state when budgetId changes (handles both create and edit modes)
  useEffect(() => {
    // Reset UI states
    setIsSaving(false);
    setShowSuccess(false);
    setShowSortOrderPicker(false);

    if (budgetId && existingBudget) {
      // Edit mode: populate with existing budget data
      setName(existingBudget.name || '');
      setColor(existingBudget.color || PRESET_COLORS[0]);
      setAmountType(existingBudget.amount_type || 'money_amount');
      setAmount(existingBudget.amount?.toString() || '');
      setPeriodType(existingBudget.period_type || 'monthly');
      setCustomStartDate(existingBudget.custom_start_date || '');
      setCustomEndDate(existingBudget.custom_end_date || '');
      setSortOrder(existingBudget.sort_order ?? budgets.length);
    } else if (!budgetId) {
      // Create mode: reset to defaults
      setName('');
      setColor(PRESET_COLORS[0]);
      setAmountType('money_amount');
      setAmount('');
      setPeriodType('monthly');
      setCustomStartDate('');
      setCustomEndDate('');
      setSortOrder(budgets.length);
      setSelectedCategoryIds([]);
    }
  }, [budgetId, existingBudget, budgets.length]);

  // Update selected categories when categories load (only for edit mode)
  useEffect(() => {
    if (budgetId) {
      setSelectedCategoryIds(
        categories
          .filter((cat) => cat.budget_id === budgetId)
          .map((cat) => cat.id)
      );
    }
    // Note: Create mode category reset is handled in the budgetId change effect above
  }, [categories, budgetId]);

  const textPrimary = isDarkMode ? 'text-white' : 'text-black';
  const screenBg = isDarkMode ? 'bg-backgroundDark' : 'bg-background';

  const handleToggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCustomDatesChange = (startDate: string, endDate: string) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a budget name');
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    const enteredAmount = parseFloat(amount);

    // Validate percentage doesn't exceed 100% total
    if (amountType === 'percentage') {
      const totalPercentage = allocatedPercentageByOthers + enteredAmount;
      if (totalPercentage > 100) {
        Alert.alert(
          'Budget Limit Exceeded',
          `You can only allocate up to ${remainingPercentage.toFixed(1)}% more. Other budgets already use ${allocatedPercentageByOthers.toFixed(1)}% of your income.`
        );
        return false;
      }
    }

    // Validate amount doesn't exceed income
    if (amountType === 'money_amount') {
      const totalAmount = allocatedAmountByOthers + enteredAmount;
      if (effectiveIncome > 0 && totalAmount > effectiveIncome) {
        Alert.alert(
          'Budget Limit Exceeded',
          `You can only allocate up to ${currencySymbol}${remainingAmount.toFixed(2)} more. Other budgets already use ${currencySymbol}${allocatedAmountByOthers.toFixed(2)} of your ${currencySymbol}${effectiveIncome.toFixed(2)} income.`
        );
        return false;
      }
    }

    if (periodType === 'custom' && (!customStartDate || !customEndDate)) {
      Alert.alert('Error', 'Please select both start and end dates for custom period');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    // Show success animation immediately for snappy feel
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Wait for modal fade-out animation before navigating
      setTimeout(() => {
        router.replace('/budgets');
      }, 1900);
    }, 1900);

    // Do API work in background
    try {
      const oldSortOrder = existingBudget?.sort_order ?? 0;
      const insertPosition = sortOrder;

      // Shift existing budgets if inserting a new budget at a position that's not at the end
      if (!budgetId && insertPosition < budgets.length) {
        await shiftBudgetsForInsert(insertPosition, budgets);
      }

      const payload = {
        name: name.trim(),
        color,
        amount_type: amountType,
        amount: parseFloat(amount),
        period_type: periodType,
        custom_start_date: periodType === 'custom' ? customStartDate : undefined,
        custom_end_date: periodType === 'custom' ? customEndDate : undefined,
        use_dynamic_income: true,  // Always use global income setting
        sort_order: insertPosition,
      };

      const savedBudget = await saveBudget(payload, budgetId);

      // Reorder budgets if sort_order changed for existing budget
      if (budgetId && sortOrder !== oldSortOrder) {
        await reorderBudgetPosition(budgetId, oldSortOrder, sortOrder, budgets);
      }

      // Update category assignments
      const previouslyAssigned = categories
        .filter((cat) => cat.budget_id === budgetId)
        .map((cat) => cat.id);

      // Unassign categories that were removed
      for (const catId of previouslyAssigned) {
        if (!selectedCategoryIds.includes(catId)) {
          await updateCategoryBudgetId(catId, null);
          updateCategoryOptimistic(catId, { budget_id: null });
        }
      }

      // Assign new categories
      for (const catId of selectedCategoryIds) {
        if (!previouslyAssigned.includes(catId)) {
          await updateCategoryBudgetId(catId, savedBudget.id);
          updateCategoryOptimistic(catId, { budget_id: savedBudget.id });
        }
      }

      // Update store
      if (budgetId) {
        updateBudgetOptimistic(budgetId, savedBudget);
      } else {
        addBudgetOptimistic(savedBudget);
      }

      await loadBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!budgetId) return;

    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget? Categories will be unassigned.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              // Unassign all categories first
              const assignedCategories = categories.filter(
                (cat) => cat.budget_id === budgetId
              );
              for (const cat of assignedCategories) {
                updateCategoryOptimistic(cat.id, { budget_id: null });
              }

              await deleteBudget(budgetId);
              deleteBudgetOptimistic(budgetId);
              await loadBudgets();
              router.replace('/budgets');
            } catch (error) {
              console.error('Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${screenBg}`} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.replace('/budgets')}
              className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center mr-4"
            >
              <ArrowLeft color="#94A3B8" size={20} />
            </TouchableOpacity>
            <View>
              <Text className={`text-2xl font-semibold ${textPrimary}`}>
                {budgetId ? 'Edit Budget' : 'Create Budget'}
              </Text>
              <Text className="text-secondaryDark">
                {budgetId ? 'Update budget details' : 'Set up a new budget'}
              </Text>
            </View>
          </View>
          {budgetId ? (
            <TouchableOpacity onPress={handleDelete} className="p-2">
              <Trash2 color="#ef4444" size={24} />
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}
        </View>

        <ScrollView
          className="flex-1 px-2"
          contentContainerStyle={{ paddingBottom: 80, paddingTop: 8 }}
        >
          {/* Amount Type Toggle */}
          <View className="mb-4">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Budget Type</Text>
            <View className={`${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'} rounded-2xl p-1 flex-row`}>
              <TouchableOpacity
                onPress={() => setAmountType('money_amount')}
                className={`flex-1 py-3 rounded-xl ${
                  amountType === 'money_amount'
                    ? isDarkMode ? 'bg-accentBlue' : 'bg-white'
                    : ''
                }`}
              >
                <Text
                  className={`text-center ${
                    amountType === 'money_amount'
                      ? isDarkMode ? 'text-white' : 'text-gray-900'
                      : isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}
                >
                  Fixed Amount
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAmountType('percentage')}
                className={`flex-1 py-3 rounded-xl ${
                  amountType === 'percentage'
                    ? isDarkMode ? 'bg-accentBlue' : 'bg-white'
                    : ''
                }`}
              >
                <Text
                  className={`text-center ${
                    amountType === 'percentage'
                      ? isDarkMode ? 'text-white' : 'text-gray-900'
                      : isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}
                >
                  Percentage
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Budget Name */}
          <View className="mb-4">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Budget Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Food & Dining"
              placeholderTextColor={isDarkMode ? '#475569' : '#9ca3af'}
              className={`w-full px-4 py-3 rounded-xl border ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </View>

          {/* Amount Input */}
          <View className="mb-4">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              {amountType === 'money_amount' ? 'Amount' : 'Percentage of Income'}
            </Text>
            <View className={`flex-row items-center px-4 py-3 rounded-xl border ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
            }`}>
              <Text className={`text-lg mr-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {amountType === 'money_amount' ? currencySymbol : '%'}
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={isDarkMode ? '#475569' : '#9ca3af'}
                keyboardType="decimal-pad"
                className={`flex-1 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              />
            </View>
            {/* Show remaining available budget */}
            {amountType === 'percentage' ? (
              <Text className={`text-xs mt-2 ${
                remainingPercentage <= 0 ? 'text-red-500' : isDarkMode ? 'text-slate-500' : 'text-gray-500'
              }`}>
                {remainingPercentage <= 0
                  ? 'No remaining percentage available. Other budgets already use 100% of your income.'
                  : `Available: ${remainingPercentage.toFixed(1)}% remaining (${allocatedPercentageByOthers.toFixed(1)}% already allocated)`
                }
              </Text>
            ) : (
              effectiveIncome > 0 && (
                <Text className={`text-xs mt-2 ${
                  remainingAmount <= 0 ? 'text-red-500' : isDarkMode ? 'text-slate-500' : 'text-gray-500'
                }`}>
                  {remainingAmount <= 0
                    ? `No remaining budget available. Other budgets already use your full income of ${currencySymbol}${effectiveIncome.toFixed(2)}.`
                    : `Available: ${currencySymbol}${remainingAmount.toFixed(2)} remaining of ${currencySymbol}${effectiveIncome.toFixed(2)} income`
                  }
                </Text>
              )
            )}
          </View>

            {/* Color Picker */}
            <ColorPicker selectedColor={color} onColorSelect={setColor} isDarkMode={isDarkMode} />
          {/* Period Selector */}
          <PeriodSelector
            selectedPeriod={periodType}
            onPeriodSelect={setPeriodType}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomDatesChange={handleCustomDatesChange}
            isDarkMode={isDarkMode}
          />

          {/* Display Order Picker */}
          <View className="mb-4">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Display Order
            </Text>
            <TouchableOpacity
              onPress={() => setShowSortOrderPicker(!showSortOrderPicker)}
              activeOpacity={0.7}
              className={`flex-row items-center justify-between px-4 py-3 rounded-xl border ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
              }`}
            >
              <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Position {sortOrder + 1}
              </Text>
              {showSortOrderPicker ? (
                <ChevronUp size={20} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
              ) : (
                <ChevronDown size={20} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
              )}
            </TouchableOpacity>

            {showSortOrderPicker && (
              <View className={`mt-2 rounded-xl overflow-hidden border ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
              }`}>
                <ScrollView className="max-h-60" nestedScrollEnabled={true}>
                  {sortOrderOptions.map((option, index) => (
                    <AnimatedPositionRow
                      key={option}
                      position={option}
                      index={index}
                      isDarkMode={isDarkMode}
                      isSelected={sortOrder === option}
                      onSelect={(pos) => {
                        setSortOrder(pos);
                        setShowSortOrderPicker(false);
                      }}
                      isLast={index === sortOrderOptions.length - 1}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            <Text className={`text-xs mt-2 italic ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
              Lower numbers appear first in the budget list
            </Text>
          </View>


          {/* Category Selector */}
          <CategorySelector
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            onToggleCategory={handleToggleCategory}
            currentBudgetId={budgetId}
            isDarkMode={isDarkMode}
          />

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className="bg-accentBlue rounded-xl py-4 mt-4 items-center"
          >
            <Text className="text-white font-semibold text-lg">
              {budgetId ? 'Update Budget' : 'Create Budget'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Success animation */}
        <SuccessModal
          visible={showSuccess}
          text={budgetId ? 'Budget Updated!' : 'Budget Created!'}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const AnimatedPositionRow = ({
  position,
  index,
  isDarkMode,
  isSelected,
  onSelect,
  isLast,
}: {
  position: number;
  index: number;
  isDarkMode: boolean;
  isSelected: boolean;
  onSelect: (pos: number) => void;
  isLast: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        onPress={() => onSelect(position)}
        className={`px-4 py-3 ${
          !isLast
            ? isDarkMode ? 'border-b border-slate-700' : 'border-b border-gray-200'
            : ''
        } ${isSelected ? (isDarkMode ? 'bg-slate-700' : 'bg-gray-100') : ''}`}
      >
        <Text className={`${
          isSelected
            ? 'text-accentBlue font-medium'
            : isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Position {position + 1}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
