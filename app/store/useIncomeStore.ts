import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface IncomeState {
  useDynamicIncome: boolean;
  manualIncome: number;
  isLoading: boolean;
  monthlySavingsTarget: number;
  savingsTargetMonth: string;
  savingsSortOrder: number;
  showSavingsOnDashboard: boolean;
  totalBudgeted: number;
  loadIncomeSettings: () => Promise<void>;
  saveIncomeSettings: (useDynamic: boolean, manualIncome: number) => Promise<void>;
  setSavingsTarget: (amount: number) => Promise<void>;
  setSavingsSortOrder: (order: number) => Promise<void>;
  toggleShowSavingsOnDashboard: () => Promise<void>;
  setTotalBudgeted: (amount: number) => void;
}

const INCOME_SETTINGS_KEY = '@perfin_income_settings';

export const useIncomeStore = create<IncomeState>((set, get) => ({
  useDynamicIncome: true,
  manualIncome: 0,
  isLoading: true,
  monthlySavingsTarget: 0,
  savingsTargetMonth: '',
  savingsSortOrder: 0,
  showSavingsOnDashboard: true,
  totalBudgeted: 0,

  loadIncomeSettings: async () => {
    try {
      set({ isLoading: true });
      const stored = await AsyncStorage.getItem(INCOME_SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        set({
          useDynamicIncome: settings.useDynamicIncome ?? true,
          manualIncome: settings.manualIncome ?? 0,
          monthlySavingsTarget: settings.monthlySavingsTarget ?? 0,
          savingsTargetMonth: settings.savingsTargetMonth ?? '',
          savingsSortOrder: settings.savingsSortOrder ?? 0,
          showSavingsOnDashboard: settings.showSavingsOnDashboard ?? true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading income settings:', error);
      set({ isLoading: false });
    }
  },

  saveIncomeSettings: async (useDynamic, manualIncome) => {
    try {
      const { monthlySavingsTarget, savingsTargetMonth, savingsSortOrder, showSavingsOnDashboard } = get();
      const settings = {
        useDynamicIncome: useDynamic,
        manualIncome,
        monthlySavingsTarget,
        savingsTargetMonth,
        savingsSortOrder,
        showSavingsOnDashboard,
      };
      await AsyncStorage.setItem(INCOME_SETTINGS_KEY, JSON.stringify(settings));
      set({ useDynamicIncome: useDynamic, manualIncome });
    } catch (error) {
      console.error('Error saving income settings:', error);
    }
  },

  setSavingsTarget: async (amount: number) => {
    try {
      const { useDynamicIncome, manualIncome, savingsSortOrder, showSavingsOnDashboard } = get();
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const settings = {
        useDynamicIncome,
        manualIncome,
        monthlySavingsTarget: amount,
        savingsTargetMonth: month,
        savingsSortOrder,
        showSavingsOnDashboard,
      };
      await AsyncStorage.setItem(INCOME_SETTINGS_KEY, JSON.stringify(settings));
      set({ monthlySavingsTarget: amount, savingsTargetMonth: month });
    } catch (error) {
      console.error('Error saving savings target:', error);
    }
  },

  setSavingsSortOrder: async (order: number) => {
    try {
      const { useDynamicIncome, manualIncome, monthlySavingsTarget, savingsTargetMonth, showSavingsOnDashboard } = get();
      const settings = {
        useDynamicIncome,
        manualIncome,
        monthlySavingsTarget,
        savingsTargetMonth,
        savingsSortOrder: order,
        showSavingsOnDashboard,
      };
      await AsyncStorage.setItem(INCOME_SETTINGS_KEY, JSON.stringify(settings));
      set({ savingsSortOrder: order });
    } catch (error) {
      console.error('Error saving savings sort order:', error);
    }
  },

  toggleShowSavingsOnDashboard: async () => {
    try {
      const { useDynamicIncome, manualIncome, monthlySavingsTarget, savingsTargetMonth, savingsSortOrder, showSavingsOnDashboard } = get();
      const newValue = !showSavingsOnDashboard;
      const settings = {
        useDynamicIncome,
        manualIncome,
        monthlySavingsTarget,
        savingsTargetMonth,
        savingsSortOrder,
        showSavingsOnDashboard: newValue,
      };
      await AsyncStorage.setItem(INCOME_SETTINGS_KEY, JSON.stringify(settings));
      set({ showSavingsOnDashboard: newValue });
    } catch (error) {
      console.error('Error toggling show savings on dashboard:', error);
    }
  },

  setTotalBudgeted: (amount: number) => {
    set({ totalBudgeted: amount });
  },
}));
