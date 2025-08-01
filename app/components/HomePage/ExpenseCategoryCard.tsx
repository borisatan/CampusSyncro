import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface ExpenseCategoryCardProps {
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
}

const ExpenseCategoryCard: React.FC<ExpenseCategoryCardProps> = ({ name, icon, color, amount, percent }) => {
  return (
    <View className="flex-row items-center rounded-2xl p-4 my-1 mx-0.5 shadow-md bg-[#3B1C5A]">
      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: color }}>
        <Ionicons name={icon as any} size={22} color="#fff" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-base font-semibold">{name}</Text>
      </View>
      <View className="items-end">
        <Text className="text-white text-base font-bold">-${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        <Text className="text-[#B2A4FF] text-xs mt-0.5 font-medium">{percent}%</Text>
      </View>
    </View>
  );
};

export default ExpenseCategoryCard; 