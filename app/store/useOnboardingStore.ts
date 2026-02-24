import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { OnboardingCategory } from '../constants/onboardingCategories';

interface PendingTransaction {
  icon: string;
  label: string;
  amount: number;
  category: string;
}

interface OnboardingStoreState {
  // Progress tracking
  onboardingStep: number; // 0 = not started, 1-7 = current screen, 8 = completed
  hasCompletedOnboarding: boolean;
  isHydrated: boolean;

  // V3 Data (NEW)
  pendingMonthlyTarget: number;
  pendingCategoryNames: string[]; // Just category names for v3
  pendingAccountName: string;
  pendingTransactions: PendingTransaction[];

  // Data to persist for resume and final save (keep for backward compatibility)
  pendingCategories: OnboardingCategory[];
  pendingBudgets: Record<string, number>; // categoryName -> amount
  pendingIncome: number;

  // Actions
  setOnboardingStep: (step: number) => void;
  setPendingCategories: (categories: OnboardingCategory[]) => void;
  setPendingBudgets: (budgets: Record<string, number>) => void;
  setPendingIncome: (income: number) => void;
  setPendingMonthlyTarget: (target: number) => void;
  setPendingCategoryNames: (categories: string[]) => void;
  setPendingAccountName: (name: string) => void;
  setPendingTransactions: (transactions: PendingTransaction[]) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStoreState>()(
  persist(
    (set, get) => ({
      onboardingStep: 0,
      hasCompletedOnboarding: false,
      isHydrated: false,
      pendingCategories: [],
      pendingBudgets: {},
      pendingIncome: 0,

      // V3 Data defaults
      pendingMonthlyTarget: 0,
      pendingCategoryNames: [],
      pendingAccountName: '',
      pendingTransactions: [],

      setOnboardingStep: (step) => set({ onboardingStep: step }),

      setPendingCategories: (categories) => set({ pendingCategories: categories }),

      setPendingBudgets: (budgets) => set({ pendingBudgets: budgets }),

      setPendingIncome: (income) => set({ pendingIncome: income }),

      setPendingMonthlyTarget: (target) => set({ pendingMonthlyTarget: target }),

      setPendingCategoryNames: (categories) => set({ pendingCategoryNames: categories }),

      setPendingAccountName: (name) => set({ pendingAccountName: name }),

      setPendingTransactions: (transactions) => set({ pendingTransactions: transactions }),

      completeOnboarding: () => {
        set({
          hasCompletedOnboarding: true,
          onboardingStep: 8
        });
      },

      resetOnboarding: () => {
        set({
          onboardingStep: 0,
          hasCompletedOnboarding: false,
          pendingCategories: [],
          pendingBudgets: {},
          pendingIncome: 0,
          pendingMonthlyTarget: 0,
          pendingCategoryNames: [],
          pendingAccountName: '',
          pendingTransactions: [],
        });
      },

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: '@perfin_onboarding_state',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
