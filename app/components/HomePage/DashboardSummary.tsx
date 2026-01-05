import { TrendingDown, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface SummaryProps {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  currencySymbol: string;
}

export const DashboardSummary = ({ totalBalance, totalIncome, totalExpenses, currencySymbol }: SummaryProps) => {
  const formattedBalance = totalBalance.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
  const formattedIncome = totalIncome.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  const formattedExpenses = totalExpenses.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });


  return (
        <View className=" flex-col  mb-2">
            <View className="flex-1  rounded-2xl p-2 shadow-sm mb-3">
                <Text className="text-textDark text-xl font-medium opacity-90 mb-2">Total Balance</Text>
                <Text className="text-textDark text-5xl font-bold">{currencySymbol}{formattedBalance}</Text>
            </View>
        <View className="flex-row gap-4 mb-3">
        <View className="flex-1 bg-accentTeal rounded-2xl p-4 shadow-sm border border-borderDark">
            <View className="flex-row items-center gap-2 mb-2">
            <TrendingUp color="#fff" size={16} />
            <Text className="text-textDark text-lg font-medium opacity-90">Income</Text>
            </View>
            <Text className="text-textDark text-3xl font-bold">{currencySymbol}{formattedIncome}</Text>
        </View>

        <View className="flex-1 bg-accentRed rounded-2xl p-4 shadow-sm border border-borderDark">
            <View className="flex-row items-center gap-2 mb-2">
            <TrendingDown color="#fff" size={16} />
            <Text className="text-textDark text-lg font-medium opacity-90">Expenses</Text>
            </View>
            <Text className="text-textDark text-3xl font-bold">{currencySymbol}{-formattedExpenses}</Text>
        </View>
        </View>
    </View>
  );
};