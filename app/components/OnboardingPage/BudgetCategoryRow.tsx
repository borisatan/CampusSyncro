import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, View } from 'react-native';

interface BudgetCategoryRowProps {
  name: string;
  icon: string;
  color: string;
  amount: string;
  currencySymbol: string;
  onAmountChange: (value: string) => void;
}

export default function BudgetCategoryRow({
  name,
  icon,
  color,
  amount,
  currencySymbol,
  onAmountChange,
}: BudgetCategoryRowProps) {
  return (
    <View className="flex-row items-center py-3 px-4 bg-surfaceDark rounded-xl mb-3 border border-borderDark">
      {/* Icon Circle */}
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <Ionicons name={icon as any} size={20} color="#FFFFFF" />
      </View>

      {/* Name */}
      <Text className="flex-1 text-textDark text-base font-medium ml-3" numberOfLines={1}>
        {name}
      </Text>

      {/* Amount Input */}
      <View className="flex-row items-center">
        <Text className="text-secondaryDark text-base">{currencySymbol}</Text>
        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#6B7280"
          className="text-textDark text-base w-16 text-right"
        />
      </View>
    </View>
  );
}
