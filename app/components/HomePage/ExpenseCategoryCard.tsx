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
    <View className="flex-row items-center rounded-2xl p-3 my-1 mx-1.5 shadow-lg bg-surfaceDark">
    <View
      className="w-12 h-12 rounded-full items-center justify-center mr-4"
      style={{ backgroundColor: color }}
    >
      <Ionicons name={icon as any} size={28} color="#fff" />
    </View>

    <View className="flex-1">
      <Text className="text-white text-lg font-semibold">{name}</Text>
    </View>

    <View className="items-end">
      <Text className="text-white text-lg font-bold">
        {amount.toLocaleString(undefined, { minimumFractionDigits: 0 })} €
      </Text>
      <Text className="text-accentPurple text-lg mt-1 font-medium">{percent}%</Text>
    </View>
  </View>

  );
};

export default ExpenseCategoryCard; 