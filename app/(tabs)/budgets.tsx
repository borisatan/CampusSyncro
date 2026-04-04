import { Ionicons } from "@expo/vector-icons";
import { ArrowLeft } from "lucide-react-native";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
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
import { useDataRefresh } from "../context/DataRefreshContext";
import { useTheme } from "../context/ThemeContext";
import { useBudgetsData } from "../hooks/useBudgetsData";
import {
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
  const { categories, updateCategoryOptimistic, reorderCategories } = useCategoriesStore();
  const { accounts } = useAccountsStore();
  const { goals, loadGoals } = useGoalsStore();
  const {
    refreshDashboard,
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
  const [aiModalView, setAIModalView] = useState<"help" | "preview" | null>(null);
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
  const [transactionMode, setTransactionMode] = useState<'add' | 'withdraw'>('add');
  const [activeGoalIndex, setActiveGoalIndex] = useState(0);
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
      if (vx < -500) {
        page = Math.min(page + 1, goalCount.value - 1);
      } else if (vx > 500) {
        page = Math.max(page - 1, 0);
      } else {
        page = Math.round(-goalTranslateX.value / goalCardWidth);
        page = Math.max(0, Math.min(page, goalCount.value - 1));
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
    setShowEditModal(true);
  };

  const handleAddPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setTransactionMode('add');
    setShowTransactionModal(true);
  };

  const handleWithdrawPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setTransactionMode('withdraw');
    setShowTransactionModal(true);
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

    setAIModalView("preview");
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
    } else {
      setAIError("error" in result ? result.error : "Unknown error occurred");
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

  const { allBudgetItems, hasCustomOrder } = useMemo(() => {
    const budgetMap = new Map<number, CategoryBudgetStatus>();
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
            onPress={() => setAIModalView("help")}
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
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 150 }}
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <>
            {isLoading && !isReorderMode && (
              <BudgetsSkeleton isDarkMode={isDarkMode} />
            )}

            {!isLoading && !isReorderMode && (
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
                        onPress={() => setShowCreateModal(true)}
                        className="flex-row items-center"
                      >
                        <Ionicons name="add-circle-outline" size={16} color="#a78bfa" />
                        <Text className="text-purple-400 text-xs ml-1 font-medium">New Goal</Text>
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
                      <View className="bg-surfaceDark rounded-2xl border border-borderDark" style={{ overflow: 'hidden' }}>
                        <GestureDetector gesture={goalPanGesture}>
                          <Animated.View style={[{ flexDirection: 'row', width: goalCardWidth * goals.length }, goalAnimatedStyle]}>
                            {goals.map((goal) => (
                              <View key={goal.id} style={{ width: goalCardWidth }}>
                                <GoalProgressCard
                                  goal={goal}
                                  currencySymbol={currencySymbol}
                                  onPress={() => handleGoalPress(goal)}
                                  onAddPress={() => handleAddPress(goal)}
                                  onWithdrawPress={() => handleWithdrawPress(goal)}
                                  noBg
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
                  <MotiView
                    from={{ opacity: 0, translateY: 8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{
                      type: "timing",
                      duration: 250,
                      delay: index * 25,
                    }}
                    className="mb-2.5"
                  >
                    <CategoryBudgetRow
                      item={item.budgetStatus}
                      category={item.category}
                      currencySymbol={currencySymbol}
                      monthlyIncome={monthlyIncome}
                      onSave={handleInlineSave}
                      showOnDashboard={item.category.show_on_dashboard ?? true}
                      onToggleDashboard={toggleCategoryDashboardVisibility}
                      expanded={false}
                      onToggleExpand={() =>
                        setEditBudgetCategory({ category: item.category, budgetStatus: item.budgetStatus })
                      }
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
        animationType="none"
        statusBarTranslucent
        onRequestClose={aiLoading ? undefined : handleCloseAIModal}
      >
        <SafeAreaView className="flex-1 bg-backgroundDark">

          {aiModalView === "help" && (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24, paddingTop: 8 }}
                keyboardDismissMode="on-drag"
              >
                <View className="flex-row items-center justify-between mb-5 mt-1">
                  <TouchableOpacity
                    onPress={handleCloseAIModal}
                    className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-xl items-center justify-center"
                  >
                    <ArrowLeft color="#94A3B8" size={20} />
                  </TouchableOpacity>

                  <View className="w-[100px] h-[100px] rounded-[24px] bg-accentBlue/10 items-center justify-center">
                    <View className="w-[82px] h-[82px] rounded-[20px] bg-accentTeal items-center justify-center">
                      <Ionicons name="pie-chart-outline" size={42} color="#FFF" />
                    </View>
                  </View>

                  <View className="w-10" />
                </View>

                <Text className="text-center text-2xl font-extrabold text-textDark mb-1.5 leading-[30px]">
                  Let us allocate your budget{"\n"}using the proven{" "}
                  <Text className="text-accentBlue">50/30/20 rule</Text>
                </Text>
                <View className="h-6" />

                {[
                  { pct: "50%", label: "Needs",   desc: "Essential expenses like housing, transportation, and utilities", color: "#139B8B" },
                  { pct: "30%", label: "Wants",   desc: "Lifestyle choices like dining, shopping, and entertainment",     color: "#6D3FD4" },
                  { pct: "20%", label: "Savings", desc: "Future goals like emergency fund, investments, and debt payoff", color: "#2550D4" },
                ].map((rule) => (
                  <View
                    key={rule.label}
                    className="flex-row items-center mb-3 p-4 rounded-xl border bg-surfaceDark border-borderDark"
                  >
                    <View
                      className="w-[52px] h-[52px] rounded-xl items-center justify-center mr-4 border border-overlayLight"
                      style={{ backgroundColor: rule.color }}
                    >
                      <Text className="text-sm font-black text-white">{rule.pct}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-textDark mb-0.5">{rule.label}</Text>
                      <Text className="text-[13px] text-secondaryDark leading-[18px]">{rule.desc}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View className="flex-row gap-3 px-2 pt-3 pb-6">
                <TouchableOpacity
                  onPress={handleCloseAIModal}
                  className="flex-1 bg-surfaceDark rounded-xl py-4 items-center justify-center border border-borderDark"
                  activeOpacity={0.7}
                >
                  <Text className="text-textDark font-semibold text-base">I&apos;ll do it myself</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSetBudgetWithAI}
                  className="flex-1 bg-accentTeal rounded-xl py-4 items-center justify-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-base">Generate</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {aiModalView === "preview" && (
            <AIBudgetPreviewModal
              isLoading={aiLoading}
              isApplying={aiApplying}
              error={aiError}
              allocations={aiAllocations}
              categories={categories}
              monthlyIncome={monthlyIncome}
              spendingBudget={aiSpendingBudget}
              savingsAmount={aiSavingsAmount}
              currencySymbol={currencySymbol}
              fromCache={aiFromCache}
              onApply={handleApplyAIBudget}
              onCancel={handleCloseAIModal}
              onRetry={handleRetryAI}
            />
          )}

        </SafeAreaView>
      </Modal>

      {/* Edit Budget Modal */}
      {editBudgetCategory && (
        <EditBudgetModal
          visible={editBudgetCategory !== null}
          onClose={() => setEditBudgetCategory(null)}
          category={editBudgetCategory.category}
          budgetStatus={editBudgetCategory.budgetStatus}
          currencySymbol={currencySymbol}
          monthlyIncome={monthlyIncome}
          onSaved={() => {
            setEditBudgetCategory(null);
            refresh();
            refreshDashboard();
          }}
        />
      )}

      {/* Goal Modals */}
      <CreateGoalModal
        visible={showCreateModal}
        currencySymbol={currencySymbol}
        defaultAccountId={accounts[0]?.id ?? null}
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
        mode={transactionMode}
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
