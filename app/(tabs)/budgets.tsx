import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryBudgetRow } from '../components/BudgetsPage/CategoryBudgetRow';
import { IncomeCard } from '../components/BudgetsPage/IncomeCard';
import { useTheme } from '../context/ThemeContext';
import { useBudgetsData } from '../hooks/useBudgetsData';
import { useDataRefresh } from '../context/DataRefreshContext';
import { updateCategoryBudgetAmount, updateCategoryBudgetPercentages, updateCategoriesOrder } from '../services/backendService';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useDashboardCategoriesStore } from '../store/useDashboardCategoriesStore';
import { useIncomeStore } from '../store/useIncomeStore';
import { Category, CategoryBudgetStatus } from '../types/types';

interface CategoryListItem {
  category: Category;
  budgetStatus: CategoryBudgetStatus | null;
}

export default function BudgetsScreen() {
  const { isDarkMode } = useTheme();
  const {
    categoryBudgets,
    totalBudgeted,
    totalSpent,
    monthlyIncome,
    dynamicIncome,
    isLoading,
    refresh,
    removeCategoryBudget,
    upsertCategoryBudget,
  } = useBudgetsData();
  const { currencySymbol } = useCurrencyStore();
  const { useDynamicIncome, manualIncome, saveIncomeSettings } = useIncomeStore();
  const { categories, updateCategoryOptimistic, reorderCategories } = useCategoriesStore();
  const { pinnedCategoryIds, togglePinnedCategory } = useDashboardCategoriesStore();
  const { refreshDashboard, registerBudgetsRefresh } = useDataRefresh();
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);

  const handleToggleExpand = useCallback((categoryId: number) => {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  useEffect(() => {
    registerBudgetsRefresh(refresh);
  }, [registerBudgetsRefresh, refresh]);

  const textPrimary = isDarkMode ? 'text-white' : 'text-black';
  const textSecondary = isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight';
  const screenBg = isDarkMode ? 'bg-backgroundDark' : 'bg-background';

  const handleSaveIncome = async (useDynamic: boolean, income: number) => {
    await saveIncomeSettings(useDynamic, income);
    await refresh();
  };

  const handleInlineSave = async (categoryId: number, amount: number | null) => {
    try {
      // Optimistic UI updates — instant feedback
      updateCategoryOptimistic(categoryId, { budget_amount: amount });
      if (amount === null) {
        removeCategoryBudget(categoryId);
      } else {
        upsertCategoryBudget(categoryId, amount);
      }

      // Persist to backend, then sync fresh data in the background
      await updateCategoryBudgetAmount(categoryId, amount);
      refresh();
      refreshDashboard();
    } catch (error) {
      console.error('Error saving budget amount:', error);
      refresh();
    }
  };

  const handleSetBudgetWithAI = useCallback(async () => {
    const budgetCategories = categories.filter((cat) => cat.category_name !== 'Income');
    const categoryNames = budgetCategories.map((cat) => cat.category_name);

    console.log('--- AI Budget Setup ---');
    console.log('Monthly Income:', monthlyIncome);
    console.log('Categories:', categoryNames);

    // TODO: Replace with AI API call that returns { categoryName: percentage } allocations
    // For now, this is where the AI response would be processed into allocations like:
    // const aiResponse = await callBudgetAI(categoryNames, monthlyIncome);
    // const allocations = budgetCategories.map((cat) => ({
    //   categoryId: cat.id,
    //   percentage: aiResponse[cat.category_name],
    //   amount: Math.round((aiResponse[cat.category_name] / 100) * monthlyIncome),
    // }));
    // await updateCategoryBudgetPercentages(allocations);
    // await refresh();
    // refreshDashboard();

    setShowHelpModal(false);
  }, [categories, monthlyIncome]);

  const handleDragEnd = useCallback(async ({ data }: { data: CategoryListItem[] }) => {
    // Update local state immediately for responsive UI
    const reorderedCategories = data.map((item, index) => ({
      ...item.category,
      sort_order: index,
    }));
    reorderCategories(reorderedCategories);

    // Persist to backend
    try {
      await updateCategoriesOrder(
        reorderedCategories.map((cat) => ({ id: cat.id, sort_order: cat.sort_order! }))
      );
    } catch (error) {
      console.error('Error saving category order:', error);
      // Reload on failure to sync with backend
      refresh();
    }
  }, [reorderCategories, refresh]);

  // Build a unified list respecting sort_order if set, otherwise budgeted first
  const { allCategoryItems, hasCustomOrder } = useMemo(() => {
    const budgetMap = new Map<number, CategoryBudgetStatus>();
    categoryBudgets.forEach((cb) => budgetMap.set(cb.category.id, cb));

    const filteredCategories = categories.filter((cat) => cat.category_name !== 'Income');

    // Check if user has custom sort_order (any category has sort_order defined)
    const customOrder = filteredCategories.some((cat) => cat.sort_order !== undefined);

    if (customOrder) {
      // Respect user's custom order
      return {
        allCategoryItems: filteredCategories.map((cat) => ({
          category: cat,
          budgetStatus: budgetMap.get(cat.id) ?? null,
        })),
        hasCustomOrder: true,
      };
    }

    // Default: budgeted categories first, then unbudgeted
    const budgeted: CategoryListItem[] = [];
    const unbudgeted: CategoryListItem[] = [];

    filteredCategories.forEach((cat) => {
      const status = budgetMap.get(cat.id) ?? null;
      if (status) {
        budgeted.push({ category: cat, budgetStatus: status });
      } else {
        unbudgeted.push({ category: cat, budgetStatus: null });
      }
    });

    return {
      allCategoryItems: [...budgeted, ...unbudgeted],
      hasCustomOrder: false,
    };
  }, [categories, categoryBudgets]);

  const formatAmount = (amount: number): string => {
    return `${currencySymbol}${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Find the index where unbudgeted categories start
  const unbudgetedStartIndex = allCategoryItems.findIndex((item) => item.budgetStatus === null);

  return (
    <SafeAreaView className={`flex-1 ${screenBg}`} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <View className="flex-col">
          <Text className={`text-2xl font-semibold ${textPrimary}`}>
            Budgets
          </Text>
          <Text className={`text-md mt-1 mb-3 ${textSecondary}`}>
            {isReorderMode ? 'Drag to reorder categories' : 'Per-category spending limits'}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setIsReorderMode(!isReorderMode)}
            className={`h-9 w-9 items-center justify-center rounded-full border ${isReorderMode ? 'border-accentTeal bg-accentTeal' : 'border-borderDark'}`}
            style={!isReorderMode ? { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' } : undefined}
          >
            <Ionicons name="reorder-three" size={20} color={isReorderMode ? '#fff' : (isDarkMode ? '#94a3b8' : '#64748b')} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowHelpModal(true)}
            className="h-9 w-9 items-center justify-center rounded-full border border-borderDark"
            style={{ backgroundColor: '#FACC15' }}
          >
            <Ionicons name="help" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <DraggableFlatList
        data={isLoading ? [] : allCategoryItems}
        keyExtractor={(item) => item.category.id.toString()}
        onDragEnd={handleDragEnd}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 150 }}
        ListHeaderComponent={
          <>
            {/* Income Card */}
            {!isReorderMode && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400 }}
              >
                <IncomeCard
                  income={monthlyIncome}
                  currencySymbol={currencySymbol}
                  useDynamicIncome={useDynamicIncome}
                  manualIncome={manualIncome}
                  dynamicIncome={dynamicIncome}
                  totalBudgeted={totalBudgeted}
                  isDarkMode={isDarkMode}
                  onSave={handleSaveIncome}
                />
              </MotiView>
            )}
            {isReorderMode && (
              <Text className={`text-sm ${textSecondary} mb-3 px-1`}>
                Hold and drag to reorder
              </Text>
            )}
          </>
        }
        renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<CategoryListItem>) => {
          const index = getIndex() ?? 0;
          return (
          <ScaleDecorator>
            <>
              {/* Section headers - only when not reordering and no custom order */}
              {!isReorderMode && !hasCustomOrder && index === 0 && categoryBudgets.length > 0 && (
                <Text className={`text-sm ${textSecondary} mb-2 px-1`}>
                  Budgeted Categories
                </Text>
              )}
              {!isReorderMode && !hasCustomOrder && index === unbudgetedStartIndex && unbudgetedStartIndex >= 0 && (
                <Text className={`text-sm ${textSecondary} mb-2 px-1 ${index > 0 ? 'mt-4' : ''}`}>
                  Other Categories
                </Text>
              )}
              {isReorderMode ? (
                <TouchableOpacity
                  onLongPress={drag}
                  disabled={isActive}
                  delayLongPress={100}
                  className={`mb-2 rounded-2xl p-4 flex-row items-center border ${
                    isActive ? 'border-accentTeal bg-surfaceDark/80' : 'border-borderDark bg-surfaceDark'
                  }`}
                  style={{ opacity: isActive ? 0.9 : 1 }}
                >
                  <View className="mr-3">
                    <Ionicons name="menu" size={22} color="#94a3b8" />
                  </View>
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: item.category.color }}
                  >
                    <Ionicons name={item.category.icon as any} size={20} color="#fff" />
                  </View>
                  <Text className="text-white text-base flex-1">{item.category.category_name}</Text>
                  {item.budgetStatus && (
                    <Text className="text-secondaryDark text-sm">
                      {currencySymbol}{item.budgetStatus.budget_amount.toLocaleString()}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 250, delay: index * 30 }}
                  className="mb-3"
                >
                  <CategoryBudgetRow
                    item={item.budgetStatus}
                    category={item.category}
                    currencySymbol={currencySymbol}
                    monthlyIncome={monthlyIncome}
                    onSave={handleInlineSave}
                    showOnDashboard={pinnedCategoryIds.length === 0 || pinnedCategoryIds.includes(item.category.id)}
                    onToggleDashboard={togglePinnedCategory}
                    expanded={expandedCategoryId === item.category.id}
                    onToggleExpand={() => handleToggleExpand(item.category.id)}
                  />
                </MotiView>
              )}
            </>
          </ScaleDecorator>
        );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 400, delay: 200 }}
              className="items-center justify-center py-8"
            >
              <Text className={`text-lg ${textSecondary}`}>
                No categories found
              </Text>
            </MotiView>
          ) : null
        }
      />

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View
            className={`mx-6 rounded-2xl p-6 ${isDarkMode ? 'bg-surfaceDark border border-borderDark' : 'bg-white'}`}
            style={{ maxHeight: '80%' }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className={`text-2xl font-bold mb-3 ${textPrimary}`}>
                Not sure where to start?
              </Text>
              <Text className={`text-base leading-6 mb-4 ${textSecondary}`}>
                We can take the guesswork out of it! Let us automatically set up your budget using the 50/30/20 rule:
              </Text>

              <View className="mb-4 pl-2">
                <Text className={`text-base leading-7 ${textPrimary}`}>
                  {'\u2022'} <Text className="font-semibold">50%</Text> for your <Text className="font-semibold">Needs</Text> (rent, groceries, utilities)
                </Text>
                <Text className={`text-base leading-7 ${textPrimary}`}>
                  {'\u2022'} <Text className="font-semibold">30%</Text> for your <Text className="font-semibold">Wants</Text> (dining out, hobbies, Netflix)
                </Text>
                <Text className={`text-base leading-7 ${textPrimary}`}>
                  {'\u2022'} <Text className="font-semibold">20%</Text> for your <Text className="font-semibold">Financial Goals</Text> (savings, debt payoff)
                </Text>
              </View>

              <Text className={`text-xl font-bold mb-2 ${textPrimary}`}>
                How it works
              </Text>
              <Text className={`text-base leading-6 mb-4 ${textSecondary}`}>
                Based on your income, we'll calculate these categories for you instantly. This method is a proven, simple way to balance living for today while saving for tomorrow.
              </Text>

              <View className={`rounded-xl p-3 mb-5 ${isDarkMode ? 'bg-backgroundDark' : 'bg-gray-100'}`}>
                <Text className={`text-base ${textSecondary}`}>
                  <Text className="font-semibold">Tip:</Text> You can always jump in and tweak these numbers later to fit your unique lifestyle.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSetBudgetWithAI}
                className="rounded-xl py-3 items-center"
                style={{ backgroundColor: '#FACC15' }}
              >
                <Text className="text-black font-bold text-base">Set my budget!</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowHelpModal(false)}
                className={`mt-3 rounded-xl py-3 items-center border ${isDarkMode ? 'border-borderDark' : 'border-gray-300'}`}
              >
                <Text className={`text-base font-semibold ${textSecondary}`}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
