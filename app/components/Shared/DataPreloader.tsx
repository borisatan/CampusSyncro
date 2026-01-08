import { useEffect } from 'react';
import { useAccountsStore } from '../../store/useAccountsStore';
import { useCategoriesStore } from '../../store/useCategoriesStore';
import { useCurrencyStore } from '../../store/useCurrencyStore';

/**
 * DataPreloader - Loads all app data on mount
 * This component doesn't render anything, it just preloads data
 */
export default function DataPreloader() {
  const loadAccounts = useAccountsStore((state) => state.loadAccounts);
  const loadCategories = useCategoriesStore((state) => state.loadCategories);
  const loadCurrency = useCurrencyStore((state) => state.loadCurrency);

  useEffect(() => {
    // Load all data in parallel when app starts
    const preloadAllData = async () => {
      try {
        await Promise.all([
          loadAccounts(),
          loadCategories(),
          loadCurrency(),
        ]);
        console.log('✅ All app data preloaded successfully');
      } catch (error) {
        console.error('❌ Error preloading app data:', error);
      }
    };

    preloadAllData();
  }, []);

  return null; // This component doesn't render anything
}

