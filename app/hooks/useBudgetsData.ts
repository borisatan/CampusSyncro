import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchIncomeForPeriod, fetchSpendingByCategory } from '../services/backendService';
import { useBudgetStore } from '../store/useBudgetStore';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { useIncomeStore } from '../store/useIncomeStore';
import { CategoryBudgetStatus } from '../types/types';

interface BudgetsDataResult {
  categoryBudgets: CategoryBudgetStatus[];
  totalBudgeted: number;
  totalSpent: number;
  monthlyIncome: number;
  dynamicIncome: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  removeCategoryBudget: (categoryId: number) => void;
  upsertCategoryBudget: (categoryId: number, amount: number) => void;
}

export const getPeriodDates = (): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startDate, endDate };
};

export const useBudgetsData = (): BudgetsDataResult => {
  const { useDynamicIncome, manualIncome, loadIncomeSettings, isLoading: isIncomeLoading } = useIncomeStore();

  // Subscribe to state values (will trigger re-render when these change)
  const categoryBudgets = useBudgetStore((state) => state.categoryBudgets);
  const isBudgetLoading = useBudgetStore((state) => state.isLoading);

  // Combined loading state - show skeleton until both budget and income data are loaded
  const isLoading = isBudgetLoading || isIncomeLoading;

  // Get actions (stable references, won't trigger re-renders)
  const { setCategoryBudgets, upsertCategoryBudget, removeCategoryBudget, setLoading } = useBudgetStore.getState();

  const [dynamicIncome, setDynamicIncome] = useState(0);
  const hasMounted = useRef(false);

  const monthlyIncome = useDynamicIncome ? dynamicIncome : manualIncome;

  const fetchAndBuild = useCallback(async () => {
    const { startDate, endDate } = getPeriodDates();

    const [, fetchedDynamicIncome, spendingByCategory] =
      await Promise.all([
        loadIncomeSettings(),
        fetchIncomeForPeriod(startDate, endDate),
        fetchSpendingByCategory(startDate, endDate),
      ]);

    // Read categories from the Zustand store (already loaded by DataPreloader)
    const sorted = useCategoriesStore.getState().categories;
    setDynamicIncome(fetchedDynamicIncome);

    // Determine effective income for percentage-based budgets
    const effectiveIncome = useIncomeStore.getState().useDynamicIncome
      ? fetchedDynamicIncome
      : useIncomeStore.getState().manualIncome;

    const budgetedCategories = sorted.filter(
      (cat) => (cat.budget_amount != null && cat.budget_amount > 0) || (cat.budget_percentage != null && cat.budget_percentage > 0)
    );

    const results: CategoryBudgetStatus[] = budgetedCategories.map((cat) => {
      const spent = Math.abs(spendingByCategory[cat.category_name] ?? 0);
      // If a percentage is set, recalculate budget_amount from income
      const budget_amount = cat.budget_percentage != null && cat.budget_percentage > 0
        ? Math.round((cat.budget_percentage / 100) * effectiveIncome)
        : cat.budget_amount!;
      const percentage_used = budget_amount > 0 ? (spent / budget_amount) * 100 : 0;
      return { category: cat, budget_amount, spent, percentage_used };
    });

    setCategoryBudgets(results);
  }, [loadIncomeSettings]);

  // Initial load — shows loading state
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      fetchAndBuild()
        .catch((error) => console.error('Error loading budgets data:', error))
        .finally(() => setLoading(false));
    }
  }, [fetchAndBuild, setLoading]);

  // Background refresh — no loading flash, no list clearing
  const refresh = useCallback(async () => {
    try {
      await fetchAndBuild();
    } catch (error) {
      console.error('Error refreshing budgets data:', error);
    }
  }, [fetchAndBuild]);

  const totalBudgeted = categoryBudgets.reduce((sum, cb) => sum + cb.budget_amount, 0);
  const totalSpent = categoryBudgets.reduce((sum, cb) => sum + cb.spent, 0);

  return {
    categoryBudgets,
    totalBudgeted,
    totalSpent,
    monthlyIncome,
    dynamicIncome,
    isLoading,
    refresh,
    removeCategoryBudget,
    upsertCategoryBudget,
  };
};
