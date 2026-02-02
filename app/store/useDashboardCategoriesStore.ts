import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface DashboardCategoriesState {
  pinnedCategoryIds: number[];
  isLoading: boolean;
  loadPinnedCategories: () => Promise<void>;
  togglePinnedCategory: (categoryId: number) => Promise<void>;
}

const DASHBOARD_CATEGORIES_KEY = '@perfin_dashboard_categories';

export const useDashboardCategoriesStore = create<DashboardCategoriesState>((set, get) => ({
  pinnedCategoryIds: [],
  isLoading: true,

  loadPinnedCategories: async () => {
    try {
      set({ isLoading: true });
      const stored = await AsyncStorage.getItem(DASHBOARD_CATEGORIES_KEY);
      if (stored) {
        const ids = JSON.parse(stored);
        set({ pinnedCategoryIds: ids, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading dashboard categories:', error);
      set({ isLoading: false });
    }
  },

  togglePinnedCategory: async (categoryId: number) => {
    try {
      const { pinnedCategoryIds } = get();
      const updated = pinnedCategoryIds.includes(categoryId)
        ? pinnedCategoryIds.filter((id) => id !== categoryId)
        : [...pinnedCategoryIds, categoryId];
      await AsyncStorage.setItem(DASHBOARD_CATEGORIES_KEY, JSON.stringify(updated));
      set({ pinnedCategoryIds: updated });
    } catch (error) {
      console.error('Error saving dashboard categories:', error);
    }
  },
}));
