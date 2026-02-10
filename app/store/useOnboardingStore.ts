import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { OnboardingCategory } from '../constants/onboardingCategories';

interface OnboardingStoreState {
  // Progress tracking
  onboardingStep: number; // 0 = not started, 1-5 = current screen, 6 = completed
  hasCompletedOnboarding: boolean;
  isHydrated: boolean;

  // Data to persist for resume and final save
  pendingCategories: OnboardingCategory[];
  pendingBudgets: Record<string, number>; // categoryName -> amount
  pendingIncome: number;

  // Actions
  setOnboardingStep: (step: number) => void;
  setPendingCategories: (categories: OnboardingCategory[]) => void;
  setPendingBudgets: (budgets: Record<string, number>) => void;
  setPendingIncome: (income: number) => void;
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

      setOnboardingStep: (step) => set({ onboardingStep: step }),

      setPendingCategories: (categories) => set({ pendingCategories: categories }),

      setPendingBudgets: (budgets) => set({ pendingBudgets: budgets }),

      setPendingIncome: (income) => set({ pendingIncome: income }),

      completeOnboarding: () => {
        set({
          hasCompletedOnboarding: true,
          onboardingStep: 6
        });
      },

      resetOnboarding: () => {
        set({
          onboardingStep: 0,
          hasCompletedOnboarding: false,
          pendingCategories: [],
          pendingBudgets: {},
          pendingIncome: 0,
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
