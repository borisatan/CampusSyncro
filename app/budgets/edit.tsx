import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
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
import { ColorPicker, BUDGET_COLORS } from '../components/BudgetsPage/ColorPicker';
import { PeriodSelector } from '../components/BudgetsPage/PeriodSelector';
import { useTheme } from '../context/ThemeContext';
import {
  deleteBudget,
  saveBudget,
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

  // Load data on mount
  useEffect(() => {
    loadCategories();
  }, []);

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
      const payload = {
        name: name.trim(),
        color,
        amount_type: amountType,
        amount: parseFloat(amount),
        period_type: periodType,
        custom_start_date: periodType === 'custom' ? customStartDate : undefined,
        custom_end_date: periodType === 'custom' ? customEndDate : undefined,
        use_dynamic_income: true,  // Always use global income setting
      };

      const savedBudget = await saveBudget(payload, budgetId);

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
        <View className={`flex-row items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-borderDark' : 'border-borderLight'}`}>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 p-1"
            >
              <ChevronLeft
                size={28}
                color={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
            <Text className={`text-xl font-semibold ${textPrimary}`}>
              {budgetId ? 'Edit Budget' : 'Create Budget'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className="bg-accentBlue rounded-lg px-4 py-2"
          >
            <Text className="text-white font-semibold">
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4"
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
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setAmountType('money_amount')}
                className={`flex-1 py-3 rounded-xl items-center border ${
                  amountType === 'money_amount'
                    ? 'bg-accentBlue border-accentBlue'
                    : isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`font-medium ${
                    amountType === 'money_amount' ? 'text-white' : isDarkMode ? 'text-slate-300' : 'text-gray-700'
                  }`}
                >
                  Fixed Amount
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAmountType('percentage')}
                className={`flex-1 py-3 rounded-xl items-center border ${
                  amountType === 'percentage'
                    ? 'bg-accentBlue border-accentBlue'
                    : isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`font-medium ${
                    amountType === 'percentage' ? 'text-white' : isDarkMode ? 'text-slate-300' : 'text-gray-700'
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
              <Text className={`text-lg mr-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
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
            {amountType === 'percentage' && (
              <Text className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                Uses the global income setting from the Income Card
              </Text>
            )}
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

          {/* Category Selector */}
          <CategorySelector
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            onToggleCategory={handleToggleCategory}
            currentBudgetId={budgetId}
            isDarkMode={isDarkMode}
          />

          {/* Delete Button */}
          {budgetId && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isSaving}
              className="flex-row items-center justify-center bg-red-500/20 rounded-xl py-4 mt-4"
            >
              <Trash2 size={20} color="#EF4444" />
              <Text className="text-red-500 font-semibold ml-2">
                Delete Budget
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
