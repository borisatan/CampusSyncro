import * as Haptics from 'expo-haptics';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface QuickAmountButtonsProps {
  amounts: number[];
  onSelect: (amount: number) => void;
  currencySymbol: string;
  isDarkMode: boolean;
}

export const QuickAmountButtons = ({
  amounts,
  onSelect,
  currencySymbol,
  isDarkMode,
}: QuickAmountButtonsProps) => {
  const handlePress = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(amount);
  };

  return (
    <View className="flex-row justify-between px-4 mb-4">
      {amounts.map((amount) => (
        <TouchableOpacity
          key={amount}
          onPress={() => handlePress(amount)}
          className={`px-5 py-3 rounded-xl ${
            isDarkMode ? 'bg-surfaceDark' : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-base font-medium ${
              isDarkMode ? 'text-textDark' : 'text-textLight'
            }`}
          >
            {currencySymbol}{amount}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
