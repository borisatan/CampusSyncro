import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SummaryProps {
  totalBalance: number;
}

export const DashboardSummary = ({ totalBalance }: SummaryProps) => {
  const formattedBalance = totalBalance.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });

  return (
        <View className=" flex-col  mb-2">
            <View className="flex-1  rounded-2xl p-2 shadow-sm mb-3">
                <Text className="text-textDark text-xl font-medium opacity-90 mb-2">Total Balance</Text>
                <Text className="text-textDark text-5xl font-bold">€{formattedBalance}</Text>
            </View>
        <View className="flex-row gap-4 mb-3">
        <View className="flex-1 bg-accentTeal rounded-2xl p-4 shadow-sm border border-borderDark">
            <View className="flex-row items-center gap-2 mb-2">
            <TrendingUp color="#fff" size={16} />
            <Text className="text-textDark text-lg font-medium opacity-90">Balance</Text>
            </View>
            <Text className="text-textDark text-3xl font-bold">€{formattedBalance}</Text>
        </View>

        <View className="flex-1 bg-accentRed rounded-2xl p-4 shadow-sm border border-borderDark">
            <View className="flex-row items-center gap-2 mb-2">
            <TrendingDown color="#fff" size={16} />
            <Text className="text-textDark text-lg font-medium opacity-90">Expenses</Text>
            </View>
            <Text className="text-textDark text-3xl font-bold">€{formattedBalance}</Text>
        </View>
        </View>
    </View>
  );
};