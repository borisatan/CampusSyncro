import { useFont } from "@shopify/react-native-skia";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom Components
import { BudgetHealthCard } from "../components/HomePage/BudgetHealthCard";
import { CategoryBreakdownList } from "../components/HomePage/CategoryBreakdown";
import { CategoryDonut } from "../components/HomePage/CategoryDonut";
import { DashboardSkeleton } from "../components/HomePage/DashboardSkeleton";
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
    offset,
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
  const { showSavingsOnDashboard } = useIncomeStore();
  const {
    target: savingsTarget,
    saved: savingsSaved,
    percentage: savingsPercentage,
    refresh: refreshSavings,
  } = useSavingsProgress();

  const filteredCategoryBudgets = useMemo(() => {
    return categoryBudgets.filter((cb) =>
      cb.category.show_on_dashboard ?? true
    );
  }, [categoryBudgets]);

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
    registerDashboardRefresh(refreshAll);
  }, [refreshAll, registerDashboardRefresh]);

  // Budget data refreshes automatically via:
  // 1. refreshDashboard() after adding/editing transactions
  // 2. Optimistic updates when editing budgets
  // 3. Pull-to-refresh if needed

  const interFont = useFont(
    require("../../assets/fonts/InterVariable.ttf"),
    12,
  );

  const onCategoryPress = (category_name: string) => {
    router.navigate({
      pathname: "/(tabs)/transaction-list",
      params: {
        initialCategory: category_name,
        initialTimeFrame: timeFrame,
        initialOffset: offset.toString(),
        t: Date.now().toString(),
      },
    });
  };

  const isLoading = dataLoading || isCurrencyLoading || budgetsLoading;

  return (
    <SafeAreaView
      className={`flex-1 mb-8 ${isDarkMode ? "bg-backgroundDark" : "bg-background"}`}
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View className="px-2 pt-4">
          {isLoading ? (
            <DashboardSkeleton isDarkMode={isDarkMode} />
          ) : (
            <>
              <View>
                <DashboardSummary
                  totalBalance={totalBalance}
                  totalIncome={totalIncome}
                  totalExpenses={totalExpenses}
                  currencySymbol={currencySymbol}
                  isUnlocked={isUnlocked}
                />
              </View>

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
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
