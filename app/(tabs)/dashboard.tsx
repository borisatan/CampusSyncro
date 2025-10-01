import React, { useEffect, useState } from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import BudgetProgressBar from '../components/HomePage/BudgetProgressBar';
import ExpenseCategoryCard from '../components/HomePage/ExpenseCategoryCard';
import HeaderSection from '../components/HomePage/HeaderSection';
import SpendingCircleChart from '../components/HomePage/SpendingCircleChart';
import TimePeriodToggles from '../components/HomePage/TimePeriodToggles';
import { fetchCategories, fetchCategoryAggregates, fetchTotalBalance, fetchTotalExpenses } from '../services/backendService';
import { Category, CategoryAggregation, ChartSegment } from '../types/types';

const budget = {
  target: 20000,
  spent: 6000,
  percentUsed: 30,
};

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
  const [selectedTab, setSelectedTab] = useState('Home');
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesAggregated, setCategoriesAggregated] = useState<CategoryAggregation[]>([]);
  const [chartSegments, setChartSegments] = useState<ChartSegment[]>([]);
  const [chartTotal, setChartTotal] = useState<number>(0);

  const fetchDashboardData = async () => {
    try {
      const { startDate, endDate } = getDateRange(selectedPeriod);

      const balance = await fetchTotalBalance();
      setTotalBalance(balance);

      const expenses = await fetchTotalExpenses(startDate, endDate);
      setTotalExpenses(expenses);

      const cats = await fetchCategories();
      setCategories(cats);

      const aggregates = await fetchCategoryAggregates(startDate, endDate); // [{ categoryName, totalAmount }]
      console.log(aggregates);


      const total = aggregates.reduce((sum, cat) => sum + cat.total_amount, 0);
      setChartTotal(total);

      const segments: ChartSegment[] = aggregates.map(cat => {
        const category = cats.find(c => c.category_name === cat.category_name);
        return {
          key: cat.category_name as string,
          value: cat.total_amount,
          color: category?.color || '#E0E0E0'
        };
      });
      setChartSegments(segments);

      const aggregatesWithPercent = aggregates.map(cat => ({
        ...cat,
        percent: total ? (cat.total_amount / total) * 100 : 0
      }));
      setCategoriesAggregated(aggregatesWithPercent);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  // Fetch on mount & whenever period changes
  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);


  return (
    <SafeAreaProvider>
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <StatusBar barStyle="light-content" className="bg-backgroundDark" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <HeaderSection totalBalance={totalBalance} totalExpenses={totalExpenses} />
        <BudgetProgressBar percent={budget.percentUsed} target={budget.target} />
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
          return aggB - aggA; // descending
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
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Dashboard;
