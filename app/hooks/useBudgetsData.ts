import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCategories, fetchIncomeForPeriod, fetchSpendingByCategory } from '../services/backendService';
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
  const { setCategories } = useCategoriesStore();
  const { useDynamicIncome, manualIncome, loadIncomeSettings } = useIncomeStore();
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudgetStatus[]>([]);
  const [dynamicIncome, setDynamicIncome] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const hasMounted = useRef(false);

  const monthlyIncome = useDynamicIncome ? dynamicIncome : manualIncome;

  const fetchAndBuild = useCallback(async () => {
    const { startDate, endDate } = getPeriodDates();

    const [categoriesData, , fetchedDynamicIncome, spendingByCategory] =
      await Promise.all([
        fetchCategories(),
        loadIncomeSettings(),
        fetchIncomeForPeriod(startDate, endDate),
        fetchSpendingByCategory(startDate, endDate),
      ]);

    const sorted = [...categoriesData].sort(
      (a, b) => (a.sort_order ?? a.id) - (b.sort_order ?? b.id)
    );
    setCategories(sorted);
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
  }, [setCategories, loadIncomeSettings]);

  // Initial load — shows loading state
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      fetchAndBuild()
        .catch((error) => console.error('Error loading budgets data:', error))
        .finally(() => setIsLoading(false));
    }
  }, [fetchAndBuild]);

  // Background refresh — no loading flash, no list clearing
  const refresh = useCallback(async () => {
    try {
      await fetchAndBuild();
    } catch (error) {
      console.error('Error refreshing budgets data:', error);
    }
  }, [fetchAndBuild]);

  // Optimistic removal of a single category budget
  const removeCategoryBudget = useCallback((categoryId: number) => {
    setCategoryBudgets((prev) => prev.filter((cb) => cb.category.id !== categoryId));
  }, []);

  // Optimistic add/update of a category budget
  const upsertCategoryBudget = useCallback((categoryId: number, amount: number) => {
    setCategoryBudgets((prev) => {
      const existing = prev.find((cb) => cb.category.id === categoryId);
      if (existing) {
        return prev.map((cb) =>
          cb.category.id === categoryId
            ? { ...cb, budget_amount: amount, percentage_used: amount > 0 ? (cb.spent / amount) * 100 : 0 }
            : cb
        );
      }
      // New budget — find the category from the categories store
      const cat = useCategoriesStore.getState().categories.find((c) => c.id === categoryId);
      if (!cat) return prev;
      return [...prev, { category: cat, budget_amount: amount, spent: 0, percentage_used: 0 }];
    });
  }, []);

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
