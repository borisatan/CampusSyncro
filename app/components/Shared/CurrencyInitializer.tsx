import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrencyStore } from '../../store/useCurrencyStore';

export default function CurrencyInitializer() {
  const { userId, isGuest, isLoading: authLoading } = useAuth();
  const { loadCurrency } = useCurrencyStore();

  useEffect(() => {
    if (authLoading) return;
    if (isGuest) {
      useCurrencyStore.setState({ currencyCode: 'USD', currencySymbol: '$', isLoading: false });
      return;
    }
    if (userId) {
      loadCurrency();
    }
  }, [userId, isGuest, authLoading, loadCurrency]);

  return null;
}
