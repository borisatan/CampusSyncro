import { useCallback, useEffect, useRef, useState } from 'react';
import { getDateRange } from '.././utils/dateUtils';
import {
  fetchCategoryAggregates,
  fetchCheckingBalance,
  fetchTotalExpenses,
  fetchTotalIncome,
  fetchTransactionsByDateRange
} from '../services/backendService';
import { useAuth } from '../context/AuthContext';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { Category, CategoryAggregation, ChartDataPoint, TimeFrame } from '../types/types';
import { DEMO_CATEGORIES, DEMO_DASHBOARD } from '../utils/demoData';
import {
  aggregateTransactionsByDay,
  aggregateTransactionsByDayOfMonth,
  aggregateTransactionsByMonth
} from '../utils/chartUtils';

const OFFSETS = [0, -1, -2] as const;
type PeriodOffset = typeof OFFSETS[number];

const cacheKey = (period: TimeFrame, offset: number) => `${period}_${offset}`;

export const useDashboardData = (initialTimeFrame: TimeFrame = 'month') => {
  const { isGuest } = useAuth();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(initialTimeFrame);
  const [offset, setOffset] = useState<PeriodOffset>(0);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<Record<string, any>>({});

  const [data, setData] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    categories: [] as Category[],
    categoriesAggregated: [] as CategoryAggregation[],
    chartData: [] as ChartDataPoint[],
  });

  const [chartDataByOffset, setChartDataByOffset] = useState<Record<number, ChartDataPoint[]>>({});

  const applyData = useCallback((fetchedData: any) => {
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

    const [balance, income, expenses, aggregates, transactions] = await Promise.all([
      fetchCheckingBalance(),
      fetchTotalIncome(startDate, endDate),
      fetchTotalExpenses(startDate, endDate),
      fetchCategoryAggregates(startDate, endDate),
      fetchTransactionsByDateRange(startDate, endDate)
    ]);

    let chartData: ChartDataPoint[];
    if (period === 'week') chartData = aggregateTransactionsByDay(transactions, startDate);
    else if (period === 'month') chartData = aggregateTransactionsByDayOfMonth(transactions, startDate);
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

  const initialLoad = async (force = false) => {
    if (force) {
      cacheRef.current = {};
    }

    try {
      setLoading(true);
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

    const allTimeFrames: TimeFrame[] = ['week', 'month', 'year'];
    try {
      await Promise.all(
        allTimeFrames.flatMap(period =>
          OFFSETS.map(o =>
            (period === timeFrame && o === 0) ? Promise.resolve() : fetchAndCache(period, o, force)
          )
        )
      );
      updateChartDataByOffset(timeFrame);
    } catch (err) {
      console.error('Error loading background offsets:', err);
    }
  };

  const handleSetTimeFrame = useCallback((newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
    setOffset(0);

    if (isGuest) {
      const demoChartData = DEMO_DASHBOARD.chartByTimeFrame[newTimeFrame]?.[0] ?? [];
      setData(prev => ({ ...prev, chartData: demoChartData, categories: DEMO_CATEGORIES }));
      setChartDataByOffset(DEMO_DASHBOARD.chartByTimeFrame[newTimeFrame] as Record<number, ChartDataPoint[]> ?? {});
      return;
    }

    const key = cacheKey(newTimeFrame, 0);
    if (cacheRef.current[key]) {
      applyData(cacheRef.current[key]);
      updateChartDataByOffset(newTimeFrame);
    } else {
      setLoading(true);
      fetchAndCache(newTimeFrame, 0).then((result) => {
        applyData(result);
        updateChartDataByOffset(newTimeFrame);
        setLoading(false);
      }).catch(err => {
        console.error('Error fetching timeframe:', err);
        setLoading(false);
      });

      Promise.all(
        OFFSETS.filter(o => o !== 0).map(o => fetchAndCache(newTimeFrame, o))
      ).then(() => updateChartDataByOffset(newTimeFrame)).catch(() => {});
    }
  }, [applyData, updateChartDataByOffset, isGuest]);

  const handleSetOffset = useCallback((newOffset: PeriodOffset) => {
    setOffset(newOffset);

    if (isGuest) {
      const demoForOffset = DEMO_DASHBOARD.chartByTimeFrame[timeFrame]?.[newOffset];
      if (demoForOffset) {
        setData(prev => ({ ...prev, chartData: demoForOffset }));
      }
      return;
    }

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
  }, [timeFrame, isGuest]);

  useEffect(() => {
    if (isGuest) {
      setData({
        totalBalance: DEMO_DASHBOARD.totalBalance,
        totalIncome: DEMO_DASHBOARD.totalIncome,
        totalExpenses: DEMO_DASHBOARD.totalExpenses,
        categories: DEMO_CATEGORIES,
        categoriesAggregated: DEMO_DASHBOARD.categoriesAggregated,
        chartData: DEMO_DASHBOARD.chartData,
      });
      setChartDataByOffset(DEMO_DASHBOARD.chartDataByOffset);
      setLoading(false);
      return;
    }
    initialLoad();
  }, [isGuest]);

  // Re-apply cached data when categories load for new sign-ups (not needed for guests)
  const storeCategories = useCategoriesStore(state => state.categories);
  const prevCategoriesLengthRef = useRef(0);
  useEffect(() => {
    if (isGuest) return;
    const prevLen = prevCategoriesLengthRef.current;
    prevCategoriesLengthRef.current = storeCategories.length;
    if (storeCategories.length > 0 && prevLen === 0) {
      const key = cacheKey(timeFrame, offset);
      if (cacheRef.current[key]) {
        applyData(cacheRef.current[key]);
      }
    }
  }, [storeCategories, timeFrame, offset, applyData, isGuest]);

  return {
    timeFrame,
    offset,
    setTimeFrame: handleSetTimeFrame,
    setOffset: handleSetOffset,
    loading,
    ...data,
    chartDataByOffset,
    refresh: () => isGuest ? Promise.resolve() : initialLoad(true)
  };
};
