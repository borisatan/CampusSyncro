import { useCallback, useEffect, useRef, useState } from 'react';
import { getDateRange } from '.././utils/dateUtils';
import {
  fetchCategoryAggregates,
  fetchCheckingBalance,
  fetchTotalExpenses,
  fetchTotalIncome,
  fetchTransactionsByDateRange
} from '../services/backendService';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { Category, CategoryAggregation, ChartDataPoint, TimeFrame } from '../types/types';
import {
  aggregateTransactionsByDay,
  aggregateTransactionsByMonth,
  aggregateTransactionsByWeek
} from '../utils/chartUtils';

const OFFSETS = [0, -1, -2] as const;
type PeriodOffset = typeof OFFSETS[number];

const cacheKey = (period: TimeFrame, offset: number) => `${period}_${offset}`;

export const useDashboardData = (initialTimeFrame: TimeFrame = 'month') => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(initialTimeFrame);
  const [offset, setOffset] = useState<PeriodOffset>(0);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<Record<string, any>>({});

  // State for the UI (summary data for the active offset)
  const [data, setData] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    categories: [] as Category[],
    categoriesAggregated: [] as CategoryAggregation[],
    chartData: [] as ChartDataPoint[],
  });

  // Chart data for all offsets of the current timeFrame (for scrollable view)
  const [chartDataByOffset, setChartDataByOffset] = useState<Record<number, ChartDataPoint[]>>({});

  const applyData = useCallback((fetchedData: any) => {
    // Read categories from the Zustand store instead of fetching them
    const categories = useCategoriesStore.getState().categories;
    setData({
      totalBalance: fetchedData.balance,
      totalIncome: fetchedData.income,
      totalExpenses: fetchedData.expenses,
      categories,
      categoriesAggregated: fetchedData.aggregates,
      chartData: fetchedData.chartData,
    });
  }, []);

  const fetchAllDataForPeriod = async (period: TimeFrame, periodOffset: number = 0) => {
    const { startDate, endDate } = getDateRange(period, periodOffset);

    // No more fetchCategories() here — read from store instead
    const [balance, income, expenses, aggregates, transactions] = await Promise.all([
      fetchCheckingBalance(),
      fetchTotalIncome(startDate, endDate),
      fetchTotalExpenses(startDate, endDate),
      fetchCategoryAggregates(startDate, endDate),
      fetchTransactionsByDateRange(startDate, endDate)
    ]);

    let chartData: ChartDataPoint[];
    if (period === 'week') chartData = aggregateTransactionsByDay(transactions, startDate);
    else if (period === 'month') chartData = aggregateTransactionsByWeek(transactions, startDate);
    else chartData = aggregateTransactionsByMonth(transactions, startDate);

    const total = aggregates.reduce((sum, cat) => sum + cat.total_amount, 0);
    const aggregatesWithPercent = aggregates.map(cat => ({
      ...cat,
      percent: total ? (cat.total_amount / total) * 100 : 0
    }));

    return { balance, income, expenses, aggregates: aggregatesWithPercent, chartData };
  };

  const fetchAndCache = async (period: TimeFrame, periodOffset: number, force = false) => {
    const key = cacheKey(period, periodOffset);
    if (!force && cacheRef.current[key]) return cacheRef.current[key];
    const result = await fetchAllDataForPeriod(period, periodOffset);
    cacheRef.current[key] = result;
    return result;
  };

  const updateChartDataByOffset = useCallback((period: TimeFrame) => {
    const map: Record<number, ChartDataPoint[]> = {};
    for (const o of OFFSETS) {
      const key = cacheKey(period, o);
      if (cacheRef.current[key]) {
        map[o] = cacheRef.current[key].chartData;
      }
    }
    setChartDataByOffset(map);
  }, []);

  // Initial load: only fetch offset 0 for the initial timeframe, then lazy-load the rest
  const initialLoad = async (force = false) => {
    try {
      setLoading(true);

      // 1. Fetch only the current timeframe + offset 0
      await fetchAndCache(timeFrame, 0, force);
      const currentKey = cacheKey(timeFrame, 0);
      if (cacheRef.current[currentKey]) {
        applyData(cacheRef.current[currentKey]);
        updateChartDataByOffset(timeFrame);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }

    // 2. Background: fetch remaining offsets for current timeframe
    try {
      await Promise.all(
        OFFSETS.filter(o => o !== 0).map(o => fetchAndCache(timeFrame, o, force))
      );
      updateChartDataByOffset(timeFrame);
    } catch (err) {
      console.error('Error loading background offsets:', err);
    }

    // 3. Background: fetch other timeframes (all offsets) so switching is fast
    const otherPeriods: TimeFrame[] = (['week', 'month', 'year'] as TimeFrame[]).filter(p => p !== timeFrame);
    try {
      await Promise.all(
        otherPeriods.flatMap(period =>
          OFFSETS.map(o => fetchAndCache(period, o, force))
        )
      );
    } catch (err) {
      console.error('Error preloading other periods:', err);
    }
  };

  // Apply cached data on timeframe change
  const handleSetTimeFrame = useCallback((newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
    setOffset(0);
    const key = cacheKey(newTimeFrame, 0);
    if (cacheRef.current[key]) {
      // Data already cached — apply instantly, no fetch needed
      applyData(cacheRef.current[key]);
      updateChartDataByOffset(newTimeFrame);
    } else {
      // Not cached yet — fetch just offset 0, then background-load the rest
      setLoading(true);
      fetchAndCache(newTimeFrame, 0).then((result) => {
        applyData(result);
        updateChartDataByOffset(newTimeFrame);
        setLoading(false);
      }).catch(err => {
        console.error('Error fetching timeframe:', err);
        setLoading(false);
      });

      // Background: load remaining offsets
      Promise.all(
        OFFSETS.filter(o => o !== 0).map(o => fetchAndCache(newTimeFrame, o))
      ).then(() => updateChartDataByOffset(newTimeFrame)).catch(() => {});
    }
  }, [applyData, updateChartDataByOffset]);

  // Apply cached data on offset change (when user scrolls chart).
  const handleSetOffset = useCallback((newOffset: PeriodOffset) => {
    setOffset(newOffset);
    const key = cacheKey(timeFrame, newOffset);
    if (cacheRef.current[key]) {
      const cached = cacheRef.current[key];
      setData(prev => ({
        ...prev,
        totalIncome: cached.income,
        totalExpenses: cached.expenses,
        categoriesAggregated: cached.aggregates,
      }));
    }
  }, [timeFrame]);

  useEffect(() => {
    initialLoad();
  }, []);

  return {
    timeFrame,
    offset,
    setTimeFrame: handleSetTimeFrame,
    setOffset: handleSetOffset,
    loading,
    ...data,
    chartDataByOffset,
    refresh: () => initialLoad(true)
  };
};
