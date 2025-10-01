import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderSectionProps {
  totalBalance: number;
  totalExpenses: number;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ totalBalance, totalExpenses }) => {
  return (
    <View className="bg-backgroundDark pb-4 rounded-b-3xl">
      <SafeAreaView edges={['top']} className="px-4">
        {/* Balance Cards */}
        <View className="flex-row justify-between mt-2">
          <View className="flex-1 bg-surfaceDark mx-1 rounded-2xl p-5 items-center shadow-md">
            <Text className="text-white text-base mb-1 opacity-80">Total Balance</Text>
            <Text className="text-white text-2xl font-bold tracking-wider">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View className="flex-1 bg-surfaceDark mx-1 rounded-2xl p-5 items-center shadow-md">
            <Text className="text-white text-base mb-1 opacity-80">Total Expenses</Text>
            <Text className="text-white text-2xl font-bold tracking-wider opacity-85">-${Math.abs(totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default HeaderSection; 