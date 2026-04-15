import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateCategoryDashboardVisibility } from '../services/backendService';
import { useCategoriesStore } from './useCategoriesStore';

const DASHBOARD_CATEGORIES_KEY = '@perfin_dashboard_categories';

/**
 * Migrates old AsyncStorage pinned categories to database show_on_dashboard field
 * Should be called once on app startup
 */
export const migrateDashboardCategoriesToDatabase = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(DASHBOARD_CATEGORIES_KEY);
    if (!stored) {
      return; // No old data to migrate
    }

    const pinnedCategoryIds: string[] = JSON.parse(stored);
    const { categories } = useCategoriesStore.getState();

    if (pinnedCategoryIds.length === 0) {
      // Old behavior: empty array meant "show all"
      // New behavior: show_on_dashboard defaults to true, so nothing to do
      await AsyncStorage.removeItem(DASHBOARD_CATEGORIES_KEY);
      return;
    }

    // Update database: set show_on_dashboard based on old pinned state
    const updatePromises = categories.map(async (category) => {
      const shouldShow = pinnedCategoryIds.includes(category.id);
      try {
        await updateCategoryDashboardVisibility(category.id, shouldShow);
      } catch (error) {
        console.error(`Error migrating category ${category.id}:`, error);
      }
    });

    await Promise.all(updatePromises);

    // Remove old AsyncStorage data after successful migration
    await AsyncStorage.removeItem(DASHBOARD_CATEGORIES_KEY);

    // Refresh categories to get updated show_on_dashboard values
    await useCategoriesStore.getState().loadCategories();
  } catch (error) {
    console.error('Error migrating dashboard categories:', error);
  }
};

/**
 * Toggle whether a category is shown on the dashboard
 * Looks up the current state from the store and flips it
 * Updates the database and refreshes the categories store
 */
export const toggleCategoryDashboardVisibility = async (
  categoryId: string
): Promise<void> => {
  try {
    const { categories } = useCategoriesStore.getState();
    const category = categories.find((c) => c.id === categoryId);

    if (!category) {
      throw new Error(`Category ${categoryId} not found`);
    }

    // Get current state (default to true if not set)
    const currentlyShown = category.show_on_dashboard ?? true;

    // Toggle to opposite value
    await updateCategoryDashboardVisibility(categoryId, !currentlyShown);

    // Refresh categories to get the updated value
    await useCategoriesStore.getState().loadCategories();
  } catch (error) {
    console.error('Error toggling category dashboard visibility:', error);
    throw error;
  }
};
