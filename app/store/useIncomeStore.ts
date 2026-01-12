import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface IncomeState {
  useDynamicIncome: boolean;
  manualIncome: number;
  isLoading: boolean;
  loadIncomeSettings: () => Promise<void>;
  saveIncomeSettings: (useDynamic: boolean, manualIncome: number) => Promise<void>;
}

const INCOME_SETTINGS_KEY = '@perfin_income_settings';

export const useIncomeStore = create<IncomeState>((set) => ({
  useDynamicIncome: true,
  manualIncome: 0,
  isLoading: true,

  loadIncomeSettings: async () => {
    try {
      set({ isLoading: true });
      const stored = await AsyncStorage.getItem(INCOME_SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        set({
          useDynamicIncome: settings.useDynamicIncome ?? true,
          manualIncome: settings.manualIncome ?? 0,
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
      const settings = { useDynamicIncome: useDynamic, manualIncome };
      await AsyncStorage.setItem(INCOME_SETTINGS_KEY, JSON.stringify(settings));
      set({ useDynamicIncome: useDynamic, manualIncome });
    } catch (error) {
      console.error('Error saving income settings:', error);
    }
  },
}));
