import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSavingsForPeriod } from '../services/backendService';
import { useAccountsStore } from '../store/useAccountsStore';
import { Account } from '../types/types';

interface AccountSavingsBreakdown {
  account: Account;
  savedThisMonth: number;
  goal: number | null;
  progressPercent: number;
}

interface SavingsDataResult {
  thisMonthSavings: number;
  thisMonthInvestments: number;
  totalSavedThisMonth: number;
  savingsGoalTotal: number;
  goalProgress: number;
  accountBreakdown: AccountSavingsBreakdown[];
  hasSavingsAccounts: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const getPeriodDates = (): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startDate, endDate };
};

export const useSavingsData = (): SavingsDataResult => {
  const [thisMonthSavings, setThisMonthSavings] = useState(0);
  const [thisMonthInvestments, setThisMonthInvestments] = useState(0);
  const [byAccount, setByAccount] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const hasMounted = useRef(false);

  const accounts = useAccountsStore((state) => state.accounts);

  const savingsAndInvestmentAccounts = accounts.filter(
    (acc) => acc.type === 'savings' || acc.type === 'investment'
  );

  const hasSavingsAccounts = savingsAndInvestmentAccounts.length > 0;

  const fetchData = useCallback(async () => {
    if (!hasSavingsAccounts) {
      setThisMonthSavings(0);
      setThisMonthInvestments(0);
      setByAccount({});
      return;
    }

    const { startDate, endDate } = getPeriodDates();
    const result = await fetchSavingsForPeriod(startDate, endDate);

    setThisMonthSavings(result.savings);
    setThisMonthInvestments(result.investments);
    setByAccount(result.byAccount);
  }, [hasSavingsAccounts]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      fetchData()
        .catch((error) => console.error('Error loading savings data:', error))
        .finally(() => setIsLoading(false));
    }
  }, [fetchData]);

  const refresh = useCallback(async () => {
    try {
      await fetchData();
    } catch (error) {
      console.error('Error refreshing savings data:', error);
    }
  }, [fetchData]);

  const totalSavedThisMonth = thisMonthSavings + thisMonthInvestments;

  const savingsGoalTotal = savingsAndInvestmentAccounts.reduce(
    (sum, acc) => sum + (acc.monthly_savings_goal ?? 0),
    0
  );

  const goalProgress = savingsGoalTotal > 0
    ? Math.min((totalSavedThisMonth / savingsGoalTotal) * 100, 100)
    : 0;

  const accountBreakdown: AccountSavingsBreakdown[] = savingsAndInvestmentAccounts.map((account) => {
    const savedThisMonth = byAccount[account.account_name] ?? 0;
    const goal = account.monthly_savings_goal ?? null;
    const progressPercent = goal && goal > 0
      ? Math.min((savedThisMonth / goal) * 100, 100)
      : 0;

    return { account, savedThisMonth, goal, progressPercent };
  });

  return {
    thisMonthSavings,
    thisMonthInvestments,
    totalSavedThisMonth,
    savingsGoalTotal,
    goalProgress,
    accountBreakdown,
    hasSavingsAccounts,
    isLoading,
    refresh,
  };
};
