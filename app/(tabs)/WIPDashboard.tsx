// import { useRouter } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, View } from 'react-native';
// import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
// import ExpenseCategoryCard from '../components/HomePage/ExpenseCategoryCard';
// import { SpendingCircleChart } from '../components/HomePage/SpendingCircleChart';
// import TimePeriodToggles from '../components/HomePage/TimePeriodToggles';
// import { fetchCategories, fetchCategoryAggregates, fetchTotalBalance, fetchTotalExpenses } from '../services/backendService';
// import { Category, CategoryAggregation, ChartSegment } from '../types/types';

// // const budget = {
// //   target: 20000,
// //   spent: 6000,
// //   percentUsed: 30,
// // };

// const getDateRange = (period: 'Daily' | 'Weekly' | 'Monthly'): { startDate: Date, endDate: Date } => {
//   const now = new Date();
//   let startDate: Date;

//   if (period === 'Daily') {
//     startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   } else if (period === 'Weekly') {
//     const day = now.getDay(); // Sunday = 0
//     const diff = (day === 0 ? 6 : day - 1); // Monday = start of week
//     startDate = new Date(now);
//     startDate.setDate(now.getDate() - diff);
//     startDate.setHours(0, 0, 0, 0);
//   } else { // Monthly
//     startDate = new Date(now.getFullYear(), now.getMonth(), 1);
//   }

//   return { startDate, endDate: now };
// };



// const Dashboard: React.FC = () => {
//   const [selectedPeriod, setSelectedPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
//   const [totalBalance, setTotalBalance] = useState<number>(0);
//   const [chartTotal, setChartTotal] = useState<number>(0);
//   const [totalExpenses, setTotalExpenses] = useState<number>(0);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [categoriesAggregated, setCategoriesAggregated] = useState<CategoryAggregation[]>([]);
//   const [chartSegments, setChartSegments] = useState<ChartSegment[]>([]);
//   const [loading, setLoading] = useState(false);
  
//   const [cache, setCache] = useState<Record<string, any>>({});
//   const router = useRouter();

  
//   const onCategoryPress = (category_name: string) => {
//     router.push({
//       pathname: "/transaction-list",
//       params: { initialCategory: category_name, t: Date.now().toString() },
//     });
//   };

  
//   const fetchDashboardData = async (forceRefresh = false) => {
//     if (!forceRefresh && cache[selectedPeriod]) {
//       applyData(cache[selectedPeriod]);
//       return;
//     }

//     try {
//       setLoading(true);

//       const { startDate, endDate } = getDateRange(selectedPeriod);
//       const balance = await fetchTotalBalance();
//       const expenses = await fetchTotalExpenses(startDate, endDate);
//       const cats = await fetchCategories();
//       const aggregates = await fetchCategoryAggregates(startDate, endDate);

//       const total = aggregates.reduce((sum, cat) => sum + cat.total_amount, 0);

//       const segments: ChartSegment[] = aggregates.map(cat => {
//         const category = cats.find(c => c.category_name === cat.category_name);
//         return {
//           key: cat.category_name as string,
//           value: cat.total_amount,
//           color: category?.color || '#E0E0E0'
//         };
//       });

//       const aggregatesWithPercent = aggregates.map(cat => ({
//         ...cat,
//         percent: total ? (cat.total_amount / total) * 100 : 0
//       }));

//       const newData = {
//         balance,
//         expenses,
//         cats,
//         aggregates: aggregatesWithPercent,
//         total,
//         segments
//       };

//       setCache(prev => ({ ...prev, [selectedPeriod]: newData }));

//       applyData(newData);
//     } catch (err) {
//       console.error('Failed to fetch dashboard data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const applyData = (data: any) => {
//     setTotalBalance(data.balance);
//     setTotalExpenses(data.expenses);
//     setCategories(data.cats);
//     setCategoriesAggregated(data.aggregates);
//     setChartTotal(data.total);
//     setChartSegments(data.segments);
//   };

//   useEffect(() => {
//     fetchDashboardData();
//   }, [selectedPeriod]);

//   useEffect(() => {
//     preloadAllPeriods();
//   }, []);
  
