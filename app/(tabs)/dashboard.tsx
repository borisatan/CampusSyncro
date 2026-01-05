import { useFont } from '@shopify/react-native-skia';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

// Hooks & Utilities
import { useDataRefresh } from '../context/DataRefreshContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { getUserCurrency } from '../services/backendService';
import { getCurrencySymbol, isValidCurrency, SupportedCurrency } from '../types/types';

export default function Dashboard() {
  const router = useRouter();
  
  // Update state type to allow the fallback string '?'
  const [currency, setCurrency] = useState<string>('$');
  const [isCurrencyLoading, setIsCurrencyLoading] = useState(true);

  const { 
    timeFrame, 
    setTimeFrame, 
    loading: dataLoading, 
    refresh: refreshData,
    totalBalance, 
    totalIncome, 
    totalExpenses, 
    categories, 
    categoriesAggregated, 
    chartData 
  } = useDashboardData('month');

  const { registerDashboardRefresh } = useDataRefresh();

  const validateAndSetCurrency = (fetchedCurrency: any) => {
    
    if (isValidCurrency(fetchedCurrency)) {
      setCurrency(getCurrencySymbol(fetchedCurrency as SupportedCurrency));
    } else {
      setCurrency("");
    }
  };

  useEffect(() => {
    const loadCurrency = async () => {
      const userCurrency = await getUserCurrency();
      validateAndSetCurrency(userCurrency);
      setIsCurrencyLoading(false);
    };
    loadCurrency();
  }, []);

  const refreshAll = async () => {
    setIsCurrencyLoading(true);
    const userCurrency = await getUserCurrency();
    validateAndSetCurrency(userCurrency);
    setIsCurrencyLoading(false);
    refreshData();
  };

  useEffect(() => {
    registerDashboardRefresh(refreshAll);
  }, [refreshData, registerDashboardRefresh]);

  const [tooltipData, setTooltipData] = useState({ label: '', value: 0 });
  const interFont = useFont(require("../../assets/fonts/InterVariable.ttf"), 12);

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

  const isLoading = dataLoading || isCurrencyLoading;

  if (isLoading) {
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
          <RefreshControl refreshing={isLoading} onRefresh={refreshAll} />
        }
      >
        <View className="p-2">
          <DashboardSummary 
            totalBalance={totalBalance} 
            totalIncome={totalIncome} 
            totalExpenses={totalExpenses} 
            currencySymbol={currency} 
          />

          <TimeFrameSelector selected={timeFrame} onChange={setTimeFrame} />

          <SpendingTrendChart 
            data={chartData} 
            timeFrame={timeFrame} 
            font={interFont}
            currencySymbol={currency} 
          />

          <CategoryDonut
            aggregates={categoriesAggregated} 
            categories={categories} 
            timeFrame={timeFrame} 
          />

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