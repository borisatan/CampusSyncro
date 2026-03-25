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

interface CategoryBudget {
  category_name: string;
  budget_amount?: number;
  budget_percentage?: number;
}

interface NewOnboardingData {
  // Category selection (NEW)
  selectedCategories?: string[];          // Screen 2 (NEW)
  selectedAutopilotCategories: string[];  // Screen 2 (DEPRECATED - keeping for backward compatibility)

  // Budget setup (NEW)
  budgetSetupChoice?: 'smart' | 'manual' | 'skip' | null;  // Screen 4
  categoryBudgets?: CategoryBudget[];     // Screen 5 or 6
  monthlySavingsTarget?: number;          // Derived from budget setup (20% for smart, remaining for manual)

  // Currency selection (Screen 3)
  selectedCurrency?: string;

  // Existing fields
  estimatedIncome: number;                 // Screen 3 (moved earlier in new flow)
  practiceEntryCompleted: boolean;        // Screen 9 (was 6)
  selectedBillingPeriod: 'monthly' | 'annual' | null; // Screen 10 (was 7)
  notificationFrequency: 'once' | 'three' | 'five' | null; // Screen 11
}

interface OnboardingStoreState {
  // Progress tracking
  onboardingStep: number; // 0 = not started, 1-7 = current screen, 8 = completed
  hasCompletedOnboarding: boolean;
  isHydrated: boolean;

  // V3 Data (keep for backward compatibility)
  pendingMonthlyTarget: number;
  pendingCategoryNames: string[]; // Just category names for v3
  pendingAccountName: string;
  pendingTransactions: PendingTransaction[];

  // Data to persist for resume and final save (keep for backward compatibility)
  pendingCategories: OnboardingCategory[];
  pendingBudgets: Record<string, number>; // categoryName -> amount
  pendingIncome: number;

  // New onboarding flow data
  newOnboardingData: NewOnboardingData;

  // Whether onboarding data has been persisted to Supabase
  hasPersistedOnboardingData: boolean;

  // Whether this is a developer test run (skip Supabase persistence)
  isTestMode: boolean;

  // Actions
  setOnboardingStep: (step: number) => void;
  setPendingCategories: (categories: OnboardingCategory[]) => void;
  setPendingBudgets: (budgets: Record<string, number>) => void;
  setPendingIncome: (income: number) => void;
  setPendingMonthlyTarget: (target: number) => void;
  setPendingCategoryNames: (categories: string[]) => void;
  setPendingAccountName: (name: string) => void;
  setPendingTransactions: (transactions: PendingTransaction[]) => void;
  setNewOnboardingData: (data: Partial<NewOnboardingData>) => void;
  setOnboardingDataPersisted: () => void;
  clearOnboardingDataPersisted: () => void;
  setTestMode: (value: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStoreState>()(
  persist(
    (set, get) => ({
      onboardingStep: 0,
      hasCompletedOnboarding: false,
      hasPersistedOnboardingData: false,
      isTestMode: false,
      isHydrated: false,
      pendingCategories: [],
      pendingBudgets: {},
      pendingIncome: 0,

      // V3 Data defaults
      pendingMonthlyTarget: 0,
      pendingCategoryNames: [],
      pendingAccountName: '',
      pendingTransactions: [],

      // New onboarding flow defaults
      newOnboardingData: {
        selectedCategories: [],
        selectedAutopilotCategories: [],
        budgetSetupChoice: null,
        categoryBudgets: [],
        monthlySavingsTarget: 0,
        estimatedIncome: 0,
        practiceEntryCompleted: false,
        selectedBillingPeriod: null,
        notificationFrequency: null,
      },

      setOnboardingStep: (step) => set({ onboardingStep: step }),

      setPendingCategories: (categories) => set({ pendingCategories: categories }),

      setPendingBudgets: (budgets) => set({ pendingBudgets: budgets }),

      setPendingIncome: (income) => set({ pendingIncome: income }),

      setPendingMonthlyTarget: (target) => set({ pendingMonthlyTarget: target }),

      setPendingCategoryNames: (categories) => set({ pendingCategoryNames: categories }),

      setPendingAccountName: (name) => set({ pendingAccountName: name }),

      setPendingTransactions: (transactions) => set({ pendingTransactions: transactions }),

      setNewOnboardingData: (data) => set((state) => {
        const updated = { ...state.newOnboardingData, ...data };

        // Auto-sync: If selectedCategories is set, also set deprecated field for backward compatibility
        if (data.selectedCategories) {
          updated.selectedAutopilotCategories = data.selectedCategories;
        }

        return { newOnboardingData: updated };
      }),

      setOnboardingDataPersisted: () => set({ hasPersistedOnboardingData: true }),

      clearOnboardingDataPersisted: () => set({ hasPersistedOnboardingData: false }),

      setTestMode: (value) => set({ isTestMode: value }),

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
          hasPersistedOnboardingData: false,
          isTestMode: false,
          pendingCategories: [],
          pendingBudgets: {},
          pendingIncome: 0,
          pendingMonthlyTarget: 0,
          pendingCategoryNames: [],
          pendingAccountName: '',
          pendingTransactions: [],
          newOnboardingData: {
            selectedCategories: [],
            selectedAutopilotCategories: [],
            budgetSetupChoice: null,
            categoryBudgets: [],
            monthlySavingsTarget: 0,
            estimatedIncome: 0,
            practiceEntryCompleted: false,
            selectedBillingPeriod: null,
            notificationFrequency: null,
          },
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
