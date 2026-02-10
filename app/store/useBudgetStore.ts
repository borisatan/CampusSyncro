import { create } from 'zustand';
import { CategoryBudgetStatus } from '../types/types';
import { useCategoriesStore } from './useCategoriesStore';
import { useIncomeStore } from './useIncomeStore';

interface BudgetState {
  categoryBudgets: CategoryBudgetStatus[];
  isLoading: boolean;

  // Actions
  setCategoryBudgets: (budgets: CategoryBudgetStatus[]) => void;
  upsertCategoryBudget: (categoryId: number, amount: number) => void;
  removeCategoryBudget: (categoryId: number) => void;
  setLoading: (loading: boolean) => void;

  // Selectors
  getBudgetByCategoryId: (categoryId: number) => CategoryBudgetStatus | null;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  categoryBudgets: [],
  isLoading: true,

  setCategoryBudgets: (budgets) => {
    set({ categoryBudgets: budgets });
    // Sync totalBudgeted to income store
    const total = budgets.reduce((sum, cb) => sum + cb.budget_amount, 0);
    useIncomeStore.getState().setTotalBudgeted(total);
  },

  upsertCategoryBudget: (categoryId, amount) => {
    const { categoryBudgets } = get();
    const existing = categoryBudgets.find((cb) => cb.category.id === categoryId);

    let updatedBudgets: CategoryBudgetStatus[];

    if (existing) {
      updatedBudgets = categoryBudgets.map((cb) =>
        cb.category.id === categoryId
          ? {
              ...cb,
              budget_amount: amount,
              percentage_used: amount > 0 ? (cb.spent / amount) * 100 : 0
            }
          : cb
      );
    } else {
      // New budget — find the category from the categories store
      const cat = useCategoriesStore.getState().categories.find((c) => c.id === categoryId);
      if (!cat) return;
      updatedBudgets = [...categoryBudgets, {
        category: cat,
        budget_amount: amount,
        spent: 0,
        percentage_used: 0
      }];
    }

    set({ categoryBudgets: updatedBudgets });

    // Sync totalBudgeted to income store
    const total = updatedBudgets.reduce((sum, cb) => sum + cb.budget_amount, 0);
    useIncomeStore.getState().setTotalBudgeted(total);
  },

  removeCategoryBudget: (categoryId) => {
    const updatedBudgets = get().categoryBudgets.filter((cb) => cb.category.id !== categoryId);
    set({ categoryBudgets: updatedBudgets });

    // Sync totalBudgeted to income store
    const total = updatedBudgets.reduce((sum, cb) => sum + cb.budget_amount, 0);
    useIncomeStore.getState().setTotalBudgeted(total);
  },

  setLoading: (loading) => set({ isLoading: loading }),

  getBudgetByCategoryId: (categoryId) => {
    return get().categoryBudgets.find((cb) => cb.category.id === categoryId) ?? null;
  },
}));

// Selector hook for subscribing to a specific category's budget
export const useCategoryBudget = (categoryId: number): CategoryBudgetStatus | null => {
  return useBudgetStore((state) =>
    state.categoryBudgets.find((cb) => cb.category.id === categoryId) ?? null
  );
};
