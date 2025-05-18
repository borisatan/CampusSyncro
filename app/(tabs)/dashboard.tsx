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
            animateToNumber={32500}
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
        data={dummySpendingData.map((item) => ({
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
            animateToNumber={52}
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
            animateToNumber={403}
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
            animateToNumber={1674}
            fontStyle={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkMode ? '#FFFFFF' : '#212121',
            }}
          />
        </View>
      </View>
  
      {/* Spending Breakdown */}
      {dummySpendingData.map((item, index) => (
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
              {Math.round((item.amount / 1550) * 100)}%
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  </SafeAreaView>
  
  );
};

export default HomeScreen;
