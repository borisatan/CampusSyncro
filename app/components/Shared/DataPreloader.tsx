import { useEffect } from 'react';
import { useAccountsStore } from '../../store/useAccountsStore';
import { useCategoriesStore } from '../../store/useCategoriesStore';

/**
 * DataPreloader - Loads accounts and categories on mount.
 * Currency is loaded separately by CurrencyInitializer (after auth).
 */
export default function DataPreloader() {
  const loadAccounts = useAccountsStore((state) => state.loadAccounts);
  const loadCategories = useCategoriesStore((state) => state.loadCategories);

  useEffect(() => {
    const preloadAllData = async () => {
      try {
        await Promise.all([
          loadAccounts(),
          loadCategories(),
        ]);
      } catch (error) {
        console.error('Error preloading app data:', error);
      }
    };

    preloadAllData();
  }, []);

  return null;
}

