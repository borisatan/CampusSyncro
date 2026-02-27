import { Ionicons } from "@expo/vector-icons";
import { PiggyBank } from "lucide-react-native";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

import { AIBudgetPreviewModal } from "../components/BudgetsPage/AIBudgetPreviewModal";
import { BudgetsSkeleton } from "../components/BudgetsPage/BudgetsSkeleton";
import { CategoryBudgetRow } from "../components/BudgetsPage/CategoryBudgetRow";
import { IncomeCard } from "../components/BudgetsPage/IncomeCard";
import { QuickSavingsModal } from "../components/BudgetsPage/QuickSavingsModal";
import { SavingsProgressCard } from "../components/BudgetsPage/SavingsProgressCard";
import { useAuth } from "../context/AuthContext";
import { useSavingsProgress } from "../hooks/useSavingsProgress";
import { useDataRefresh } from "../context/DataRefreshContext";
import { useTheme } from "../context/ThemeContext";
import { useBudgetsData } from "../hooks/useBudgetsData";
import {
  quickSaveFromAccount,
  updateCategoriesOrder,
  updateCategoryBudgetAmount,
  updateCategoryBudgetPercentages,
} from "../services/backendService";
import { useAccountsStore } from "../store/useAccountsStore";
import {
  BudgetAllocation,
  getBudgetAllocations,
} from "../services/budgetAIService";
import { useCategoriesStore } from "../store/useCategoriesStore";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useDashboardCategoriesStore } from "../store/useDashboardCategoriesStore";
import { useIncomeStore } from "../store/useIncomeStore";
import { Category, CategoryBudgetStatus } from "../types/types";

interface CategoryListItem {
  type: 'category';
  category: Category;
  budgetStatus: CategoryBudgetStatus | null;
}

interface SavingsListItem {
  type: 'savings';
}

