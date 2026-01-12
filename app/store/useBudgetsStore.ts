import { create } from 'zustand';
import { fetchBudgets } from '../services/backendService';
import { Budget } from '../types/types';

interface BudgetsState {
  budgets: Budget[];
  isLoading: boolean;
  loadBudgets: () => Promise<void>;
  setBudgets: (budgets: Budget[]) => void;
  addBudgetOptimistic: (budget: Budget) => void;
  updateBudgetOptimistic: (id: number, updates: Partial<Budget>) => void;
  deleteBudgetOptimistic: (id: number) => void;
}

export const useBudgetsStore = create<BudgetsState>((set) => ({
  budgets: [],
  isLoading: false,

  loadBudgets: async () => {
    try {
      set({ isLoading: true });
      const data = await fetchBudgets();
      set({ budgets: data, isLoading: false });
    } catch (error) {
      console.error('Error loading budgets:', error);
      set({ isLoading: false });
    }
  },

  setBudgets: (budgets) => set({ budgets }),

  addBudgetOptimistic: (budget) =>
    set((state) => ({ budgets: [...state.budgets, budget] })),

  updateBudgetOptimistic: (id, updates) =>
    set((state) => ({
      budgets: state.budgets.map((budget) =>
        budget.id === id ? { ...budget, ...updates } : budget
      ),
    })),

  deleteBudgetOptimistic: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((budget) => budget.id !== id),
    })),
}));
