import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
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

  return (
    <SafeAreaView className={isDarkMode ? 'flex-1 bg-[#0A0F1F]' : 'flex-1 bg-white'}>
      <ScrollView className="px-4 py-2">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Ionicons name="menu" size={24} color={isDarkMode ? 'white' : 'black'} />
          <View className="items-center">
            <Text className="text-lg font-bold text-[#0A0F1F] dark:text-white">$32,500.00</Text>
            <Text className="text-xs text-[#4B5563] dark:text-[#F3F4F6]">Total Balance</Text>
          </View>
          <Ionicons name="notifications-outline" size={24} color={isDarkMode ? 'white' : 'black'} />
        </View>

        {/* Buttons */}
        <View className="flex-row justify-between mb-4">
          <View className="flex-1 mr-2 bg-[#F3F4F6] dark:bg-[#4B5563] rounded-full flex-row">
            <TouchableOpacity
              onPress={() => setSelectedTransactionType('expenses')}
              className={`flex-1 py-2 rounded-full ${
                selectedTransactionType === 'expenses' ? 'bg-[#1E3A8A] dark:bg-[#1E40AF]' : ''
              }`}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  selectedTransactionType === 'expenses'
                    ? 'text-white'
                    : 'text-[#0A0F1F] dark:text-[#F3F4F6]'
                }`}
              >
                Expenses
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedTransactionType('income')}
              className={`flex-1 py-2 rounded-full ${
                selectedTransactionType === 'income' ? 'bg-[#1E3A8A] dark:bg-[#1E40AF]' : ''
              }`}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  selectedTransactionType === 'income'
                    ? 'text-white'
                    : 'text-[#0A0F1F] dark:text-[#F3F4F6]'
                }`}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="flex-1 ml-2 bg-[#F3F4F6] dark:bg-[#4B5563] rounded-full py-2">
            <Text className="text-center text-sm text-[#0A0F1F] dark:text-white font-medium">
              June
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pie Chart */}
        <View className="items-center mb-6">
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
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-between mb-6">
          <View className="flex-1 bg-[#F3F4F6] dark:bg-[#4B5563] rounded-2xl p-4 mr-2 items-center">
            <Text className="text-xs text-[#4B5563] dark:text-[#F3F4F6]">Day</Text>
            <Text className="text-lg font-semibold text-[#0A0F1F] dark:text-white">$52</Text>
          </View>
          <View className="flex-1 bg-[#F3F4F6] dark:bg-[#4B5563] rounded-2xl p-4 mx-1 items-center">
            <Text className="text-xs text-[#4B5563] dark:text-[#F3F4F6]">Week</Text>
            <Text className="text-lg font-semibold text-[#0A0F1F] dark:text-white">$403</Text>
          </View>
          <View className="flex-1 bg-[#F3F4F6] dark:bg-[#4B5563] rounded-2xl p-4 ml-2 items-center">
            <Text className="text-xs text-[#4B5563] dark:text-[#F3F4F6]">Month</Text>
            <Text className="text-lg font-semibold text-[#0A0F1F] dark:text-white">$1,612</Text>
          </View>
        </View>

        {/* Spending Breakdown */}
        {dummySpendingData.map((item, index) => (
          <View
            key={index}
            className="flex-row items-center justify-between p-4 mb-3 bg-[#F3F4F6] dark:bg-[#4B5563] rounded-2xl"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full mr-3" style={{ backgroundColor: item.color }} />
              <View>
                <Text className="text-sm font-medium text-[#0A0F1F] dark:text-white">{item.name}</Text>
                <Text className="text-xs text-[#4B5563] dark:text-[#F3F4F6]">Cash</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-sm font-medium text-[#0A0F1F] dark:text-white">
                ${item.amount.toFixed(2)}
              </Text>
              <Text className="text-xs text-[#4B5563] dark:text-[#F3F4F6]">
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
