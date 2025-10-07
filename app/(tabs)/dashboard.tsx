import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ExpenseCategoryCard from '../components/HomePage/ExpenseCategoryCard';
import HeaderSection from '../components/HomePage/HeaderSection';
import { SpendingCircleChart } from '../components/HomePage/SpendingCircleChart';
import TimePeriodToggles from '../components/HomePage/TimePeriodToggles';
import { fetchCategories, fetchCategoryAggregates, fetchTotalBalance, fetchTotalExpenses } from '../services/backendService';
import { Category, CategoryAggregation, ChartSegment } from '../types/types';

// const budget = {
//   target: 20000,
//   spent: 6000,
//   percentUsed: 30,
// };

const getDateRange = (period: 'Daily' | 'Weekly' | 'Monthly'): { startDate: Date, endDate: Date } => {
  const now = new Date();
  let startDate: Date;

  if (period === 'Daily') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'Weekly') {
    const day = now.getDay(); // Sunday = 0
    const diff = (day === 0 ? 6 : day - 1); // Monday = start of week
    startDate = new Date(now);
    startDate.setDate(now.getDate() - diff);
    startDate.setHours(0, 0, 0, 0);
  } else { // Monthly
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate, endDate: now };
};

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [chartTotal, setChartTotal] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesAggregated, setCategoriesAggregated] = useState<CategoryAggregation[]>([]);
  const [chartSegments, setChartSegments] = useState<ChartSegment[]>([]);
  const [loading, setLoading] = useState(false);

  const [cache, setCache] = useState<Record<string, any>>({});

  const fetchDashboardData = async (forceRefresh = false) => {
    if (!forceRefresh && cache[selectedPeriod]) {
      applyData(cache[selectedPeriod]);
      return;
    }

    try {
      setLoading(true);

      const { startDate, endDate } = getDateRange(selectedPeriod);
      const balance = await fetchTotalBalance();
      const expenses = await fetchTotalExpenses(startDate, endDate);
      const cats = await fetchCategories();
      const aggregates = await fetchCategoryAggregates(startDate, endDate);

      const total = aggregates.reduce((sum, cat) => sum + cat.total_amount, 0);

      const segments: ChartSegment[] = aggregates.map(cat => {
        const category = cats.find(c => c.category_name === cat.category_name);
        return {
          key: cat.category_name as string,
          value: cat.total_amount,
          color: category?.color || '#E0E0E0'
        };
      });

      const aggregatesWithPercent = aggregates.map(cat => ({
        ...cat,
        percent: total ? (cat.total_amount / total) * 100 : 0
      }));

      const newData = {
        balance,
        expenses,
        cats,
        aggregates: aggregatesWithPercent,
        total,
        segments
      };

      setCache(prev => ({ ...prev, [selectedPeriod]: newData }));

      applyData(newData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyData = (data: any) => {
    setTotalBalance(data.balance);
    setTotalExpenses(data.expenses);
    setCategories(data.cats);
    setCategoriesAggregated(data.aggregates);
    setChartTotal(data.total);
    setChartSegments(data.segments);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  useEffect(() => {
    preloadAllPeriods();
  }, []);
  
  const preloadAllPeriods = async (force = false) => {
    try {
      setLoading(true);
  
      const periods: ('Daily' | 'Weekly' | 'Monthly')[] = ['Daily', 'Weekly', 'Monthly'];
  
      const results = await Promise.all(
        periods.map(async period => {
          if (!force && cache[period]) return cache[period];
  
          const { startDate, endDate } = getDateRange(period);
          const balance = await fetchTotalBalance();
          const expenses = await fetchTotalExpenses(startDate, endDate);
          const cats = await fetchCategories();
          const aggregates = await fetchCategoryAggregates(startDate, endDate);
          const total = aggregates.reduce((sum, cat) => sum + cat.total_amount, 0);
  
          const segments = aggregates.map(cat => {
            const category = cats.find(c => c.category_name === cat.category_name);
            return {
              key: cat.category_name,
              value: cat.total_amount,
              color: category?.color || '#E0E0E0'
            };
          });
  
          const aggregatesWithPercent = aggregates.map(cat => ({
            ...cat,
            percent: total ? (cat.total_amount / total) * 100 : 0
          }));
  
          return {
            period,
            data: { balance, expenses, cats, aggregates: aggregatesWithPercent, total, segments }
          };
        })
      );
  
      const newCache = results.reduce((acc, { period, data }) => ({ ...acc, [period]: data }), {});
      setCache(prev => ({ ...prev, ...newCache }));
  
      applyData(newCache[selectedPeriod] || results.find(r => r.period === selectedPeriod)?.data);
  
    } catch (err) {
      console.error('Error preloading periods:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = () => preloadAllPeriods(true);



  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-backgroundDark">
        <StatusBar barStyle="light-content" className="bg-backgroundDark" />

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#00BFFF" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 32 }}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={onRefresh} />
            }
          >
            <HeaderSection totalBalance={totalBalance} totalExpenses={totalExpenses} />
            {/* <BudgetProgressBar percent={budget.percentUsed} target={budget.target} /> */}
            <SpendingCircleChart segments={chartSegments} total={chartTotal} />
            <TimePeriodToggles selected={selectedPeriod} onSelect={setSelectedPeriod} />
            <View className="mt-2 mx-2">
              {categories
                .filter(cat => {
                  const agg = categoriesAggregated.find(c => c.category_name === cat.category_name);
                  return agg && agg.total_amount > 0;
                })
                .sort((a, b) => {
                  const aggA = categoriesAggregated.find(c => c.category_name === a.category_name)?.total_amount || 0;
                  const aggB = categoriesAggregated.find(c => c.category_name === b.category_name)?.total_amount || 0;
                  return aggB - aggA;
                })
                .map(cat => {
                  const agg = categoriesAggregated.find(c => c.category_name === cat.category_name);
                  return (
                    <ExpenseCategoryCard
                      key={cat.id}
                      name={cat.category_name as string}
                      icon={cat.icon}
                      color={cat.color}
                      amount={agg?.total_amount || 0}
                      percent={agg ? Number(agg.percent.toPrecision(3)) : 0}
                    />
                  );
                })}
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Dashboard;
