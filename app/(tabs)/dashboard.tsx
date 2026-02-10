import { useFont } from "@shopify/react-native-skia";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom Components
import { BudgetHealthCard } from "../components/HomePage/BudgetHealthCard";
import { CategoryBreakdownList } from "../components/HomePage/CategoryBreakdown";
import { CategoryDonut } from "../components/HomePage/CategoryDonut";
import { DashboardSummary } from "../components/HomePage/DashboardSummary";
import { ScrollableSpendingChart } from "../components/HomePage/ScrollableSpendingChart";
import { TimeFrameSelector } from "../components/HomePage/TimeFrameSelector";

// Hooks & Utilities
import { useDataRefresh } from "../context/DataRefreshContext";
import { useLock } from "../context/LockContext";
import { useTheme } from "../context/ThemeContext";
import { useBudgetsData } from "../hooks/useBudgetsData";
import { useDashboardData } from "../hooks/useDashboardData";
import { useSavingsProgress } from "../hooks/useSavingsProgress";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useDashboardCategoriesStore } from "../store/useDashboardCategoriesStore";
import { useIncomeStore } from "../store/useIncomeStore";

export default function Dashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { isUnlocked } = useLock();

  const {
    currencySymbol,
    isLoading: isCurrencyLoading,
    loadCurrency,
  } = useCurrencyStore();

  const {
    timeFrame,
    setTimeFrame,
    setOffset,
    loading: dataLoading,
    refresh: refreshData,
    totalBalance,
    totalIncome,
    totalExpenses,
    categories,
    categoriesAggregated,
    chartDataByOffset,
  } = useDashboardData("month");

  const {
    categoryBudgets,
    isLoading: budgetsLoading,
    refresh: refreshBudgets,
  } = useBudgetsData();
  const { pinnedCategoryIds, loadPinnedCategories } =
    useDashboardCategoriesStore();
  const { showSavingsOnDashboard } = useIncomeStore();
  const {
    target: savingsTarget,
    saved: savingsSaved,
    percentage: savingsPercentage,
    refresh: refreshSavings,
  } = useSavingsProgress();

  const filteredCategoryBudgets = useMemo(() => {
    if (pinnedCategoryIds.length === 0) return categoryBudgets;
    return categoryBudgets.filter((cb) =>
      pinnedCategoryIds.includes(cb.category.id),
    );
  }, [categoryBudgets, pinnedCategoryIds]);

  const savingsData = useMemo(() => {
    if (!showSavingsOnDashboard || savingsTarget <= 0) return null;
    return {
      target: savingsTarget,
      saved: savingsSaved,
      percentage: savingsPercentage,
    };
  }, [showSavingsOnDashboard, savingsTarget, savingsSaved, savingsPercentage]);

  const { registerDashboardRefresh } = useDataRefresh();

  const refreshAll = useCallback(async () => {
    await loadCurrency();
    refreshData();
    refreshBudgets();
    refreshSavings();
  }, [loadCurrency, refreshData, refreshBudgets, refreshSavings]);

  useEffect(() => {
    loadPinnedCategories();
  }, []);

  useEffect(() => {
    registerDashboardRefresh(refreshAll);
  }, [refreshAll, registerDashboardRefresh]);

  // Refresh budget data when the dashboard tab gains focus (e.g. after editing budgets)
  const hasMountedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasMountedRef.current) {
        refreshBudgets();
        refreshSavings();
      } else {
        hasMountedRef.current = true;
      }
    }, [refreshBudgets, refreshSavings]),
  );

  const interFont = useFont(
    require("../../assets/fonts/InterVariable.ttf"),
    12,
  );

  const onCategoryPress = (category_name: string) => {
    router.push({
      pathname: "/transaction-list",
      params: { initialCategory: category_name, t: Date.now().toString() },
    });
  };

  const isLoading = dataLoading || isCurrencyLoading;

  return (
    <SafeAreaView
      className={`flex-1 mb-8 ${isDarkMode ? "bg-backgroundDark" : "bg-background"}`}
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View className="px-2">
          <DashboardSummary
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            currencySymbol={currencySymbol}
            isUnlocked={isUnlocked}
          />

          <TimeFrameSelector selected={timeFrame} onChange={setTimeFrame} />

          <ScrollableSpendingChart
            chartDataByOffset={chartDataByOffset}
            timeFrame={timeFrame}
            font={interFont}
            currencySymbol={currencySymbol}
            categoryBudgets={categoryBudgets}
            isUnlocked={isUnlocked}
            onOffsetChange={setOffset}
          />

          <BudgetHealthCard
            categoryBudgets={filteredCategoryBudgets}
            allCategoryBudgets={categoryBudgets}
            currencySymbol={currencySymbol}
            isLoading={budgetsLoading}
            isUnlocked={isUnlocked}
            savingsData={savingsData}
          />
          <CategoryDonut
            aggregates={categoriesAggregated}
            categories={categories}
            timeFrame={timeFrame}
            isUnlocked={isUnlocked}
          />

          <CategoryBreakdownList
            currency={currencySymbol}
            categories={categories}
            categoriesAggregated={categoriesAggregated}
            onCategoryPress={onCategoryPress}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
