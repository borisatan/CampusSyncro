import { create } from 'zustand';
import {
  deleteRecurringTransaction,
  fetchRecurringTransactions,
} from '../services/backendService';
import { RecurringTransaction } from '../types/types';

interface RecurringTransactionsState {
  items: RecurringTransaction[];
  isLoading: boolean;

  loadRecurringTransactions: () => Promise<void>;
  addOptimistic: (item: RecurringTransaction) => void;
  removeOptimistic: (id: string) => void;
  removeItem: (id: string) => Promise<void>;
}

export const useRecurringTransactionsStore = create<RecurringTransactionsState>((set, get) => ({
  items: [],
  isLoading: false,

  loadRecurringTransactions: async () => {
    try {
      set({ isLoading: true });
      const data = await fetchRecurringTransactions();
      set({ items: data, isLoading: false });
    } catch (error) {
      console.error('[RecurringTransactions] Load error:', error);
      set({ isLoading: false });
    }
  },

  addOptimistic: (item) =>
    set((state) => ({ items: [item, ...state.items] })),

  removeOptimistic: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  removeItem: async (id) => {
    const previous = get().items;
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    try {
      await deleteRecurringTransaction(id);
    } catch (error) {
      console.error('[RecurringTransactions] Delete error:', error);
      set({ items: previous });
      throw error;
    }
  },
}));
