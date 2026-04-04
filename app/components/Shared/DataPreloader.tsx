import { useEffect } from 'react';
import { fetchIncomeForPeriod, fetchSpendingByCategory } from '../../services/backendService';
import { useAuth } from '../../context/AuthContext';
import { useAccountsStore } from '../../store/useAccountsStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useCategoriesStore } from '../../store/useCategoriesStore';
import { useIncomeStore } from '../../store/useIncomeStore';
import { migrateDashboardCategoriesToDatabase } from '../../store/useDashboardCategoriesStore';
import { useGoalsStore } from '../../store/useGoalsStore';
import { CategoryBudgetStatus } from '../../types/types';

/**
 * DataPreloader - Loads accounts, categories, and budgets on mount.
 * Currency is loaded separately by CurrencyInitializer (after auth).
 * Only runs after user authentication is complete.
 */
export default function DataPreloader() {
  const { userId, isLoading: authLoading } = useAuth();
  const loadAccounts = useAccountsStore((state) => state.loadAccounts);
  const loadCategories = useCategoriesStore((state) => state.loadCategories);

  useEffect(() => {
    // Only run when authenticated
    if (authLoading || !userId) return;

    const preloadAllData = async () => {
      try {
        await Promise.all([
          loadAccounts(),
          loadCategories(),
          useGoalsStore.getState().loadGoals(),
        ]);

        // Migrate old AsyncStorage dashboard categories to database
        // This runs after categories are loaded so we have the data available
        await migrateDashboardCategoriesToDatabase();

        // Preload budget data after categories are loaded
        await preloadBudgetData();
      } catch (error) {
        console.error('Error preloading app data:', error);
      }
    };

    const preloadBudgetData = async () => {
      try {
        // Get current month date range
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // Load income settings and fetch current month data
        const [, fetchedDynamicIncome, spendingByCategory] = await Promise.all([
          useIncomeStore.getState().loadIncomeSettings(),
          fetchIncomeForPeriod(startDate, endDate),
          fetchSpendingByCategory(startDate, endDate),
        ]);

        // Get categories and income settings
        const categories = useCategoriesStore.getState().categories;
        const { useDynamicIncome, manualIncome } = useIncomeStore.getState();
        const effectiveIncome = useDynamicIncome ? fetchedDynamicIncome : manualIncome;

        // Build budget data
        const budgetedCategories = categories.filter(
          (cat) => (cat.budget_amount != null && cat.budget_amount > 0) || (cat.budget_percentage != null && cat.budget_percentage > 0)
        );

        const budgetResults: CategoryBudgetStatus[] = budgetedCategories.map((cat) => {
          const spent = Math.abs(spendingByCategory[cat.category_name] ?? 0);
          const budget_amount = cat.budget_percentage != null && cat.budget_percentage > 0
            ? Math.round((cat.budget_percentage / 100) * effectiveIncome)
            : cat.budget_amount!;
          const percentage_used = budget_amount > 0 ? (spent / budget_amount) * 100 : 0;
          return { category: cat, budget_amount, spent, percentage_used };
        });

        // Set budget data in store
        useBudgetStore.getState().setCategoryBudgets(budgetResults);
        useBudgetStore.getState().setLoading(false);
      } catch (error) {
        console.error('Error preloading budget data:', error);
        useBudgetStore.getState().setLoading(false);
      }
    };

    preloadAllData();
  }, [userId, authLoading, loadAccounts, loadCategories]);

  return null;
}