//   const preloadAllPeriods = async (force = false) => {
//     try {
//       setLoading(true);
  
//       const periods: ('Daily' | 'Weekly' | 'Monthly')[] = ['Daily', 'Weekly', 'Monthly'];
  
//       const results = await Promise.all(
//         periods.map(async period => {
//           if (!force && cache[period]) return cache[period];
  
//           const { startDate, endDate } = getDateRange(period);
//           const balance = await fetchTotalBalance();
//           const expenses = await fetchTotalExpenses(startDate, endDate);
//           const cats = await fetchCategories();
//           const aggregates = await fetchCategoryAggregates(startDate, endDate);
//           const total = aggregates.reduce((sum, cat) => sum + cat.total_amount, 0);
  
//           const segments = aggregates.map(cat => {
//             const category = cats.find(c => c.category_name === cat.category_name);
//             return {
//               key: cat.category_name,
//               value: cat.total_amount,
//               color: category?.color || '#E0E0E0'
//             };
//           });
  
//           const aggregatesWithPercent = aggregates.map(cat => ({
//             ...cat,
//             percent: total ? (cat.total_amount / total) * 100 : 0
//           }));
  
//           return {
//             period,
//             data: { balance, expenses, cats, aggregates: aggregatesWithPercent, total, segments }
//           };
//         })
//       );
  
//       const newCache = results.reduce((acc, { period, data }) => ({ ...acc, [period]: data }), {});
//       setCache(prev => ({ ...prev, ...newCache }));
  
//       applyData(newCache[selectedPeriod] || results.find(r => r.period === selectedPeriod)?.data);
  
//     } catch (err) {
//       console.error('Error preloading periods:', err);
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const onRefresh = () => preloadAllPeriods(true);



//   return (
//     <SafeAreaProvider>
//       <SafeAreaView className="flex-1 bg-backgroundDark">
//         <StatusBar barStyle="light-content" className="bg-backgroundDark" />

//         {loading ? (
//           <View className="flex-1 justify-center items-center">
//             <ActivityIndicator size="large" color="#00BFFF" />
//           </View>
//         ) : (
//           <ScrollView
//             contentContainerStyle={{ paddingBottom: 32 }}
//             refreshControl={
//               <RefreshControl refreshing={loading} onRefresh={onRefresh} />
//             }
//           >
//             {/* <HeaderSection totalBalance={totalBalance} totalExpenses={totalExpenses} /> */}
//             {/* <BudgetProgressBar percent={budget.percentUsed} target={budget.target} /> */}
//             <SpendingCircleChart segments={chartSegments} total={chartTotal} />
//             <TimePeriodToggles selected={selectedPeriod} onSelect={setSelectedPeriod} />
//             <View className="mt-2 mx-2">
//               {categories
//                 .filter(cat => {
//                   const agg = categoriesAggregated.find(c => c.category_name === cat.category_name);
//                   return agg && agg.total_amount > 0;
//                 })
//                 .sort((a, b) => {
//                   const aggA = categoriesAggregated.find(c => c.category_name === a.category_name)?.total_amount || 0;
//                   const aggB = categoriesAggregated.find(c => c.category_name === b.category_name)?.total_amount || 0;
//                   return aggB - aggA;
//                 })
//                 .map(cat => {
//                   const agg = categoriesAggregated.find(c => c.category_name === cat.category_name);
//                   return (
//                       <ExpenseCategoryCard
//                         key={cat.id}
//                         name={cat.category_name as string}
//                         icon={cat.icon}
//                         color={cat.color}
//                         amount={agg?.total_amount || 0}
//                         percent={agg ? Number(agg.percent.toPrecision(3)) : 0}
//                         onPress={onCategoryPress}
//                       />
//                   );
//                 })}
//             </View>
//             <View style={{ height: 24 }} />
//           </ScrollView>
//         )}
//       </SafeAreaView>
//     </SafeAreaProvider>
//   );
// };

// export default Dashboard;


import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle, useFont } from '@shopify/react-native-skia';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SharedValue, useAnimatedReaction, runOnJS } from 'react-native-reanimated';

const screenWidth = Dimensions.get('window').width;


