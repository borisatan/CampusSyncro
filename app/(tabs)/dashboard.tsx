import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AnimatedNumbers from 'react-native-animated-numbers';
import { PieChart } from 'react-native-chart-kit';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import DateRangeSelector from '../components/date-selector';
import { useTheme } from '../context/ThemeContext';
import { mockAccounts, mockCategories, mockTransactions } from '../data/mockData';

const screenWidth = Dimensions.get('window').width;

const dummySpendingData = [
  {
    name: 'Shopping',
    amount: 498.5,
    color: '#B2F5EA',
    legendFontColor: '#FFF',
    legendFontSize: 12,
  },
  {
    name: 'Gifts',
    amount: 344.45,
    color: '#D6BCFA',
    legendFontColor: '#FFF',
    legendFontSize: 12,
  },
  {
    name: 'Food',
    amount: 230.5,
    color: '#FEB2B2',
    legendFontColor: '#FFF',
    legendFontSize: 12,
  },
];

const HomeScreen = () => {
  const { isDarkMode } = useTheme();
  const [selectedTransactionType, setSelectedTransactionType] = React.useState('expenses');

  const chartOpacity = useSharedValue(0);
  const chartScale = useSharedValue(0.8);

  // Debug: Log all transactions
  console.log('All Transactions:', mockTransactions.map(t => ({
    date: t.date,
    amount: t.amount,
    type: t.type
  })));

  // Calculate total balance from accounts
  const totalBalance = mockAccounts.reduce((sum, account) => sum + account.balance, 0);

  // Process transactions for the pie chart
  const spendingData = mockTransactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((acc, transaction) => {
      const category = mockCategories.find(cat => cat.id === transaction.categoryId);
      if (!category) return acc;

      const existingCategory = acc.find(item => item.name === category.name);
      if (existingCategory) {
        existingCategory.amount += transaction.amount;
      } else {
        acc.push({
          name: category.name,
          amount: transaction.amount,
          color: category.color,
          legendFontColor: '#FFF',
          legendFontSize: 12,
        });
      }
      return acc;
    }, [] as typeof dummySpendingData);

  // Calculate daily, weekly, and monthly totals
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Debug: Log date ranges
  console.log('Date Ranges:', {
    now: now.toISOString(),
    dayStart: dayStart.toISOString(),
    weekStart: weekStart.toISOString(),
    monthStart: monthStart.toISOString()
  });

  // Debug: Log transaction dates
  mockTransactions.forEach(t => {
    const transDate = new Date(t.date);
    console.log('Transaction Date Check:', {
      transactionDate: transDate.toISOString(),
      isAfterDayStart: transDate >= dayStart,
      isBeforeNow: transDate <= now,
      amount: t.amount,
      type: t.type
    });
  });

  const dailyTotal = mockTransactions
    .filter(t => {
      const transDate = new Date(t.date);
      const isInRange = t.type === 'expense' && transDate >= dayStart && transDate <= now;
      // Debug: Log filtered transactions
      if (isInRange) {
        console.log('Daily Transaction Match:', {
          date: transDate.toISOString(),
          amount: t.amount,
          type: t.type
        });
      }
      return isInRange;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const weeklyTotal = mockTransactions
    .filter(t => {
      const transDate = new Date(t.date);
      const isInRange = t.type === 'expense' && transDate >= weekStart && transDate <= now;
      // Debug: Log filtered transactions
      if (isInRange) {
        console.log('Weekly Transaction Match:', {
          date: transDate.toISOString(),
          amount: t.amount,
          type: t.type
        });
      }
      return isInRange;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyTotal = mockTransactions
    .filter(t => {
      const transDate = new Date(t.date);
      const isInRange = t.type === 'expense' && transDate >= monthStart && transDate <= now;
      // Debug: Log filtered transactions
      if (isInRange) {
        console.log('Monthly Transaction Match:', {
          date: transDate.toISOString(),
          amount: t.amount,
          type: t.type
        });
      }
      return isInRange;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Debug: Log final totals
  console.log('Final Totals:', {
    dailyTotal,
    weeklyTotal,
    monthlyTotal
  });

  // Calculate total expenses for percentage calculation
  const totalExpenses = spendingData.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    chartOpacity.value = withTiming(1, { duration: 600 });
    chartScale.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedChartStyle = useAnimatedStyle(() => ({
    opacity: chartOpacity.value,
    transform: [{ scale: chartScale.value }],
  }));

  return (
    <SafeAreaView className={isDarkMode ? 'flex-1 bg-[#282A36]' : 'flex-1 bg-[#FAFAFA]'}>
    <ScrollView className="px-4 py-2">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Ionicons name="menu" size={24} color={isDarkMode ? '#FFFFFF' : '#212121'} />
        <View className="items-center">
          <AnimatedNumbers
            includeComma
            animateToNumber={totalBalance}
            fontStyle={{
              fontSize: 18,
              fontWeight: 'bold',
              color: isDarkMode ? '#FFFFFF' : '#212121',
            }}
          />
          <Text className="text-xs text-[#5F6368] dark:text-[#BBBBBB]">Total Balance</Text>
        </View>
        <Ionicons name="notifications-outline" size={24} color={isDarkMode ? '#FFFFFF' : '#212121'} />
      </View>
  
      {/* Buttons */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1 mr-2 bg-[#FFFFFF] dark:bg-[#1E1E1E] rounded-full flex-row">
          <TouchableOpacity
            onPress={() => setSelectedTransactionType('expenses')}
            className={`flex-1 py-2 rounded-full ${
              selectedTransactionType === 'expenses' ? 'bg-[#2A9D8F]' : ''
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                selectedTransactionType === 'expenses'
                  ? 'text-white'
                  : 'text-[#212121] dark:text-[#FFFFFF]'
              }`}
            >
              Expenses
            </Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            onPress={() => setSelectedTransactionType('income')}
            className={`flex-1 py-2 rounded-full ${
              selectedTransactionType === 'income' ? 'bg-[#2A9D8F]' : ''
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                selectedTransactionType === 'income'
                  ? 'text-white'
                  : 'text-[#212121] dark:text-[#FFFFFF]'
              }`}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity className="flex-1 ml-2 bg-[#FFFFFF] dark:bg-[#1E1E1E] rounded-full py-2">
          <DateRangeSelector onDateRangeSelect={(start: string, end: string) => {
            // Handle date range selection here
            console.log('Selected date range:', start, end);
          }} />
        </TouchableOpacity>
      </View>
  
      {/* Pie Chart */}
      <View className="items-center mb-6">
      <Animated.View style={[animatedChartStyle]} className="items-center mb-6">
      <PieChart
        data={spendingData.map((item) => ({
          name: item.name,
          population: item.amount,
          color: item.color,
          legendFontColor: item.legendFontColor,
          legendFontSize: item.legendFontSize,
        }))}
        width={screenWidth - 32}
        height={180}
        chartConfig={{
          color: () => `#000`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="10"
        absolute
      />
    </Animated.View>
      </View>
  
      {/* Stats Row */}
      <View className="flex-row justify-between mb-6">
        <View className="flex-1 bg-[#FFFFFF] dark:bg-[#1E1E1E] rounded-2xl p-4 mr-2 items-center">
          <Text className="text-xs text-[#5F6368] dark:text-[#BBBBBB]">Day</Text>
          <AnimatedNumbers
            includeComma
            animateToNumber={dailyTotal}
            fontStyle={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#FFFFFF' : '#212121',
            }}
          />
        </View>
        <View className="flex-1 bg-[#FFFFFF] dark:bg-[#1E1E1E] rounded-2xl p-4 mx-1 items-center">
          <Text className="text-xs text-[#5F6368] dark:text-[#BBBBBB]">Week</Text>
          <AnimatedNumbers
            includeComma
            animateToNumber={weeklyTotal}
            fontStyle={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#FFFFFF' : '#212121',
            }}
          />
        </View>
        <View className="flex-1 bg-[#FFFFFF] dark:bg-[#1E1E1E] rounded-2xl p-4 ml-2 items-center">
          <Text className="text-xs text-[#5F6368] dark:text-[#BBBBBB]">Month</Text>
          <AnimatedNumbers
            includeComma
            animateToNumber={monthlyTotal}
            fontStyle={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#FFFFFF' : '#212121',
            }}
          />
        </View>
      </View>
  
      {/* Spending Breakdown */}
      {spendingData.map((item, index) => {
        const percentage = totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0;
        
        return (
          <View
            key={index}
            className="flex-row items-center justify-between p-4 mb-3 bg-[#FFFFFF] dark:bg-[#1E1E1E] rounded-2xl"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full mr-3" style={{ backgroundColor: item.color }} />
              <View>
                <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF]">{item.name}</Text>
                <Text className="text-xs text-[#5F6368] dark:text-[#BBBBBB]">Cash</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF]">
                ${item.amount.toFixed(2)}
              </Text>
              <Text className="text-xs text-[#5F6368] dark:text-[#BBBBBB]">
                {percentage}%
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  </SafeAreaView>
  
  );
};

export default HomeScreen;