type BudgetListItem = CategoryListItem | SavingsListItem;

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
  const { useDynamicIncome, manualIncome, saveIncomeSettings, setSavingsTarget, savingsSortOrder, setSavingsSortOrder, showSavingsOnDashboard, toggleShowSavingsOnDashboard } =
    useIncomeStore();
  const { target: savingsTarget, saved: savingsSaved, percentage: savingsPercentage, refresh: refreshSavingsProgress } =
    useSavingsProgress();
  const { categories, updateCategoryOptimistic, reorderCategories } =
    useCategoriesStore();
  const { pinnedCategoryIds, togglePinnedCategory } =
    useDashboardCategoriesStore();
  const { accounts, updateAccountBalance } = useAccountsStore();
  const { userId } = useAuth();
  const {
    refreshDashboard,
    refreshAccounts,
    registerBudgetsRefresh,
    registerCategoriesRefresh,
  } = useDataRefresh();
  const loadCategories = useCategoriesStore((state) => state.loadCategories);
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(
    null,
  );
  const [isReorderMode, setIsReorderMode] = useState(false);

  // AI Budget state — single modal with two views: 'help' and 'preview'
  const [aiModalView, setAIModalView] = useState<"help" | "preview" | null>(
    null,
  );
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [aiAllocations, setAIAllocations] = useState<BudgetAllocation[] | null>(
    null,
  );
  const [aiFromCache, setAIFromCache] = useState(false);
  const [aiSpendingBudget, setAISpendingBudget] = useState(0);
  const [aiSavingsAmount, setAISavingsAmount] = useState(0);
  const [aiApplying, setAIApplying] = useState(false);

  // Quick savings modal state
  const [showQuickSavingsModal, setShowQuickSavingsModal] = useState(false);
  const [savingsModalMode, setSavingsModalMode] = useState<'add' | 'withdraw'>('add');

  const handleQuickSave = useCallback(async (accountId: number, accountName: string, amount: number) => {
    if (!userId) return;

    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const newBalance = account.balance - amount;

    // Optimistic UI update
    updateAccountBalance(accountName, newBalance);

    try {
      await quickSaveFromAccount({
        user_id: userId,
        account_name: accountName,
        amount,
        source_account_id: accountId,
        new_balance: newBalance,
      });

      // Refresh savings progress and accounts
      await Promise.all([refreshSavingsProgress(), refreshAccounts()]);
    } catch (error) {
      // Rollback on error
      updateAccountBalance(accountName, account.balance);
      throw error;
    }
  }, [userId, accounts, updateAccountBalance, refreshSavingsProgress, refreshAccounts]);

  const handleToggleExpand = useCallback((categoryId: number) => {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  useEffect(() => {
    registerBudgetsRefresh(refresh);
    registerCategoriesRefresh(loadCategories);
  }, [
    registerBudgetsRefresh,
    refresh,
    registerCategoriesRefresh,
    loadCategories,
  ]);

  const handleSaveIncome = async (useDynamic: boolean, income: number) => {
    await saveIncomeSettings(useDynamic, income);
    await refresh();
  };

  const handleInlineSave = (categoryId: number, amount: number | null, percentage?: number | null) => {
    // Optimistic updates — immediate UI feedback
    updateCategoryOptimistic(categoryId, { budget_amount: amount, budget_percentage: percentage });
    if (amount === null) {
      removeCategoryBudget(categoryId);
    } else {
      upsertCategoryBudget(categoryId, amount);
    }

    // Persist in background, refresh on completion
    updateCategoryBudgetAmount(categoryId, amount, percentage)
      .then(() => {
        refresh();
        refreshDashboard();
      })
      .catch((error) => {
        console.error("Error saving budget amount:", error);
        refresh();
      });
  };

  const handleSetBudgetWithAI = useCallback(async () => {
    const budgetCategories = categories.filter(
      (cat) => cat.category_name !== "Income",
    );

    // Switch from help view to preview view within the same modal — no flicker
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
      await setSavingsTarget(aiSavingsAmount);
      await loadCategories(); // Reload categories to get updated budget amounts
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
  }, [aiAllocations, aiSavingsAmount, loadCategories, refresh, refreshDashboard, setSavingsTarget]);

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
      // Find the new position of savings card
      const savingsIndex = data.findIndex(item => item.type === 'savings');
      if (savingsIndex !== -1) {
        setSavingsSortOrder(savingsIndex);
      }

      // Extract and reorder categories (adjust indices for savings position)
      const categoryItems = data.filter((item): item is CategoryListItem => item.type === 'category');
      const reorderedCategories = categoryItems.map((item, index) => {
        // Calculate actual sort order accounting for savings card position
        let sortOrder = index;
        if (savingsIndex !== -1 && index >= savingsIndex) {
          sortOrder = index + 1;
        }
        return {
          ...item.category,
          sort_order: data.indexOf(item),
        };
      });
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
    [reorderCategories, refresh, setSavingsSortOrder],
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

    const savingsItem: SavingsListItem = { type: 'savings' };

    if (customOrder) {
      // Build items with sort orders, including savings card
      const categoryItems: BudgetListItem[] = filteredCategories.map((cat) => ({
        type: 'category' as const,
        category: cat,
        budgetStatus: budgetMap.get(cat.id) ?? null,
      }));

      // Insert savings card at its saved position
      const allItems: BudgetListItem[] = [...categoryItems];
      const insertPosition = Math.min(savingsSortOrder, allItems.length);
      allItems.splice(insertPosition, 0, savingsItem);

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

    // Insert savings at the beginning (position 0) if no custom order
    const allItems: BudgetListItem[] = [savingsItem, ...budgeted, ...unbudgeted];

    return {
      allBudgetItems: allItems,
      hasCustomOrder: false,
    };
  }, [categories, categoryBudgets, savingsSortOrder]);

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
        keyExtractor={(item) => item.type === 'savings' ? 'savings' : item.category.id.toString()}
        onDragEnd={handleDragEnd}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 150 }}
        ListHeaderComponent={
          <>
            {/* Show skeleton when loading */}
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

            {/* Section label */}
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

          // Render savings card
          if (item.type === 'savings') {
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
                    <View className="w-9 h-9 rounded-lg items-center justify-center mr-3 bg-accentPurple">
                      <PiggyBank size={18} color="#fff" />
                    </View>
                    <Text className="text-slate100 text-sm flex-1">
                      Monthly Savings
                    </Text>
                    {savingsTarget > 0 && (
                      <Text className="text-slateMuted text-xs">
                        {currencySymbol}
                        {savingsTarget.toLocaleString()}
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
                    <SavingsProgressCard
                      target={savingsTarget}
                      saved={savingsSaved}
                      percentage={savingsPercentage}
                      currencySymbol={currencySymbol}
                      monthlyIncome={monthlyIncome}
                      showOnDashboard={showSavingsOnDashboard}
                      onToggleDashboard={toggleShowSavingsOnDashboard}
                      onAddPress={() => {
                        setSavingsModalMode('add');
                        setShowQuickSavingsModal(true);
                      }}
                      onWithdrawPress={() => {
                        setSavingsModalMode('withdraw');
                        setShowQuickSavingsModal(true);
                      }}
                    />
                  </MotiView>
                )}
              </ScaleDecorator>
            );
          }

          // Render category item
          return (
            <ScaleDecorator>
              <>
                {/* "Unbudgeted" section header */}
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
                      style={{ backgroundColor: item.category.color }} // Dynamic color from data
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
                      showOnDashboard={
                        pinnedCategoryIds.length === 0 ||
                        pinnedCategoryIds.includes(item.category.id)
                      }
                      onToggleDashboard={togglePinnedCategory}
                      expanded={expandedCategoryId === item.category.id}
                      onToggleExpand={() =>
                        handleToggleExpand(item.category.id)
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

      {/* Unified AI overlay — always mounted, no native Modal delay */}
      {aiModalView !== null && (
        <View className="absolute inset-0 z-[100] justify-center items-center bg-overlayDark">
          <Pressable
            className="absolute inset-0"
            onPress={handleCloseAIModal}
          />
          {aiModalView === "help" && (
            <View
              className={`w-[94%] rounded-2xl p-4 border max-h-[80%] ${
                isDarkMode ? "bg-backgroundDark border-borderDark" : "bg-background border-borderLight"
              }`}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Sparkle badge */}
                <View className="items-center mb-4">
                  <View className="w-14 h-14 rounded-2xl items-center justify-center bg-accentBlue">
                    <Ionicons name="sparkles" size={28} color="#FFFFFF" />
                  </View>
                </View>

                <Text
                  className={`text-center mb-2 text-[23px] font-bold ${
                    isDarkMode ? "text-textDark" : "text-textLight"
                  }`}
                >
                  Smart Budget Setup
                </Text>
                <Text
                  className={`text-center mb-5 text-[15px] leading-[22px] ${
                    isDarkMode ? "text-secondaryDark" : "text-secondaryLight"
                  }`}
                >
                  Let us allocate your budget using the proven 50/30/20 rule
                </Text>

                {/* Rule cards */}
                {[
                  {
                    pct: "50%",
                    label: "Needs",
                    desc: "Rent, groceries, utilities",
                    color: "#3B7EFF",
                  },
                  {
                    pct: "30%",
                    label: "Wants",
                    desc: "Dining, hobbies, entertainment",
                    color: "#F2514A",
                  },
                  {
                    pct: "20%",
                    label: "Savings",
                    desc: "Emergency fund, investments",
                    color: "#22D97A",
                  },
                ].map((rule) => (
                  <View
                    key={rule.label}
                    className={`flex-row items-center mb-2.5 p-3 rounded-xl border ${
                      isDarkMode ? "bg-surfaceDark border-borderDark" : "bg-background border-borderLight"
                    }`}
                  >
                    <View
                      className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: `${rule.color}60` }}
                    >
                      <Text className="text-sm font-extrabold text-white">
                        {rule.pct}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-[15px] font-semibold ${
                          isDarkMode ? "text-textDark" : "text-textLight"
                        }`}
                      >
                        {rule.label}
                      </Text>
                      <Text
                        className={`text-[13px] ${
                          isDarkMode ? "text-secondaryDark" : "text-secondaryLight"
                        }`}
                      >
                        {rule.desc}
                      </Text>
                    </View>
                  </View>
                ))}

                <View
                  className={`rounded-xl p-3 mt-2 mb-4 border ${
                    isDarkMode ? "bg-surfaceDark border-borderDark" : "bg-amber-50 border-amber-100"
                  }`}
                >
                  <Text
                    className={`text-[13px] leading-[18px] ${
                      isDarkMode ? "text-secondaryDark" : "text-amber-800"
                    }`}
                  >
                    <Text className="font-semibold">Tip:</Text> You can
                    always tweak the amounts afterwards to match your lifestyle.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleSetBudgetWithAI}
                  className="rounded-xl py-3.5 items-center bg-accentBlue"
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="sparkles" size={16} color="#FFF" />
                    <Text className="text-white font-bold text-base">
                      Generate My Budget
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCloseAIModal}
                  className={`mt-2.5 rounded-xl py-3 items-center border ${
                    isDarkMode ? "bg-surfaceDark border-borderDark" : "bg-background border-borderLight"
                  }`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-[15px] font-semibold ${
                      isDarkMode ? "text-secondaryDark" : "text-secondaryLight"
                    }`}
                  >
                    I'll do it myself
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
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
        </View>
      )}

      {/* Quick Savings Modal */}
      <QuickSavingsModal
        visible={showQuickSavingsModal}
        mode={savingsModalMode}
        accounts={accounts}
        currencySymbol={currencySymbol}
        targetRemaining={Math.max(0, savingsTarget - savingsSaved)}
        currentlySaved={savingsSaved}
        onSave={handleQuickSave}
        onClose={() => setShowQuickSavingsModal(false)}
      />
    </SafeAreaView>
  );
}