// Unified data type for all timeframes
type ChartDataPoint = {
  label: string;
  amount: number;
  x: number;
};

const weekData: ChartDataPoint[] = [
  { label: 'Mon', amount: 145, x: 0 },
  { label: 'Tue', amount: 210, x: 1 },
  { label: 'Wed', amount: 180, x: 2 },
  { label: 'Thu', amount: 165, x: 3 },
  { label: 'Fri', amount: 220, x: 4 },
  { label: 'Sat', amount: 195, x: 5 },
  { label: 'Sun', amount: 175, x: 6 },
];

const monthData: ChartDataPoint[] = [
  { label: 'W1', amount: 1050, x: 0 },
  { label: 'W2', amount: 980, x: 1 },
  { label: 'W3', amount: 1150, x: 2 },
  { label: 'W4', amount: 1220, x: 3 },
];

const yearData: ChartDataPoint[] = [
  { label: 'Jan', amount: 4200, x: 0 },
  { label: 'Feb', amount: 3800, x: 1 },
  { label: 'Mar', amount: 4500, x: 2 },
  { label: 'Apr', amount: 4100, x: 3 },
  { label: 'May', amount: 4800, x: 4 },
  { label: 'Jun', amount: 5200, x: 5 },
  { label: 'Jul', amount: 4900, x: 6 },
  { label: 'Aug', amount: 5100, x: 7 },
  { label: 'Sep', amount: 4700, x: 8 },
  { label: 'Oct', amount: 5300, x: 9 },
  { label: 'Nov', amount: 4950, x: 10 },
  { label: 'Dec', amount: 5400, x: 11 },
];

const categoryData = [
  { name: 'Food', value: 1200, color: '#6366f1' },
  { name: 'Transport', value: 450, color: '#8b5cf6' },
  { name: 'Shopping', value: 890, color: '#ec4899' },
  { name: 'Bills', value: 1500, color: '#f59e0b' },
  { name: 'Other', value: 360, color: '#10b981' },
];

const recentTransactions = [
  { id: 1, name: 'Grocery Store', amount: -85.50, category: 'Food', date: 'Today' },
  { id: 2, name: 'Salary', amount: 3500, category: 'Income', date: 'Yesterday' },
  { id: 3, name: 'Coffee Shop', amount: -12.30, category: 'Food', date: '2 days ago' },
  { id: 4, name: 'Electric Bill', amount: -125, category: 'Bills', date: '3 days ago' },
];

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
      {/* Tooltip circle */}
      <Circle cx={x} cy={y} r={8} color="#6366f1" opacity={0.8} />
      <Circle cx={x} cy={y} r={4} color="#fff" />
    </>
  );
}

