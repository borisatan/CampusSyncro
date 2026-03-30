import { Ionicons } from "@expo/vector-icons";
import { ArrowLeft, PiggyBank } from "lucide-react-native";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

import { AIBudgetPreviewModal } from "../components/BudgetsPage/AIBudgetPreviewModal";
import { BudgetsSkeleton } from "../components/BudgetsPage/BudgetsSkeleton";
import { CategoryBudgetRow } from "../components/BudgetsPage/CategoryBudgetRow";
import { EditBudgetModal } from "../components/BudgetsPage/EditBudgetModal";
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
import { toggleCategoryDashboardVisibility } from "../store/useDashboardCategoriesStore";
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
  const { accounts, updateAccountBalance } = useAccountsStore();
  const { userId } = useAuth();
  const {
    refreshDashboard,
    refreshAccounts,
    registerBudgetsRefresh,
    registerCategoriesRefresh,
  } = useDataRefresh();
  const loadCategories = useCategoriesStore((state) => state.loadCategories);
  const [editBudgetCategory, setEditBudgetCategory] = useState<{
    category: Category;
    budgetStatus: CategoryBudgetStatus | null;
  } | null>(null);
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

  const handleInlineSave = (categoryId: string, amount: number | null, percentage?: number | null) => {
    // Get current values to detect actual changes
    const currentCategory = categories.find(c => c.id === categoryId);
    const hasChanged =
      currentCategory?.budget_amount !== amount ||
      currentCategory?.budget_percentage !== percentage;

    // Skip if nothing changed
    if (!hasChanged) return;

    // Optimistic updates — immediate UI feedback
    updateCategoryOptimistic(categoryId, { budget_amount: amount, budget_percentage: percentage });
    if (amount === null) {
      removeCategoryBudget(categoryId);
    } else {
      upsertCategoryBudget(categoryId, amount);
    }

    // Persist in background — only refresh on error to revert to server state
    updateCategoryBudgetAmount(categoryId, amount, percentage)
      .catch((error) => {
        console.error("Error saving budget amount:", error);
        // Revert optimistic updates by refreshing from server
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

      {/* Unified AI modal — fullscreen, no animation */}
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
              >
                {/* Header row: back button left, icon centered, spacer right */}
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

                  {/* Spacer to keep icon centered */}
                  <View className="w-10" />
                </View>

                {/* Title */}
                <Text className="text-center text-2xl font-extrabold text-textDark mb-1.5 leading-[30px]">
                  Let us allocate your budget{"\n"}using the proven{" "}
                  <Text className="text-accentBlue">50/30/20 rule</Text>
                </Text>
                <View className="h-6" />

                {/* Rule cards */}
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

              {/* I'll do it myself + Generate — pinned to bottom */}
              <View className="flex-row gap-3 px-2 pt-3 pb-6">
                <TouchableOpacity
                  onPress={handleCloseAIModal}
                  className="flex-1 bg-surfaceDark rounded-xl py-4 items-center justify-center border border-borderDark"
                  activeOpacity={0.7}
                >
                  <Text className="text-textDark font-semibold text-base">I'll do it myself</Text>
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
    </SafeAreaView>
  );
}
