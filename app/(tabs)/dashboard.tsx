import React, { useState } from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import BottomNavigation from '../components/HomePage/BottomNavigation';
import BudgetProgressBar from '../components/HomePage/BudgetProgressBar';
import ExpenseCategoryCard from '../components/HomePage/ExpenseCategoryCard';
import HeaderSection from '../components/HomePage/HeaderSection';
import SpendingCircleChart from '../components/HomePage/SpendingCircleChart';
import TimePeriodToggles from '../components/HomePage/TimePeriodToggles';
import { Category, ChartSegment } from '../types/types';

// Mock Data
const totalBalance = 7783.0;
const totalExpenses = 1187.4;
const budget = {
  target: 20000,
  spent: 6000,
  projectedStatus: 'Under Budget',
  percentUsed: 30,
};
const chartSegments: ChartSegment[] = [
  { key: 'teal', value: 83294 * 0.49, color: '#36D1C4' },
  { key: 'yellow', value: 83294 * 0.25, color: '#FFD166' },
  { key: 'gray', value: 83294 * 0.14, color: '#E0E0E0' },
];
const chartTotal = 83294;
const now = new Date();
const categories: Category[] = [
  { id: '1', name: 'Groceries', icon: 'ios-cart', color: '#36D1C4', amount: 300, percent: 25, createdAt: now, updatedAt: now },
  { id: '2', name: 'Groceries', icon: 'cube', color: '#FFD166', amount: 100, percent: 14, createdAt: now, updatedAt: now },
  { id: '3', name: 'Rent', icon: 'cash', color: '#B2A4FF', amount: 674.4, percent: 49, createdAt: now, updatedAt: now },
];

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
  const [selectedTab, setSelectedTab] = useState('Home');

  return (
    <View className="flex-1 bg-[#23235B]">
      <StatusBar barStyle="light-content" backgroundColor="#23235B" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <HeaderSection totalBalance={totalBalance} totalExpenses={totalExpenses} />
        <BudgetProgressBar percent={budget.percentUsed} target={budget.target} projectedStatus={budget.projectedStatus} />
        <SpendingCircleChart segments={chartSegments} total={chartTotal} />
        <TimePeriodToggles selected={selectedPeriod} onSelect={setSelectedPeriod} />
        <View className="mt-2 mx-2">
          {categories.map((cat) => (
            <ExpenseCategoryCard
              key={cat.id}
              name={cat.name}
              icon={cat.icon}r
              color={cat.color}
              amount={cat.amount}
              percent={cat.percent}
            />
          ))}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
      <BottomNavigation selected={selectedTab} onSelect={setSelectedTab} />
    </View>
  );
};

export default Dashboard;
