import { useCallback, useEffect, useState } from 'react';
import { fetchMonthlySavingsProgress } from '../services/backendService';
import { useAuth } from '../context/AuthContext';
import { useIncomeStore } from '../store/useIncomeStore';
import { DEMO_SAVINGS_PROGRESS } from '../utils/demoData';
import { getPeriodDates } from './useBudgetsData';

interface SavingsProgressResult {
  target: number;
  saved: number;
  percentage: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useSavingsProgress = (): SavingsProgressResult => {
  const { isGuest } = useAuth();
  const { monthlySavingsTarget } = useIncomeStore();
  const [saved, setSaved] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    try {
      const { startDate, endDate } = getPeriodDates();
      const totalSaved = await fetchMonthlySavingsProgress(startDate, endDate);
      setSaved(totalSaved);
    } catch (error) {
      console.error('Error fetching savings progress:', error);
    }
  }, []);

  useEffect(() => {
    if (isGuest) {
      setIsLoading(false);
      return;
    }
    fetchProgress().finally(() => setIsLoading(false));
  }, [fetchProgress, isGuest]);

  const refresh = useCallback(async () => {
    if (isGuest) return;
    await fetchProgress();
  }, [fetchProgress, isGuest]);

  if (isGuest) {
    return {
      target: DEMO_SAVINGS_PROGRESS.target,
      saved: DEMO_SAVINGS_PROGRESS.saved,
      percentage: DEMO_SAVINGS_PROGRESS.percentage,
      isLoading: false,
      refresh: async () => {},
    };
  }

  const percentage = monthlySavingsTarget > 0
    ? Math.min((saved / monthlySavingsTarget) * 100, 100)
    : 0;

  return {
    target: monthlySavingsTarget,
    saved,
    percentage,
    isLoading,
    refresh,
  };
};
