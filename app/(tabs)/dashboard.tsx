import { useFont } from '@shopify/react-native-skia';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChartPressState } from 'victory-native';

// Custom Components
import { CategoryBreakdownList } from '../components/HomePage/CategoryBreakdown';
import { CategoryDonut } from '../components/HomePage/CategoryDonut';
import { DashboardSummary } from '../components/HomePage/DashboardSummary';
import { SpendingTrendChart } from '../components/HomePage/SpendingTrendChart';
import { TimeFrameSelector } from '../components/HomePage/TimeFrameSelector';

// Custom Hook
import { useEffect } from 'react';
import { useDataRefresh } from '../context/DataRefreshContext';
import { useDashboardData } from '../hooks/useDashboardData';

export default function Dashboard() {
  const router = useRouter();
  
  // 1. All data, state, and fetching logic now comes from the hook
  const { 
    timeFrame, 
    setTimeFrame, 
    loading, 
    refresh,
    totalBalance, 
    totalIncome, 
    totalExpenses, 
    categories, 
    categoriesAggregated, 
    chartData 
  } = useDashboardData('month');

  const { registerDashboardRefresh } = useDataRefresh();

  // Register refresh function so it can be called from other screens
  useEffect(() => {
    registerDashboardRefresh(refresh);
  }, [refresh, registerDashboardRefresh]);

  const [tooltipData, setTooltipData] = useState({ label: '', value: 0 });
  const interFont = useFont(require("../../assets/fonts/InterVariable.ttf"), 12);

  // 2. Victory Native Chart Interaction logic
  const { state } = useChartPressState({ x: 0, y: { amount: 0 } });

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

  const onCategoryPress = (category_name: string) => {
    router.push({
      pathname: "/transaction-list",
      params: { initialCategory: category_name, t: Date.now().toString() },
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-backgroundDark">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark ">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <View className="p-2">
          {/* 1. Metric Overview */}
          <DashboardSummary 
            totalBalance={totalBalance} 
            totalIncome={totalIncome} 
            totalExpenses={totalExpenses} 
          />

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
            timeFrame={timeFrame} 
          />

          {/* 4. Detailed Breakdown List (Now its own component) */}
          <CategoryBreakdownList 
            categories={categories}
            categoriesAggregated={categoriesAggregated}
            onCategoryPress={onCategoryPress}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}