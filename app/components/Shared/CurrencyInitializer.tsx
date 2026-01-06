import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrencyStore } from '../../store/useCurrencyStore';

/**
 * Component that initializes the currency store when user is authenticated
 * Should be placed in the root layout
 */
export default function CurrencyInitializer() {
  const { userId, isLoading: authLoading } = useAuth();
  const { loadCurrency } = useCurrencyStore();

  useEffect(() => {
    if (!authLoading && userId) {
      loadCurrency();
    }
  }, [userId, authLoading, loadCurrency]);

  return null;
}

