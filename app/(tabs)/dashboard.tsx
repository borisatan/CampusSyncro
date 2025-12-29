import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle, useFont } from '@shopify/react-native-skia';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SharedValue, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import ExpenseCategoryCard from '../components/HomePage/ExpenseCategoryCard';
import { fetchCategories, fetchCategoryAggregates, fetchTotalBalance, fetchTransactionsByDateRange } from '../services/backendService';
import { Category, CategoryAggregation, Transaction } from '../types/types';
import { DashboardSummary } from '../components/HomePage/DashboardSummary';
import { TimeFrameSelector } from '../components/HomePage/TimeFrameSelector';
import { SpendingTrendChart } from '../components/HomePage/SpendingTrendChart';
import { CategoryDonut } from '../components/HomePage/CategoryDonut';

const screenWidth = Dimensions.get('window').width;

type ChartDataPoint = {
  label: string;
  amount: number;
  x: number;
};

type TimeFrame = 'week' | 'month' | 'year';

// Tooltip Component
function ToolTip({ 
  x, 
  y
}: { 
  x: SharedValue<number>; 
  y: SharedValue<number>;
}) {
  return (
    <>
      <Circle cx={x} cy={y} r={8} color="#6366f1" opacity={0.8} />
      <Circle cx={x} cy={y} r={4} color="#fff" />
    </>
  );
}

const getDateRange = (period: TimeFrame): { startDate: Date, endDate: Date } => {
  const now = new Date();
  let startDate: Date;

  if (period === 'week') {
    const day = now.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    startDate = new Date(now);
    startDate.setDate(now.getDate() - diff);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  return { startDate, endDate: now };
};

const aggregateTransactionsByDay = (transactions: Transaction[]): ChartDataPoint[] => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const currentDay = now.getDay();
  const diff = (currentDay === 0 ? 6 : currentDay - 1);
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);

  const dailyTotals: Record<string, number> = {};
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const key = date.toISOString().split('T')[0];
    dailyTotals[key] = 0;
  }

  transactions.forEach(t => {
    const date = new Date(t.created_at);
    const key = date.toISOString().split('T')[0];
    if (key in dailyTotals) {
      dailyTotals[key] += Math.abs(t.amount);
    }
  });

  return Object.keys(dailyTotals).map((key, index) => {
    const date = new Date(key);
    const dayIndex = (date.getDay() + 6) % 7;
    return {
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex],
      amount: dailyTotals[key],
      x: index
    };
  });
};

const aggregateTransactionsByWeek = (transactions: Transaction[]): ChartDataPoint[] => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const weeklyTotals: number[] = [0, 0, 0, 0, 0];
  
  transactions.forEach(t => {
    const date = new Date(t.created_at);
    const dayOfMonth = date.getDate();
    const weekIndex = Math.floor((dayOfMonth - 1) / 7);
    if (weekIndex < 5) {
      weeklyTotals[weekIndex] += Math.abs(t.amount);
    }
  });

  const weeks = weeklyTotals.filter((_, i) => {
    const weekStart = new Date(firstDay);
    weekStart.setDate(1 + (i * 7));
    return weekStart <= now;
  });

  return weeks.map((total, index) => ({
    label: `W${index + 1}`,
    amount: total,
    x: index
  }));
};

const aggregateTransactionsByMonth = (transactions: Transaction[]): ChartDataPoint[] => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentYear = now.getFullYear();
  
  const monthlyTotals: Record<number, number> = {};
  
  for (let i = 0; i <= now.getMonth(); i++) {
    monthlyTotals[i] = 0;
  }

  transactions.forEach(t => {
    const date = new Date(t.created_at);
    if (date.getFullYear() === currentYear) {
      const month = date.getMonth();
      monthlyTotals[month] += Math.abs(t.amount);
    }
  });

  return Object.keys(monthlyTotals).map((month, index) => ({
    label: monthNames[parseInt(month)],
    amount: monthlyTotals[parseInt(month)],
    x: index
  }));
};

