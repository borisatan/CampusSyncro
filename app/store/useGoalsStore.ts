import { create } from 'zustand';
import { fetchGoalContributions, fetchGoals, fetchGoalsByAccount } from '../services/backendService';
import { Goal, GoalContribution } from '../types/types';

interface GoalsState {
  goals: Goal[];
  isLoading: boolean;
  contributions: Record<number, GoalContribution[]>;
  isLoadingContributions: boolean;
  loadGoals: () => Promise<void>;
  loadGoalsByAccount: (accountId: number) => Promise<Goal[]>;
  setGoals: (goals: Goal[]) => void;
  addGoalOptimistic: (goal: Goal) => void;
  updateGoalOptimistic: (id: number, updates: Partial<Goal>) => void;
  deleteGoalOptimistic: (id: number) => void;
  incrementGoalAmount: (id: number, amount: number) => void;
  loadContributions: (goalId: number) => Promise<void>;
  clearContributions: (goalId: number) => void;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [],
  isLoading: false,
  contributions: {},
  isLoadingContributions: false,

  loadGoals: async () => {
    try {
      set({ isLoading: true });
      const data = await fetchGoals();
      set({ goals: data, isLoading: false });
    } catch (error) {
      console.error('Error loading goals:', error);
      set({ isLoading: false });
    }
  },

  loadGoalsByAccount: async (accountId: number) => {
    try {
      const data = await fetchGoalsByAccount(accountId);
      return data;
    } catch (error) {
      console.error('Error loading goals by account:', error);
      return [];
    }
  },

  setGoals: (goals) => set({ goals }),

  addGoalOptimistic: (goal) =>
    set((state) => ({ goals: [...state.goals, goal] })),

  updateGoalOptimistic: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  deleteGoalOptimistic: (id) =>
    set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),

  incrementGoalAmount: (id, amount) =>
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === id ? { ...g, current_amount: g.current_amount + amount } : g
      ),
    })),

  loadContributions: async (goalId: number) => {
    set({ isLoadingContributions: true });
    try {
      const data = await fetchGoalContributions(goalId);
      set((state) => ({
        contributions: { ...state.contributions, [goalId]: data },
        isLoadingContributions: false,
      }));
    } catch (error) {
      console.error('Error loading contributions:', error);
      set({ isLoadingContributions: false });
    }
  },

  clearContributions: (goalId: number) =>
    set((state) => {
      const next = { ...state.contributions };
      delete next[goalId];
      return { contributions: next };
    }),
}));
