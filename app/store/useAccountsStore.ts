import { create } from 'zustand';
import { fetchAccounts } from '../services/backendService';
import { Account } from '../types/types';

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  loadAccounts: () => Promise<void>;
  setAccounts: (accounts: Account[]) => void;
  addAccountOptimistic: (account: Account) => void;
  updateAccountOptimistic: (id: number, updates: Partial<Account>) => void;
  deleteAccountOptimistic: (id: number) => void;
  updateAccountBalance: (accountName: string, newBalance: number) => void;
  updateAccountSavingsGoal: (accountId: number, goalAmount: number | null) => void;
  reorderAccounts: (reorderedAccounts: Account[]) => void;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  isLoading: false,

  loadAccounts: async () => {
    try {
      set({ isLoading: true });
      const data = await fetchAccounts();
      // Sort by sort_order if available, otherwise by id
      const sorted = [...data].sort((a, b) =>
        (a.sort_order ?? a.id) - (b.sort_order ?? b.id)
      );
      set({ accounts: sorted, isLoading: false });
    } catch (error) {
      console.error('Error loading accounts:', error);
      set({ isLoading: false });
    }
  },

  setAccounts: (accounts) => set({ accounts }),

  addAccountOptimistic: (account) => 
    set((state) => ({ accounts: [...state.accounts, account] })),

  updateAccountOptimistic: (id, updates) =>
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, ...updates } : acc
      ),
    })),

  deleteAccountOptimistic: (id) =>
    set((state) => ({
      accounts: state.accounts.filter((acc) => acc.id !== id),
    })),

  updateAccountBalance: (accountName, newBalance) =>
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.account_name === accountName ? { ...acc, balance: newBalance } : acc
      ),
    })),

  updateAccountSavingsGoal: (accountId, goalAmount) =>
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === accountId ? { ...acc, monthly_savings_goal: goalAmount } : acc
      ),
    })),

  reorderAccounts: (reorderedAccounts) =>
    set({ accounts: reorderedAccounts }),
}
));

