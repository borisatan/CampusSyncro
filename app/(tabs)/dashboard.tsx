import React, { useState } from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import BudgetProgressBar from '../components/HomePage/BudgetProgressBar';
import ExpenseCategoryCard from '../components/HomePage/ExpenseCategoryCard';
import HeaderSection from '../components/HomePage/HeaderSection';
import SpendingCircleChart from '../components/HomePage/SpendingCircleChart';
import TimePeriodToggles from '../components/HomePage/TimePeriodToggles';
import { Category, CategoryAggregation, ChartSegment } from '../types/types';

// Mock Data
const totalBalance = 7783.0;
const totalExpenses = 1187.4;
const budget = {
  target: 20000,
  spent: 6000,
  percentUsed: 30,
};
const chartSegments: ChartSegment[] = [
  { key: 'teal', value: 83294 * 0.49, color: '#36D1C4' },
  { key: 'yellow', value: 83294 * 0.25, color: '#FFD166' },
  { key: 'gray', value: 83294 * 0.14, color: '#E0E0E0' },
];
const chartTotal = 83294;
const now = new Date();
const categoriesAggregated: CategoryAggregation[] = [
  { categoryName: 'Transport', totalAmount: 300, percent: 25},
  { categoryName: 'Groceries', totalAmount: 100, percent: 14},
  { categoryName: 'Rent', totalAmount: 674.4, percent: 49},
];

const categories: Category[] = [
  { id: '1', name: 'Transport', icon: 'bus', color: '#F9C74F' },
  { id: '2', name: 'Groceries', icon: 'restaurant', color: '#F94144' },
  { id: '3', name: 'Rent', icon: 'home', color: '#8338EC' },
];

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
  const [selectedTab, setSelectedTab] = useState('Home');

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
          {categories.map((cat) => (
            <ExpenseCategoryCard
              key={cat.name}
              name={cat.name}
              icon={cat.icon}
              color={cat.color}
              amount={categoriesAggregated.find(c => c.categoryName === cat.name)?.totalAmount || 0}
              percent={categoriesAggregated.find(c => c.categoryName === cat.name)?.percent || 0}
            />
          ))}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Dashboard;
