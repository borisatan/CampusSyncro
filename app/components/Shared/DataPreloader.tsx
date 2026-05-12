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
import { DEMO_ACCOUNTS, DEMO_BUDGET_STATUSES, DEMO_CATEGORIES, DEMO_GOALS, DEMO_INCOME } from '../../utils/demoData';

/**
 * DataPreloader - Loads accounts, categories, and budgets on mount.
 * Currency is loaded separately by CurrencyInitializer (after auth).
 * For guests, seeds stores with static demo data instead of Supabase calls.
 */
export default function DataPreloader() {
  const { userId, isGuest, isLoading: authLoading } = useAuth();
  const loadAccounts = useAccountsStore((state) => state.loadAccounts);
  const loadCategories = useCategoriesStore((state) => state.loadCategories);

  useEffect(() => {
    if (authLoading) return;

    if (isGuest) {
      seedGuestStores();
      return;
    }

    if (!userId) return;

    const preloadAllData = async () => {
      try {
        await Promise.all([
          loadAccounts(),
          loadCategories(),
          useGoalsStore.getState().loadGoals(),
        ]);

        await migrateDashboardCategoriesToDatabase();
        await preloadBudgetData();
      } catch (error) {
        console.error('Error preloading app data:', error);
      }
    };

    const preloadBudgetData = async () => {
      try {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const [, fetchedDynamicIncome, spendingByCategory] = await Promise.all([
          useIncomeStore.getState().loadIncomeSettings(),
          fetchIncomeForPeriod(startDate, endDate),
          fetchSpendingByCategory(startDate, endDate),
        ]);

        const categories = useCategoriesStore.getState().categories;
        const { useDynamicIncome, manualIncome } = useIncomeStore.getState();
        const effectiveIncome = useDynamicIncome ? fetchedDynamicIncome : manualIncome;

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

        useBudgetStore.getState().setCategoryBudgets(budgetResults);
        useBudgetStore.getState().setLoading(false);
      } catch (error) {
        console.error('Error preloading budget data:', error);
        useBudgetStore.getState().setLoading(false);
      }
    };

    preloadAllData();
  }, [userId, isGuest, authLoading, loadAccounts, loadCategories]);

  return null;
}

function seedGuestStores() {
  useCategoriesStore.getState().setCategories(DEMO_CATEGORIES);
  useAccountsStore.getState().setAccounts(DEMO_ACCOUNTS);
  useGoalsStore.getState().setGoals(DEMO_GOALS);
  useBudgetStore.getState().setCategoryBudgets(DEMO_BUDGET_STATUSES);
  useBudgetStore.getState().setLoading(false);
  useIncomeStore.setState({
    manualIncome: DEMO_INCOME.manualIncome,
    monthlySavingsTarget: DEMO_INCOME.monthlySavingsTarget,
    useDynamicIncome: false,
    isLoading: false,
  });
}