export default function Dashboard() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const [tooltipData, setTooltipData] = useState({ label: '', value: 0 });
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesAggregated, setCategoriesAggregated] = useState<CategoryAggregation[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState<Record<string, any>>({});
  
  const router = useRouter();
  const interFont = useFont(
    require("../../assets/fonts/InterVariable.ttf"),
    12
  );

  const onCategoryPress = (category_name: string) => {
    router.push({
      pathname: "/transaction-list",
      params: { initialCategory: category_name, t: Date.now().toString() },
    });
  };

  const fetchDashboardData = async (period: TimeFrame, forceRefresh = false) => {
    if (!forceRefresh && cache[period]) {
      applyData(cache[period]);
      return;
    }

    try {
      const { startDate, endDate } = getDateRange(period);
      const balance = await fetchTotalBalance();
      const cats = await fetchCategories();
      const aggregates = await fetchCategoryAggregates(startDate, endDate);
      const transactions = await fetchTransactionsByDateRange(startDate, endDate);

      let aggregatedChartData: ChartDataPoint[];
      if (period === 'week') {
        aggregatedChartData = aggregateTransactionsByDay(transactions);
      } else if (period === 'month') {
        aggregatedChartData = aggregateTransactionsByWeek(transactions);
      } else {
        aggregatedChartData = aggregateTransactionsByMonth(transactions);
      }

      const total = aggregates.reduce((sum, cat) => sum + cat.total_amount, 0);

      const aggregatesWithPercent = aggregates.map(cat => ({
        ...cat,
        percent: total ? (cat.total_amount / total) * 100 : 0
      }));

      const newData = {
        balance,
        cats,
        aggregates: aggregatesWithPercent,
        chartData: aggregatedChartData,
      };

      setCache(prev => ({ ...prev, [period]: newData }));
      applyData(newData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  const applyData = (data: any) => {
    setTotalBalance(data.balance);
    setCategories(data.cats);
    setCategoriesAggregated(data.aggregates);
    setChartData(data.chartData);
  };

  const preloadAllPeriods = async (force = false) => {
    try {
      setLoading(true);
      const periods: TimeFrame[] = ['week', 'month', 'year'];

      const results = await Promise.all(
        periods.map(async period => {
          if (!force && cache[period]) return { period, data: cache[period] };

          const { startDate, endDate } = getDateRange(period);
          const balance = await fetchTotalBalance();
          const cats = await fetchCategories();
          const aggregates = await fetchCategoryAggregates(startDate, endDate);
          const transactions = await fetchTransactionsByDateRange(startDate, endDate);

          let aggregatedChartData: ChartDataPoint[];
          if (period === 'week') {
            aggregatedChartData = aggregateTransactionsByDay(transactions);
          } else if (period === 'month') {
            aggregatedChartData = aggregateTransactionsByWeek(transactions);
          } else {
            aggregatedChartData = aggregateTransactionsByMonth(transactions);
          }

          const total = aggregates.reduce((sum, cat) => sum + cat.total_amount, 0);

          const aggregatesWithPercent = aggregates.map(cat => ({
            ...cat,
            percent: total ? (cat.total_amount / total) * 100 : 0
          }));

          return {
            period,
            data: { balance, cats, aggregates: aggregatesWithPercent, chartData: aggregatedChartData }
          };
        })
      );

      const newCache = results.reduce((acc, { period, data }) => ({ ...acc, [period]: data }), {});
      setCache(prev => ({ ...prev, ...newCache }));

      applyData(newCache[timeFrame] || results.find(r => r.period === timeFrame)?.data);
    } catch (err) {
      console.error('Error preloading periods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cache[timeFrame]) {
      applyData(cache[timeFrame]);
    } else {
      fetchDashboardData(timeFrame);
    }
  }, [timeFrame]);

  useEffect(() => {
    preloadAllPeriods();
  }, []);

  const onRefresh = () => preloadAllPeriods(true);

  const { state, isActive } = useChartPressState({
    x: 0,
    y: { amount: 0 }
  });

  const getLabelStep = (count: number) => {
    if (count <= 6) return 1;
    if (count <= 12) return 2;
    return 3;
  };

  useAnimatedReaction(
    () => ({
      x: state.x.value.value,
      y: state.y.amount.value.value,
    }),
    (current) => {
      const index = Math.round(current.x);
      const label = chartData[index]?.label || '';
      const value = Math.round(current.y);
      runOnJS(setTooltipData)({ label, value });
    }
  );

  const DonutChart = () => {
    const categoryData = categoriesAggregated.filter(cat => cat.total_amount < 0);
    const total = categoryData.reduce((sum, item) => sum + item.total_amount, 0);
    
    if (categoryData.length === 0) {
      return (
        <View className="w-[120px] h-[120px] items-center justify-center">
          <Text className="text-slate-500 text-xs">No data</Text>
        </View>
      );
    }

    const size = 160;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    
    let accumulatedAngle = 0;

    return (
      <View className="w-[120px] h-[120px] items-center justify-center">
        <Svg width={size} height={size}>
          {categoryData.map((item, index) => {
            const category = categories.find(c => c.category_name === item.category_name);
            const color = category?.color || '#E0E0E0';
            const percentage = item.total_amount / total;
            const circumference = 2 * Math.PI * radius;
            const arcLength = percentage * circumference;
            const gapSize = 3;
            
            const segment = (
              <SvgCircle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${arcLength - gapSize} ${circumference - arcLength + gapSize}`}
                strokeDashoffset={-accumulatedAngle * (circumference / 360)}
                strokeLinecap="butt"
              />
            );
            
            accumulatedAngle += percentage * 360;
            return segment;
          })}
          
          <SvgCircle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2}
            fill="#0f172a"
          />
        </Svg>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950 ">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => preloadAllPeriods(true)} />}
      >
        <View className="p-2">

          {/* 1. Metric Overview */}
          <DashboardSummary totalBalance={totalBalance} />

          {/* 2. Filter Controls */}
          <TimeFrameSelector selected={timeFrame} onChange={setTimeFrame} />

          {/* 3. Visualizations */}
          <SpendingTrendChart 
            data={chartData} 
            timeFrame={timeFrame} 
            font={interFont}
          />

          <CategoryDonut
           aggregates={categoriesAggregated} 
           categories={categories} 
           timeFrame={timeFrame} />

          {/* 4. Detailed Breakdown List */}
          <View className="mt-2">
            {categories
              .filter(cat => {
                const agg = categoriesAggregated.find(c => c.category_name === cat.category_name);
                return agg && agg.total_amount;
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
                    amount={-agg?.total_amount || 0}
                    percent={agg ? Number(agg.percent.toPrecision(3)) : 0}
                    onPress={onCategoryPress}
                  />
                );
              })}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
