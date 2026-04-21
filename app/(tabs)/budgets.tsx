import { Ionicons } from "@expo/vector-icons";
import { ArrowLeft, Sparkles, TrendingUp } from "lucide-react-native";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { interpolate, runOnJS, SharedValue, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AIBudgetPreviewModal } from "../components/BudgetsPage/AIBudgetPreviewModal";
import { BudgetsSkeleton } from "../components/BudgetsPage/BudgetsSkeleton";
import { CategoryBudgetRow } from "../components/BudgetsPage/CategoryBudgetRow";
import { EditBudgetModal } from "../components/BudgetsPage/EditBudgetModal";
import { IncomeCard } from "../components/BudgetsPage/IncomeCard";
import { CreateGoalModal } from "../components/GoalsPage/CreateGoalModal";
import { EditGoalModal } from "../components/GoalsPage/EditGoalModal";
import { GoalProgressCard } from "../components/GoalsPage/GoalProgressCard";
import { GoalTransactionModal } from "../components/GoalsPage/GoalTransactionModal";
import { OfflineEmptyState } from "../components/Shared/OfflineEmptyState";
import { useDataRefresh } from "../context/DataRefreshContext";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";
import { useBudgetsData } from "../hooks/useBudgetsData";
import {
  deleteCategory,
  getUserId,
  updateCategoriesOrder,
  updateCategoryBudgetAmount,
  updateCategoryBudgetPercentages,
} from "../services/backendService";
import {
  BudgetAllocation,
  getBudgetAllocations,
} from "../services/budgetAIService";
import { useAccountsStore } from "../store/useAccountsStore";
import { useCategoriesStore } from "../store/useCategoriesStore";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { toggleCategoryDashboardVisibility } from "../store/useDashboardCategoriesStore";
import { useGoalsStore } from "../store/useGoalsStore";
import { useIncomeStore } from "../store/useIncomeStore";
import { Category, CategoryBudgetStatus, Goal } from "../types/types";

interface CategoryListItem {
  type: 'category';
  category: Category;
  budgetStatus: CategoryBudgetStatus | null;
}

interface GoalsListItem {
  type: 'goals';
}

type BudgetListItem = CategoryListItem | GoalsListItem;

