import { useCallback, useEffect, useState } from 'react';
import { fetchBudgetSpending, fetchIncomeForPeriod } from '../services/backendService';
import { useBudgetsStore } from '../store/useBudgetsStore';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { useIncomeStore } from '../store/useIncomeStore';
import { Budget, BudgetWithSpent } from '../types/types';

interface BudgetsDataResult {
  budgetsWithSpent: BudgetWithSpent[];
  monthlyIncome: number;
  dynamicIncome: number;
  allocatedPercentage: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

// Get the current period's date range for a budget
export const getBudgetPeriodDates = (budget: Budget): { startDate: Date; endDate: Date } => {
  const now = new Date();

  if (budget.period_type === 'weekly') {
    // Week starts on Monday
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - diff);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    return { startDate, endDate };
  }

  if (budget.period_type === 'monthly') {
    // Month starts on the 1st
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { startDate, endDate };
  }

  // Custom period
  if (budget.custom_start_date && budget.custom_end_date) {
    const originalStart = new Date(budget.custom_start_date);
    const originalEnd = new Date(budget.custom_end_date);
    const periodDays = Math.floor(
      (originalEnd.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (periodDays <= 0) {
      return { startDate: originalStart, endDate: originalEnd };
    }

    const daysSinceStart = Math.floor(
      (now.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentCycle = Math.floor(daysSinceStart / periodDays);

    const cycleStart = new Date(originalStart);
    cycleStart.setDate(originalStart.getDate() + currentCycle * periodDays);

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleStart.getDate() + periodDays);

    return { startDate: cycleStart, endDate: cycleEnd };
  }

  // Fallback to current month
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startDate, endDate };
};

export const useBudgetsData = (): BudgetsDataResult => {
  const { budgets, isLoading: budgetsLoading, loadBudgets } = useBudgetsStore();
  const { categories, loadCategories } = useCategoriesStore();
  const { useDynamicIncome, manualIncome, loadIncomeSettings } = useIncomeStore();
  const [budgetsWithSpent, setBudgetsWithSpent] = useState<BudgetWithSpent[]>([]);
  const [dynamicIncome, setDynamicIncome] = useState(0);
  const [allocatedPercentage, setAllocatedPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate display income based on settings
  const monthlyIncome = useDynamicIncome ? dynamicIncome : manualIncome;

  const calculateBudgetsWithSpent = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch dynamic income for the income card
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const fetchedDynamicIncome = await fetchIncomeForPeriod(monthStart, monthEnd);
      setDynamicIncome(fetchedDynamicIncome);

      // Get the effective income to use for percentage budgets
      const effectiveIncome = useDynamicIncome ? fetchedDynamicIncome : manualIncome;

      if (budgets.length === 0) {
        setBudgetsWithSpent([]);
        setAllocatedPercentage(0);
        setIsLoading(false);
        return;
      }

      // Calculate allocated percentage (sum of percentage-type budget amounts)
      const totalAllocated = budgets
        .filter((b) => b.amount_type === 'percentage')
        .reduce((sum, b) => sum + b.amount, 0);
      setAllocatedPercentage(totalAllocated);

      const results = await Promise.all(
        budgets.map(async (budget) => {
          const { startDate, endDate } = getBudgetPeriodDates(budget);

          // Get categories assigned to this budget
          const budgetCategories = categories.filter(
            (cat) => cat.budget_id === budget.id
          );
          const categoryNames = budgetCategories.map((cat) => cat.category_name);

          // Fetch spending for this budget's categories
          const spent = await fetchBudgetSpending(categoryNames, startDate, endDate);

          // Calculate limit (handle percentage budgets)
          let limit = budget.amount;
          if (budget.amount_type === 'percentage') {
            // Use the global income setting
            limit = (budget.amount / 100) * effectiveIncome;
          }

          const percentage_used = limit > 0 ? (spent / limit) * 100 : 0;

          return {
            ...budget,
            spent,
            limit,
            percentage_used,
            categories: budgetCategories,
          } as BudgetWithSpent;
        })
      );

      setBudgetsWithSpent(results);
    } catch (error) {
      console.error('Error calculating budgets with spent:', error);
    } finally {
      setIsLoading(false);
    }
  }, [budgets, categories, useDynamicIncome, manualIncome]);

  const refresh = useCallback(async () => {
    await Promise.all([loadBudgets(), loadCategories(), loadIncomeSettings()]);
  }, [loadBudgets, loadCategories, loadIncomeSettings]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([loadBudgets(), loadCategories(), loadIncomeSettings()]);
    };
    loadInitialData();
  }, []);

  // Recalculate when budgets, categories, or income settings change
  useEffect(() => {
    if (!budgetsLoading && budgets.length >= 0) {
      calculateBudgetsWithSpent();
    }
  }, [budgets, categories, budgetsLoading, useDynamicIncome, manualIncome, calculateBudgetsWithSpent]);

  return {
    budgetsWithSpent,
    monthlyIncome,
    dynamicIncome,
    allocatedPercentage,
    isLoading: isLoading || budgetsLoading,
    refresh,
  };
};
