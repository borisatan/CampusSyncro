import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { getIncomeSettings, updateIncomeSettings } from '../services/backendService';

interface IncomeState {
  // Synced to Supabase
  useDynamicIncome: boolean;
  manualIncome: number;
  monthlySavingsTarget: number;
  // Local UI preferences (AsyncStorage only)
  savingsSortOrder: number;
  showSavingsOnDashboard: boolean;
  // Computed/runtime state
  totalBudgeted: number;
  isLoading: boolean;
  // Actions
  loadIncomeSettings: () => Promise<void>;
  saveIncomeSettings: (useDynamic: boolean, manualIncome: number) => Promise<void>;
  setSavingsTarget: (amount: number) => Promise<void>;
  setSavingsSortOrder: (order: number) => Promise<void>;
  toggleShowSavingsOnDashboard: () => Promise<void>;
  setTotalBudgeted: (amount: number) => void;
}

const LOCAL_PREFS_KEY = '@perfin_income_local_prefs';

interface LocalPrefs {
  savingsSortOrder: number;
  showSavingsOnDashboard: boolean;
}

const loadLocalPrefs = async (): Promise<LocalPrefs> => {
  try {
    const stored = await AsyncStorage.getItem(LOCAL_PREFS_KEY);
    if (stored) {
      const prefs = JSON.parse(stored);
      return {
        savingsSortOrder: prefs.savingsSortOrder ?? 0,
        showSavingsOnDashboard: prefs.showSavingsOnDashboard ?? true,
      };
    }
  } catch (error) {
    console.error('Error loading local prefs:', error);
  }
  return { savingsSortOrder: 0, showSavingsOnDashboard: true };
};

const saveLocalPrefs = async (prefs: LocalPrefs): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Error saving local prefs:', error);
  }
};

export const useIncomeStore = create<IncomeState>((set, get) => ({
  useDynamicIncome: true,
  manualIncome: 0,
  monthlySavingsTarget: 0,
  savingsSortOrder: 0,
  showSavingsOnDashboard: true,
  totalBudgeted: 0,
  isLoading: true,

  loadIncomeSettings: async () => {
    try {
      set({ isLoading: true });

      // Load from Supabase and local storage in parallel
      const [supabaseSettings, localPrefs] = await Promise.all([
        getIncomeSettings(),
        loadLocalPrefs(),
      ]);

      set({
        useDynamicIncome: supabaseSettings?.use_dynamic_income ?? true,
        manualIncome: supabaseSettings?.manual_income ?? 0,
        monthlySavingsTarget: supabaseSettings?.monthly_savings_target ?? 0,
        savingsSortOrder: localPrefs.savingsSortOrder,
        showSavingsOnDashboard: localPrefs.showSavingsOnDashboard,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading income settings:', error);
      set({ isLoading: false });
    }
  },

  saveIncomeSettings: async (useDynamic, manualIncome) => {
    try {
      await updateIncomeSettings({
        use_dynamic_income: useDynamic,
        manual_income: manualIncome,
      });
      set({ useDynamicIncome: useDynamic, manualIncome });
    } catch (error) {
      console.error('Error saving income settings:', error);
    }
  },

  setSavingsTarget: async (amount: number) => {
    try {
      await updateIncomeSettings({
        monthly_savings_target: amount,
      });
      set({ monthlySavingsTarget: amount });
    } catch (error) {
      console.error('Error saving savings target:', error);
    }
  },

  setSavingsSortOrder: async (order: number) => {
    const { showSavingsOnDashboard } = get();
    await saveLocalPrefs({ savingsSortOrder: order, showSavingsOnDashboard });
    set({ savingsSortOrder: order });
  },

  toggleShowSavingsOnDashboard: async () => {
    const { savingsSortOrder, showSavingsOnDashboard } = get();
    const newValue = !showSavingsOnDashboard;
    await saveLocalPrefs({ savingsSortOrder, showSavingsOnDashboard: newValue });
    set({ showSavingsOnDashboard: newValue });
  },

  setTotalBudgeted: (amount: number) => {
    set({ totalBudgeted: amount });
  },
}));
