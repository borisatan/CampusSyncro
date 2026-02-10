import { useCallback, useEffect, useState } from 'react';
import { fetchMonthlySavingsProgress } from '../services/backendService';
import { useIncomeStore } from '../store/useIncomeStore';
import { getPeriodDates } from './useBudgetsData';

interface SavingsProgressResult {
  target: number;
  saved: number;
  percentage: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useSavingsProgress = (): SavingsProgressResult => {
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
    fetchProgress().finally(() => setIsLoading(false));
  }, [fetchProgress]);

  const refresh = useCallback(async () => {
    await fetchProgress();
  }, [fetchProgress]);

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
