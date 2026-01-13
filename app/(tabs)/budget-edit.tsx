import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronUp, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { BUDGET_COLORS, ColorPicker } from '../components/BudgetsPage/ColorPicker';
import { PeriodSelector } from '../components/BudgetsPage/PeriodSelector';
import { useTheme } from '../context/ThemeContext';
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
import { BudgetAmountType, BudgetPeriodType } from '../types/types';

export default function EditBudgetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const budgetId = params.id ? Number(params.id) : undefined;

  const { isDarkMode } = useTheme();
  const { currencySymbol } = useCurrencyStore();
  const { budgets, loadBudgets, addBudgetOptimistic, updateBudgetOptimistic, deleteBudgetOptimistic } = useBudgetsStore();
  const { categories, loadCategories, updateCategoryOptimistic } = useCategoriesStore();

  const existingBudget = budgetId
    ? budgets.find((b) => b.id === budgetId)
    : undefined;

  // Form state
  const [name, setName] = useState(existingBudget?.name || '');
  const [color, setColor] = useState(existingBudget?.color || BUDGET_COLORS[0]);
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
  const [sortOrder, setSortOrder] = useState(
    existingBudget?.sort_order ?? budgets.length
  );
  const [showSortOrderPicker, setShowSortOrderPicker] = useState(false);

  // Compute available sort order positions
  const sortOrderOptions = Array.from(
  { length: budgetId ? budgets.length : budgets.length + 1 },
  (_, i) => i + 1 
);

  // Load data on mount
  useEffect(() => {
    loadCategories();
    loadBudgets();
  }, []);

  // Update form fields when budget data loads
  useEffect(() => {
    if (budgetId && existingBudget) {
      setName(existingBudget.name || '');
      setColor(existingBudget.color || BUDGET_COLORS[0]);
      setAmountType(existingBudget.amount_type || 'money_amount');
      setAmount(existingBudget.amount?.toString() || '');
      setPeriodType(existingBudget.period_type || 'monthly');
      setCustomStartDate(existingBudget.custom_start_date || '');
      setCustomEndDate(existingBudget.custom_end_date || '');
      setSortOrder(existingBudget.sort_order ?? budgets.length);
    }
  }, [budgetId, existingBudget]);

  // Update selected categories when categories load
  useEffect(() => {
    if (budgetId) {
      setSelectedCategoryIds(
        categories
          .filter((cat) => cat.budget_id === budgetId)
          .map((cat) => cat.id)
      );
    }
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
    if (periodType === 'custom' && (!customStartDate || !customEndDate)) {
      Alert.alert('Error', 'Please select both start and end dates for custom period');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
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
      router.back();
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
              router.back();
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
        <View className="flex-row items-center justify-between px-2 py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft
              size={28}
              color={isDarkMode ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
          <Text className={`text-xl font-semibold ${textPrimary}`}>
            {budgetId ? 'Edit Budget' : 'Create Budget'}
          </Text>
          {budgetId ? (
            <TouchableOpacity onPress={handleDelete} className="p-2 -mr-2">
              <Trash2 color="#ef4444" size={24} />
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}
        </View>

        <ScrollView
          className="flex-1 px-2"
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
        >
          {/* Budget Name */}
          <View className="mb-6">
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

          {/* Color Picker */}
          <ColorPicker selectedColor={color} onColorSelect={setColor} isDarkMode={isDarkMode} />

          {/* Amount Type Toggle */}
          <View className="mb-6">
            <Text className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Budget Type</Text>
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

          {/* Amount Input */}
          <View className="mb-6">
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
          </View>

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
          <View className="mb-6">
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
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        setSortOrder(option);
                        setShowSortOrderPicker(false);
                      }}
                      className={`px-4 py-3 ${
                        index !== sortOrderOptions.length - 1
                          ? isDarkMode ? 'border-b border-slate-700' : 'border-b border-gray-200'
                          : ''
                      } ${sortOrder === option ? (isDarkMode ? 'bg-slate-700' : 'bg-gray-100') : ''}`}
                    >
                      <Text className={`${
                        sortOrder === option
                          ? 'text-accentBlue font-medium'
                          : isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Position {option + 1}
                      </Text>
                    </TouchableOpacity>
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
            className="bg-accentBlue rounded-xl py-4 mt-6 items-center"
          >
            <Text className="text-white font-semibold text-lg">
              {isSaving ? 'Saving...' : budgetId ? 'Update Budget' : 'Create Budget'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