export default function Dashboard() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const [tooltipData, setTooltipData] = useState({ label: '', value: 0 });
  const interFont = useFont(
    require("../../assets/fonts/InterVariable.ttf"),
    12
  );
  
  const totalBalance = 12450.75;
  const income = 5200;
  const expenses = 4400;

  const getChartData = (): ChartDataPoint[] => {
    switch (timeFrame) {
      case 'week':
        return weekData;
      case 'month':
        return monthData;
      case 'year':
        return yearData;
    }
  };

  const chartData = getChartData();
  
  // Chart press state for tooltip
  const { state, isActive } = useChartPressState({
    x: 0,
    y: { amount: 0 }
  });

  const getLabelStep = (count: number) => {
    if (count <= 6) return 1;
    if (count <= 12) return 2;
    return 3;
  };

  // Update tooltip data when press state changes
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
    const total = categoryData.reduce((sum, item) => sum + item.value, 0);
    const size = 140;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    
    let accumulatedAngle = 0;

    return (
      <View className="w-[120px] h-[120px] items-center justify-center">
        <Svg width={size} height={size}>
          {categoryData.map((item, index) => {
            const percentage = item.value / total;
            const circumference = 2 * Math.PI * radius;
            const arcLength = percentage * circumference;
            const gapSize = 3;
            
            const startAngle = accumulatedAngle - 90;
            const angle = percentage * 360;
            
            const segment = (
              <SvgCircle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${arcLength - gapSize} ${circumference - arcLength + gapSize}`}
                strokeDashoffset={-accumulatedAngle * (circumference / 360)}
                strokeLinecap="butt"
              />
            );
            
            accumulatedAngle += angle;
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

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 bg-slate-950">
        <View className="p-2">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-slate-400 text-sm mb-2">Total Balance</Text>
            <Text className="text-white text-4xl font-bold">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Income/Expense Cards */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-emerald-500 rounded-2xl p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <TrendingUp color="#fff" size={16} />
                <Text className="text-white text-xs opacity-90">Income</Text>
              </View>
              <Text className="text-white text-2xl font-bold">${income.toLocaleString()}</Text>
            </View>
            <View className="flex-1 bg-rose-500 rounded-2xl p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <TrendingDown color="#fff" size={16} />
                <Text className="text-white text-xs opacity-90">Expenses</Text>
              </View>
              <Text className="text-white text-2xl font-bold">${expenses.toLocaleString()}</Text>
            </View>
          </View>

          {/* Time Frame Selector */}
          <View className="flex-row gap-2 mb-6">
            <TouchableOpacity
              onPress={() => setTimeFrame('week')}
              className={`flex-1 py-3 rounded-xl ${
                timeFrame === 'week' ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <Text className={`text-center text-sm ${
                timeFrame === 'week' ? 'text-white' : 'text-slate-400'
              }`}>
                Past Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTimeFrame('month')}
              className={`flex-1 py-3 rounded-xl ${
                timeFrame === 'month' ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <Text className={`text-center text-sm ${
                timeFrame === 'month' ? 'text-white' : 'text-slate-400'
              }`}>
                Past Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTimeFrame('year')}
              className={`flex-1 py-3 rounded-xl ${
                timeFrame === 'year' ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <Text className={`text-center text-sm ${
                timeFrame === 'year' ? 'text-white' : 'text-slate-400'
              }`}>
                Past Year
              </Text>
            </TouchableOpacity>
          </View>

          {/* Spending Chart */}
          <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-6">
            <Text className="text-white text-base font-semibold mb-5">Spending Trend</Text>
            
            {/* Tooltip display above chart */}
            {isActive && (
            <View
              className="absolute top-3 left-0 right-0 items-center z-10 "
              pointerEvents="none"
            >
              <View className="bg-indigo-600 px-3 py-2 rounded-lg">
                <Text className="text-white text-xs font-semibold">
                  {tooltipData.label}: ${tooltipData.value}
                </Text>
              </View>
            </View>
          )}

            
            <View className="h-[250px] -ml-2">
              
              <CartesianChart
                data={chartData}
                xKey="x"
                yKeys={["amount"]}
                padding={10}
                domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
                xAxis={{
                  font: interFont,
                  tickCount: chartData.length,
                  labelOffset: -8,
                  labelColor: "#94a3b8",
                  formatXLabel: (value) => {
                    const index = Math.round(value);
              
                    if (index % getLabelStep(chartData.length) !== 0) {
                      return "";
                    }
              
                    return chartData[index]?.label ?? "";
                  },
                }}
                yAxis={[{
                  font: interFont,
                  tickCount: 5,
                  labelOffset: -8,
                  labelColor: "#94a3b8",
                  formatYLabel: (value) => `$${Math.round(value)}`,
                }]}
                chartPressState={state}
              >
                {({ points, chartBounds }) => (
                  <>
                    <Line
                      points={points.amount}
                      color="#6366f1"
                      strokeWidth={3}
                      curveType="catmullRom"
                    />
                    {isActive && (
                      <ToolTip
                        x={state.x.position}
                        y={state.y.amount.position}
                      />
                    )}
                  </>
                )}
              </CartesianChart>
            </View>
          </View>

          <View className="bg-slate-900 rounded-2xl p-5 border border-slate-800 mb-6">
            <Text className="text-white text-base font-semibold mb-4">Spending by Category</Text>
            <View className="flex-row items-center justify-between">
              <DonutChart />
              <View className="flex-1 pl-10 gap-2.5">
                {categoryData.map((category, index) => (
                  <View key={index} className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <View 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <Text className="text-slate-400 text-xs">{category.name}</Text>
                    </View>
                    <Text className="text-white text-xs">${category.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}