import { useCallback, useEffect, useState } from 'react';
import { getDateRange } from '.././utils/dateUtils';
import {
  fetchCategories,
  fetchCategoryAggregates,
  fetchCheckingBalance,
  fetchTotalExpenses,
  fetchTotalIncome,
  fetchTransactionsByDateRange
} from '../services/backendService';
import { Category, CategoryAggregation, ChartDataPoint, TimeFrame } from '../types/types';
import {
  aggregateTransactionsByDay,
  aggregateTransactionsByMonth,
  aggregateTransactionsByWeek
} from '../utils/chartUtils';

export const useDashboardData = (initialTimeFrame: TimeFrame = 'month') => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(initialTimeFrame);
  const [loading, setLoading] = useState(true);
  const [cache, setCache] = useState<Record<string, any>>({});
  
  // State for the UI
  const [data, setData] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    categories: [] as Category[],
    categoriesAggregated: [] as CategoryAggregation[],
    chartData: [] as ChartDataPoint[],
  });

  const applyData = useCallback((fetchedData: any) => {
    setData({
      totalBalance: fetchedData.balance,
      totalIncome: fetchedData.income,
      totalExpenses: fetchedData.expenses,
      categories: fetchedData.cats,
      categoriesAggregated: fetchedData.aggregates,
      chartData: fetchedData.chartData,
    });
  }, []);

  const fetchAllDataForPeriod = async (period: TimeFrame) => {
    const { startDate, endDate } = getDateRange(period);
    
    const [balance, income, expenses, cats, aggregates, transactions] = await Promise.all([
      fetchCheckingBalance(),
      fetchTotalIncome(startDate, endDate),
      fetchTotalExpenses(startDate, endDate),
      fetchCategories(),
      fetchCategoryAggregates(startDate, endDate),
      fetchTransactionsByDateRange(startDate, endDate)
    ]);

    let chartData: ChartDataPoint[];
    if (period === 'week') chartData = aggregateTransactionsByDay(transactions);
    else if (period === 'month') chartData = aggregateTransactionsByWeek(transactions);
    else chartData = aggregateTransactionsByMonth(transactions);

    const total = aggregates.reduce((sum, cat) => sum + cat.total_amount, 0);
    const aggregatesWithPercent = aggregates.map(cat => ({
      ...cat,
      percent: total ? (cat.total_amount / total) * 100 : 0
    }));

    return { balance, income, expenses, cats, aggregates: aggregatesWithPercent, chartData };
  };

  const preloadAllPeriods = async (force = false) => {
    try {
      setLoading(true);
      const periods: TimeFrame[] = ['week', 'month', 'year'];

      const results = await Promise.all(
        periods.map(async period => {
          if (!force && cache[period]) return { period, data: cache[period] };
          const periodData = await fetchAllDataForPeriod(period);
          return { period, data: periodData };
        })
      );

      const newCache = results.reduce((acc, { period, data }) => ({ ...acc, [period]: data }), {});
      setCache(prev => ({ ...prev, ...newCache }));
      
      if (newCache[timeFrame]) applyData(newCache[timeFrame]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply cached data on timeframe change synchronously to avoid a flash
  const handleSetTimeFrame = useCallback((newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
    if (cache[newTimeFrame]) {
      applyData(cache[newTimeFrame]);
    }
  }, [cache, applyData]);

  useEffect(() => {
    if (cache[timeFrame]) {
      applyData(cache[timeFrame]);
    } else {
      preloadAllPeriods();
    }
  }, [timeFrame]);

  return {
    timeFrame,
    setTimeFrame: handleSetTimeFrame,
    loading,
    ...data,
    refresh: () => preloadAllPeriods(true)
  };
};