export default function BudgetsScreen() {
  const { isDarkMode } = useTheme();
  const { isConnected } = useNetwork();
  const {
    categoryBudgets,
    monthlyIncome,
    dynamicIncome,
    isLoading,
    refresh,
    removeCategoryBudget,
    upsertCategoryBudget,
  } = useBudgetsData();
  const { currencySymbol } = useCurrencyStore();
  const { useDynamicIncome, manualIncome, saveIncomeSettings } = useIncomeStore();
  const { categories, updateCategoryOptimistic, reorderCategories, deleteCategoryOptimistic } = useCategoriesStore();
  const { accounts, loadAccounts } = useAccountsStore();
  const { goals, loadGoals } = useGoalsStore();
  const {
    refreshDashboard,
    refreshAll,
    registerBudgetsRefresh,
    registerCategoriesRefresh,
    registerGoalsRefresh,
  } = useDataRefresh();
  const loadCategories = useCategoriesStore((state) => state.loadCategories);

  const [editBudgetCategory, setEditBudgetCategory] = useState<{
    category: Category;
    budgetStatus: CategoryBudgetStatus | null;
  } | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);

  // AI Budget state
  const [aiModalView, setAIModalView] = useState<"info" | "loading" | "results" | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [aiAllocations, setAIAllocations] = useState<BudgetAllocation[] | null>(null);
  const [aiFromCache, setAIFromCache] = useState(false);
  const [aiSpendingBudget, setAISpendingBudget] = useState(0);
  const [aiSavingsAmount, setAISavingsAmount] = useState(0);
  const [aiApplying, setAIApplying] = useState(false);

  // Goal modal state
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [activeGoalIndex, setActiveGoalIndex] = useState(0);
  const [isGoalEditMode, setIsGoalEditMode] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const goalCardWidth = screenWidth - 32;

  const goalTranslateX = useSharedValue(0);
  const goalCurrentPage = useSharedValue(0);
  const goalCount = useSharedValue(goals.length);

  useAnimatedReaction(
    () => goalCurrentPage.value,
    (page) => runOnJS(setActiveGoalIndex)(page),
  );

  useEffect(() => {
    goalCount.value = goals.length;
    if (goalCurrentPage.value >= goals.length) {
      const newPage = Math.max(0, goals.length - 1);
      goalCurrentPage.value = newPage;
      goalTranslateX.value = withSpring(-newPage * goalCardWidth, {
        damping: 22,
        stiffness: 180,
        mass: 0.5,
      });
    }
  }, [goals.length]);

  const goalPanGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      const base = -goalCurrentPage.value * goalCardWidth;
      const next = base + e.translationX;
      const min = -(goalCount.value - 1) * goalCardWidth;
      if (next > 0) {
        goalTranslateX.value = next * 0.2;
      } else if (next < min) {
        goalTranslateX.value = min + (next - min) * 0.2;
      } else {
        goalTranslateX.value = next;
      }
    })
    .onEnd((e) => {
      const vx = e.velocityX;
      let page = goalCurrentPage.value;
      if (vx < -200) {
        page = Math.min(page + 1, goalCount.value - 1);
      } else if (vx > 200) {
        page = Math.max(page - 1, 0);
      } else {
        const dragged = -goalTranslateX.value - goalCurrentPage.value * goalCardWidth;
        if (dragged > goalCardWidth * 0.25) {
          page = Math.min(page + 1, goalCount.value - 1);
        } else if (dragged < -goalCardWidth * 0.25) {
          page = Math.max(page - 1, 0);
        }
      }
      goalCurrentPage.value = page;
      goalTranslateX.value = withSpring(-page * goalCardWidth, {
        velocity: vx,
        damping: 22,
        stiffness: 180,
        mass: 0.5,
      });
    }), [goalCardWidth]);

  const goalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: goalTranslateX.value }],
  }));

  const handleGoalPress = (goal: Goal) => {
    setSelectedGoal(goal);
    if (isGoalEditMode) {
      setShowEditModal(true);
    } else {
      setShowTransactionModal(true);
    }
  };

  useEffect(() => {
    registerBudgetsRefresh(refresh);
    registerCategoriesRefresh(loadCategories);
    registerGoalsRefresh(loadGoals);
  }, [
    registerBudgetsRefresh,
    refresh,
    registerCategoriesRefresh,
    loadCategories,
    registerGoalsRefresh,
    loadGoals,
  ]);

  const handleSaveIncome = async (useDynamic: boolean, income: number) => {
    await saveIncomeSettings(useDynamic, income);
    await refresh();
  };

  const handleInlineSave = (categoryId: string, amount: number | null, percentage?: number | null) => {
    const currentCategory = categories.find(c => c.id === categoryId);
    const hasChanged =
      currentCategory?.budget_amount !== amount ||
      currentCategory?.budget_percentage !== percentage;

    if (!hasChanged) return;

    updateCategoryOptimistic(categoryId, { budget_amount: amount, budget_percentage: percentage });
    if (amount === null) {
      removeCategoryBudget(categoryId);
    } else {
      upsertCategoryBudget(categoryId, amount);
    }

    updateCategoryBudgetAmount(categoryId, amount, percentage)
      .catch((error) => {
        console.error("Error saving budget amount:", error);
        refresh();
      });
  };

  const handleSetBudgetWithAI = useCallback(async () => {
    const budgetCategories = categories.filter(
      (cat) => cat.category_name !== "Income",
    );

    setAIModalView("loading");
    setAILoading(true);
    setAIError(null);
    setAIAllocations(null);

    const result = await getBudgetAllocations(
      budgetCategories.map((c) => ({
        id: c.id,
        category_name: c.category_name,
      })),
      monthlyIncome,
    );

    setAILoading(false);

    if (result.success) {
      setAIAllocations(result.allocations);
      setAIFromCache(result.fromCache);
      setAISpendingBudget(result.spendingBudget);
      setAISavingsAmount(result.savingsAmount);
      setAIModalView("results");
    } else {
      setAIError("error" in result ? result.error : "Unknown error occurred");
      setAIModalView("info");
    }
  }, [categories, monthlyIncome]);

  const handleApplyAIBudget = useCallback(async () => {
    if (!aiAllocations) return;

    setAIApplying(true);
    try {
      const allocations = aiAllocations.map((a) => ({
        categoryId: a.categoryId,
        percentage: a.percentage,
        amount: a.amount,
      }));

      await updateCategoryBudgetPercentages(allocations);
      await loadCategories();
      await refresh();
      refreshDashboard();

      setAIModalView(null);
      setAIAllocations(null);
      setAIError(null);
    } catch (error) {
      console.error("Error applying AI budget:", error);
      setAIError("Failed to save budget. Please try again.");
    } finally {
      setAIApplying(false);
    }
  }, [aiAllocations, loadCategories, refresh, refreshDashboard]);

  const handleRetryAI = useCallback(() => {
    handleSetBudgetWithAI();
  }, [handleSetBudgetWithAI]);

  const handleCloseAIModal = useCallback(() => {
    setAIModalView(null);
    setAIAllocations(null);
    setAIError(null);
    setAILoading(false);
  }, []);

  const handleDragEnd = useCallback(
    async ({ data }: { data: BudgetListItem[] }) => {
      const categoryItems = data.filter((item): item is CategoryListItem => item.type === 'category');
      const reorderedCategories = categoryItems.map((item) => ({
        ...item.category,
        sort_order: data.indexOf(item),
      }));
      reorderCategories(reorderedCategories);

      try {
        await updateCategoriesOrder(
          reorderedCategories.map((cat) => ({
            id: cat.id,
            sort_order: cat.sort_order!,
          })),
        );
      } catch (error) {
        console.error("Error saving category order:", error);
        refresh();
      }
    },
    [reorderCategories, refresh],
  );

  const handleDeleteCategory = useCallback((category: Category, swipeableRef: React.RefObject<SwipeableMethods | null>) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Category?',
      `"${category.category_name}" will be removed from all your transactions. This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              deleteCategoryOptimistic(category.id.toString());
              const userId = await getUserId();
              if (!userId) throw new Error('Not authenticated');
              await deleteCategory(category.id.toString(), userId);
              await loadCategories();
              await loadAccounts();
              refreshAll();
              refreshDashboard();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete category');
              loadCategories();
            }
          },
        },
      ]
    );
  }, [deleteCategoryOptimistic, loadCategories, loadAccounts, refreshAll, refreshDashboard]);

  const { allBudgetItems, hasCustomOrder } = useMemo(() => {
    const budgetMap = new Map<string, CategoryBudgetStatus>();
    categoryBudgets.forEach((cb) => budgetMap.set(cb.category.id, cb));

    const filteredCategories = categories.filter(
      (cat) => cat.category_name !== "Income",
    );

    const customOrder = filteredCategories.some(
      (cat) => cat.sort_order !== undefined,
    );

    const goalsItem: GoalsListItem = { type: 'goals' };

    if (customOrder) {
      const categoryItems: BudgetListItem[] = filteredCategories.map((cat) => ({
        type: 'category' as const,
        category: cat,
        budgetStatus: budgetMap.get(cat.id) ?? null,
      }));

      const allItems: BudgetListItem[] = [goalsItem, ...categoryItems];

      return {
        allBudgetItems: allItems,
        hasCustomOrder: true,
      };
    }

    const budgeted: CategoryListItem[] = [];
    const unbudgeted: CategoryListItem[] = [];

    filteredCategories.forEach((cat) => {
      const status = budgetMap.get(cat.id) ?? null;
      if (status) {
        budgeted.push({ type: 'category', category: cat, budgetStatus: status });
      } else {
        unbudgeted.push({ type: 'category', category: cat, budgetStatus: null });
      }
    });

    const allItems: BudgetListItem[] = [goalsItem, ...budgeted, ...unbudgeted];

    return {
      allBudgetItems: allItems,
      hasCustomOrder: false,
    };
  }, [categories, categoryBudgets]);

  const unbudgetedStartIndex = allBudgetItems.findIndex(
    (item) => item.type === 'category' && item.budgetStatus === null,
  );

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkMode ? 'bg-backgroundDark' : 'bg-background'}`}
      edges={["top"]}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <View>
          <Text className={`text-3xl font-extrabold -tracking-tight ${isDarkMode ? 'text-slate50' : 'text-slate800'}`}>
            Budgets
          </Text>
          <Text className={`text-xs mt-0.5 ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`}>
            {isReorderMode
              ? "Hold & drag to reorder"
              : "Manage your spending limits"}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setIsReorderMode(!isReorderMode)}
            className={`w-9 h-9 rounded-xl items-center justify-center border ${
              isReorderMode
                ? 'bg-accentTeal border-accentTeal'
                : isDarkMode
                  ? 'bg-slate700 border-slate600'
                  : 'bg-slate50 border-slate100'
            }`}
          >
            <Ionicons
              name="reorder-three"
              size={18}
              color={
                isReorderMode ? "#FFF" : isDarkMode ? "#8B99AE" : "#94A3B8"
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAIModalView("info")}
            className="w-9 h-9 rounded-xl items-center justify-center bg-accentBlue"
          >
            <Ionicons name="sparkles" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <DraggableFlatList
        data={isLoading ? [] : allBudgetItems}
        keyExtractor={(item) => item.type === 'goals' ? 'goals' : item.category.id.toString()}
        onDragEnd={handleDragEnd}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 220 }}
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <>
            {isLoading && !isReorderMode && (
              <BudgetsSkeleton isDarkMode={isDarkMode} />
            )}

            {!isLoading && !isConnected && !isReorderMode && (
              <OfflineEmptyState />
            )}

            {!isLoading && isConnected && !isReorderMode && (
              <MotiView
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 350 }}
              >
                <IncomeCard
                  income={monthlyIncome}
                  currencySymbol={currencySymbol}
                  useDynamicIncome={useDynamicIncome}
                  manualIncome={manualIncome}
                  dynamicIncome={dynamicIncome}
                  isDarkMode={isDarkMode}
                  onSave={handleSaveIncome}
                />
              </MotiView>
            )}

            {!isLoading &&
              !isReorderMode &&
              !hasCustomOrder &&
              categoryBudgets.length > 0 && (
                <View className="flex-row items-center mb-2 mt-1 px-1">
                  <View className="w-1.5 h-1.5 rounded-full mr-2 bg-accentTeal" />
                  <Text className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`}>
                    Budgeted
                  </Text>
                </View>
              )}
          </>
        }
        renderItem={({
          item,
          drag,
          isActive,
          getIndex,
        }: RenderItemParams<BudgetListItem>) => {
          const index = getIndex() ?? 0;

          // Render goals section
          if (item.type === 'goals') {
            return (
              <ScaleDecorator>
                {isReorderMode ? (
                  <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    delayLongPress={100}
                    className={`mb-2 rounded-2xl p-4 flex-row items-center border ${
                      isActive ? 'bg-gray600 border-accentPurple opacity-90' : 'bg-surfaceDark border-borderDark'
                    }`}
                  >
                    <View className="mr-3">
                      <Ionicons name="menu" size={20} color="#7C8CA0" />
                    </View>
                    <View className="w-9 h-9 rounded-lg items-center justify-center mr-3 bg-purple-600">
                      <Ionicons name="flag" size={18} color="#fff" />
                    </View>
                    <Text className="text-slate100 text-sm flex-1">
                      Savings Goals
                    </Text>
                    <Text className="text-slateMuted text-xs">
                      {goals.length} goal{goals.length !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <MotiView
                    from={{ opacity: 0, translateY: 8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 250, delay: index * 25 }}
                    className="mb-2.5"
                  >
                    {/* Goals section header */}
                    <View className="flex-row items-center justify-between mb-2 px-1">
                      <View className="flex-row items-center">
                        <View className="w-1.5 h-1.5 rounded-full mr-2 bg-purple-500" />
                        <Text className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`}>
                          Savings Goals
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setIsGoalEditMode(!isGoalEditMode)}
                        className={`px-4 py-1 rounded-lg border items-center justify-center ${
                          isGoalEditMode
                            ? 'bg-accentBlue border-surfaceDark'
                            : 'bg-surfaceDark border-slate700'
                        }`}
                      >
                        <Text className={`text-sm ${isGoalEditMode ? 'text-white' : 'text-textDark'}`}>
                          {isGoalEditMode ? 'Done Editing' : 'Edit Goals'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {goals.length === 0 ? (
                      <Pressable
                        onPress={() => setShowCreateModal(true)}
                        className="rounded-2xl p-4 border border-dashed border-purple-500/30 items-center"
                        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                      >
                        <Text className="text-purple-400 font-medium text-sm">Create your first goal</Text>
                        <Text className="text-slateMuted text-xs mt-0.5">Emergency fund, vacation, new car...</Text>
                      </Pressable>
                    ) : (
                      <View className={`rounded-2xl border border-borderDark ${isGoalEditMode ? 'bg-black/40' : 'bg-surfaceDark'}`} style={{ overflow: 'hidden' }}>
                        <GestureDetector gesture={goalPanGesture}>
                          <Animated.View style={[{ flexDirection: 'row', width: goalCardWidth * goals.length }, goalAnimatedStyle]}>
                            {goals.map((goal) => (
                              <View key={goal.id} style={{ width: goalCardWidth }}>
                                <GoalProgressCard
                                  goal={goal}
                                  currencySymbol={currencySymbol}
                                  onPress={() => handleGoalPress(goal)}
                                  noBg
                                  isEditMode={isGoalEditMode}
                                />
                              </View>
                            ))}
                          </Animated.View>
                        </GestureDetector>
                        {goals.length > 1 && (
                          <View className="flex-row justify-center pb-3 gap-1.5">
                            {goals.map((_, i) => (
                              <View
                                key={i}
                                style={{
                                  width: i === activeGoalIndex ? 16 : 6,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: i === activeGoalIndex ? '#a78bfa' : '#374151',
                                }}
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                    {isGoalEditMode && goals.length > 0 && (
                      <MotiView
                        from={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 250 }}
                        className="mt-2"
                      >
                        <TouchableOpacity
                          onPress={() => setShowCreateModal(true)}
                          className="bg-backgroundDark border border-slate500 rounded-2xl px-4 py-3 flex-row items-center justify-center gap-3 self-stretch"
                          activeOpacity={0.7}
                        >
                          <View
                            className="w-9 h-9 rounded-xl items-center justify-center"
                            style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' }}
                          >
                            <Ionicons name="add-outline" size={20} color="#6366f1" />
                          </View>
                          <Text className="text-slate200 text-sm">Add Goal</Text>
                        </TouchableOpacity>
                      </MotiView>
                    )}
                  </MotiView>
                )}
              </ScaleDecorator>
            );
          }

          // Render category item
          return (
            <ScaleDecorator>
              <>
                {!isReorderMode &&
                  !hasCustomOrder &&
                  index === unbudgetedStartIndex &&
                  unbudgetedStartIndex >= 0 && (
                    <View className={`flex-row items-center mb-2 px-1 ${index > 0 ? 'mt-4' : ''}`}>
                      <View className="w-1.5 h-1.5 rounded-full mr-2 bg-slateMuted" />
                      <Text className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`}>
                        Unbudgeted
                      </Text>
                    </View>
                  )}
                {isReorderMode ? (
                  <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    delayLongPress={100}
                    className={`mb-2 rounded-2xl p-4 flex-row items-center border ${
                      isActive ? 'bg-gray600 border-accentTeal opacity-90' : 'bg-surfaceDark border-borderDark'
                    }`}
                  >
                    <View className="mr-3">
                      <Ionicons name="menu" size={20} color="#7C8CA0" />
                    </View>
                    <View
                      className="w-9 h-9 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: item.category.color }}
                    >
                      <Ionicons
                        name={item.category.icon as any}
                        size={18}
                        color="#fff"
                      />
                    </View>
                    <Text className="text-slate100 text-sm flex-1">
                      {item.category.category_name}
                    </Text>
                    {item.budgetStatus && (
                      <Text className="text-slateMuted text-xs">
                        {currencySymbol}
                        {item.budgetStatus.budget_amount.toLocaleString()}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <SwipeableCategoryRow
                    item={item}
                    index={index}
                    currencySymbol={currencySymbol}
                    monthlyIncome={monthlyIncome}
                    onSave={handleInlineSave}
                    onToggleExpand={() =>
                      setEditBudgetCategory({ category: item.category, budgetStatus: item.budgetStatus })
                    }
                    onDelete={handleDeleteCategory}
                  />
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
              transition={{ type: "timing", duration: 400, delay: 200 }}
              className="items-center justify-center py-8"
            >
              <Text className={`text-base ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`}>
                No categories found
              </Text>
            </MotiView>
          ) : null
        }
      />

      {/* AI modal */}
      <Modal
        visible={aiModalView !== null}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={aiLoading ? undefined : handleCloseAIModal}
      >
        <SafeAreaView className="flex-1 bg-backgroundDark">

          {/* ── Info screen ── */}
          {aiModalView === "info" && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 300 }}
              className="flex-1"
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}
              >
                {/* Close button */}
                <TouchableOpacity
                  onPress={handleCloseAIModal}
                  className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center mb-8 mt-1"
                >
                  <ArrowLeft color="#94A3B8" size={20} />
                </TouchableOpacity>

                {/* Icon */}
                <View className="items-center mb-6">
                  <View className="w-20 h-20 rounded-full bg-accentBlue/15 items-center justify-center">
                    <View className="w-14 h-14 rounded-full bg-accentBlue items-center justify-center">
                      <Sparkles size={28} color="#fff" />
                    </View>
                  </View>
                </View>

                {/* Title */}
                <Text className="text-center text-2xl font-bold text-textDark mb-1">
                  Smart Budget Setup
                </Text>
                <Text className="text-center text-sm text-secondaryDark mb-8">
                  Based on your {currencySymbol}{monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} monthly income
                </Text>

                {/* 2-col grid: Needs + Wants */}
                <View className="flex-row gap-3 mb-3">
                  {[
                    { pct: "50%", label: "Needs", desc: "Rent, groceries, transport & essentials", color: "#139B8B" },
                    { pct: "30%", label: "Wants", desc: "Dining, shopping & entertainment", color: "#6D3FD4" },
                  ].map((rule) => (
                    <View
                      key={rule.label}
                      className="flex-1 rounded-2xl p-4"
                      style={{ backgroundColor: rule.color + '22', borderWidth: 1, borderColor: rule.color + '55' }}
                    >
                      <Text className="text-3xl font-black mb-1" style={{ color: rule.color }}>{rule.pct}</Text>
                      <Text className="text-base font-bold text-textDark mb-1">{rule.label}</Text>
                      <Text className="text-xs text-secondaryDark leading-4">{rule.desc}</Text>
                    </View>
                  ))}
                </View>

                {/* Savings — full width centered */}
                <View
                  className="rounded-2xl p-4 mb-8"
                  style={{ backgroundColor: '#2550D422', borderWidth: 1, borderColor: '#2550D455' }}
                >
                  <View className="flex-row items-center gap-3">
                    <View>
                      <Text className="text-3xl font-black mb-1" style={{ color: '#5B8BFF' }}>20%</Text>
                      <Text className="text-base font-bold text-textDark mb-1">Savings</Text>
                      <Text className="text-xs text-secondaryDark leading-4">Emergency fund, investments & debt payoff</Text>
                    </View>
                    <View className="flex-1 items-end">
                      <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: '#2550D433' }}>
                        <TrendingUp size={22} color="#5B8BFF" />
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Action buttons */}
              <View className="px-4 pb-8 pt-3 gap-3">
                <TouchableOpacity
                  onPress={handleSetBudgetWithAI}
                  className="bg-accentBlue rounded-2xl py-4 items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-base">Generate My Budget</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCloseAIModal}
                  className="bg-surfaceDark rounded-2xl py-4 items-center border border-borderDark"
                  activeOpacity={0.7}
                >
                  <Text className="text-secondaryDark font-semibold text-base">I&apos;ll do it myself</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          )}

          {/* ── Loading screen ── */}
          {aiModalView === "loading" && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 600 }}
              className="flex-1 items-center justify-center px-6"
            >
              <Sparkles size={48} color="#3B7EFF" />
              <ActivityIndicator size="large" color="#3B7EFF" style={{ marginTop: 20 }} />
              <Text className="text-white text-xl font-semibold mt-4 text-center">
                Creating your smart budget...
              </Text>
              <Text className="text-secondaryDark text-sm mt-2 text-center">
                Using the 50/30/20 rule
              </Text>
            </MotiView>
          )}

          {/* ── Results screen ── */}
          {aiModalView === "results" && aiAllocations && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 400 }}
              className="flex-1"
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 }}
              >
                {/* Headline */}
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 100, duration: 500 }}
                  className="mb-6 mt-2"
                >
                  <Text className="text-3xl text-white text-center font-bold mb-1">Your Smart Budget</Text>
                  <Text className="text-secondaryDark text-sm text-center">
                    Based on your {currencySymbol}{monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} monthly income
                  </Text>
                </MotiView>

                {/* Summary pills */}
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 200, duration: 500 }}
                  className="flex-row justify-center gap-2 mb-6"
                >
                  <View className="bg-green-500/20 border border-green-500 rounded-full px-4 py-2">
                    <Text className="text-green-400 text-xs font-semibold">
                      Needs {aiAllocations.filter(a => a.classification === 'needs').reduce((s, a) => s + a.percentage, 0).toFixed(1)}%
                    </Text>
                  </View>
                  <View className="bg-blue-500/20 border border-blue-500 rounded-full px-4 py-2">
                    <Text className="text-blue-400 text-xs font-semibold">
                      Wants {aiAllocations.filter(a => a.classification === 'wants').reduce((s, a) => s + a.percentage, 0).toFixed(1)}%
                    </Text>
                  </View>
                  <View className="bg-purple-500/20 border border-purple-500 rounded-full px-4 py-2">
                    <Text className="text-purple-400 text-xs font-semibold">Savings 20%</Text>
                  </View>
                </MotiView>

                {/* Spending & Savings card */}
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 300, duration: 500 }}
                  className="mb-6"
                >
                  <View className="bg-surfaceDark border border-borderDark rounded-3xl p-4">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-white text-base font-semibold">Spending Budget</Text>
                      <Text className="text-white text-lg font-bold">
                        {currencySymbol}{aiSpendingBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2">
                        <TrendingUp size={16} color="#22C55E" />
                        <Text className="text-secondaryDark text-base">Savings Goal</Text>
                      </View>
                      <Text className="text-green-400 text-lg font-bold">
                        {currencySymbol}{aiSavingsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>
                </MotiView>

                {/* Category list */}
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 400, duration: 500 }}
                  className="mb-6"
                >
                  <Text className="text-white text-lg font-semibold mb-3">Category Budgets</Text>
                  {aiAllocations.map((allocation, index) => {
                    const cat = categories.find(c => String(c.id) === String(allocation.categoryId));
                    const color = cat?.color || '#6B7280';
                    const icon = cat?.icon || 'apps-outline';
                    return (
                      <MotiView
                        key={allocation.categoryId}
                        from={{ opacity: 0, translateX: -20 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={{ delay: 500 + index * 80, duration: 400 }}
                        className="mb-3"
                      >
                        <View className="bg-surfaceDark border border-borderDark rounded-2xl p-4 flex-row items-center">
                          <View
                            className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: color }}
                          >
                            <Ionicons name={icon as any} size={20} color="#fff" />
                          </View>
                          <Text className="text-textDark text-[15px] font-semibold flex-1">{allocation.categoryName}</Text>
                          <View className="items-end">
                            <Text className="text-textDark text-base font-bold">
                              {currencySymbol}{allocation.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                            <Text className="text-secondaryDark text-xs mt-0.5">
                              {allocation.percentage.toFixed(1)}% of income
                            </Text>
                          </View>
                        </View>
                      </MotiView>
                    );
                  })}
                </MotiView>
              </ScrollView>

              {/* Apply / Cancel buttons */}
              <View className="px-4 pb-8 pt-3 gap-3">
                <TouchableOpacity
                  onPress={handleApplyAIBudget}
                  disabled={aiApplying}
                  className="bg-accentBlue rounded-2xl py-4 items-center"
                  activeOpacity={0.8}
                >
                  {aiApplying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-base">Apply Smart Budget</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCloseAIModal}
                  disabled={aiApplying}
                  className="py-4 items-center bg-surfaceDark rounded-2xl border border-borderDark"
                  activeOpacity={0.7}
                >
                  <Text className="text-secondaryDark font-semibold text-base">Cancel</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          )}

        </SafeAreaView>
      </Modal>

      {/* Edit Budget Modal */}
      {editBudgetCategory && (
        <EditBudgetModal
          visible={editBudgetCategory !== null}
          category={editBudgetCategory.category}
          budgetStatus={editBudgetCategory.budgetStatus}
          currencySymbol={currencySymbol}
          monthlyIncome={monthlyIncome}
          onClose={() => setEditBudgetCategory(null)}
          onSaved={() => {
            setEditBudgetCategory(null);
            refreshDashboard();
          }}
        />
      )}

      {/* Goal Modals */}
      <CreateGoalModal
        visible={showCreateModal}
        currencySymbol={currencySymbol}
        existingNames={goals.map((g) => g.name)}
        onClose={() => setShowCreateModal(false)}
        onGoalCreated={loadGoals}
      />

      <EditGoalModal
        visible={showEditModal}
        goal={selectedGoal}
        currencySymbol={currencySymbol}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGoal(null);
        }}
        onGoalUpdated={loadGoals}
      />

      <GoalTransactionModal
        visible={showTransactionModal}
        goal={selectedGoal}
        accounts={accounts}
        currencySymbol={currencySymbol}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedGoal(null);
        }}
        onTransactionComplete={loadGoals}
      />
    </SafeAreaView>
  );
}

// --- Swipeable delete action background ---
function CategoryDeleteAction({ drag }: { drag: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(drag.value, [-80, -40, 0], [1, 0.85, 0.7], 'clamp');
    const opacity = interpolate(drag.value, [-80, -30, 0], [1, 0.8, 0], 'clamp');
    return { transform: [{ scale }], opacity };
  });

  return (
    <View className="bg-red-500 rounded-2xl mb-2.5 justify-center items-center" style={{ width: 80 }}>
      <Animated.View style={animatedStyle} className="items-center justify-center">
        <Ionicons name="trash-outline" size={24} color="white" />
      </Animated.View>
    </View>
  );
}

// --- Swipeable wrapper for CategoryBudgetRow ---
function SwipeableCategoryRow({
  item,
  index,
  currencySymbol,
  monthlyIncome,
  onSave,
  onToggleExpand,
  onDelete,
}: {
  item: CategoryListItem;
  index: number;
  currencySymbol: string;
  monthlyIncome: number;
  onSave: (categoryId: string, amount: number | null, percentage?: number | null) => void;
  onToggleExpand: () => void;
  onDelete: (category: Category, ref: React.RefObject<SwipeableMethods | null>) => void;
}) {
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleSwipeOpen = useCallback(() => {
    onDelete(item.category, swipeableRef);
  }, [item.category, onDelete]);

  const renderRightActions = useCallback(
    (_progress: SharedValue<number>, drag: SharedValue<number>) => (
      <CategoryDeleteAction drag={drag} />
    ),
    []
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={60}
      overshootRight={false}
      onSwipeableOpen={handleSwipeOpen}
      friction={2}
    >
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 250, delay: index * 25 }}
        className="mb-2.5"
      >
        <CategoryBudgetRow
          item={item.budgetStatus}
          category={item.category}
          currencySymbol={currencySymbol}
          monthlyIncome={monthlyIncome}
          onSave={onSave}
          showOnDashboard={item.category.show_on_dashboard ?? true}
          onToggleDashboard={toggleCategoryDashboardVisibility}
          expanded={false}
          onToggleExpand={onToggleExpand}
        />
      </MotiView>
    </ReanimatedSwipeable>
  );
}
