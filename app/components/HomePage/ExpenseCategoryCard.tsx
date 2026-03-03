import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Text, View } from 'react-native';

import { RipplePressable } from '../Shared/RipplePressable';

interface ExpenseCategoryCardProps {
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
  currency: string;
  onPress?: (category_name: string) => void;
}

const ExpenseCategoryCard: React.FC<ExpenseCategoryCardProps> = ({ name, icon, color, amount, percent, currency, onPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress && onPress(name);
  };

  return (
    <RipplePressable
      onPress={handlePress}
      className="mb-2 rounded-2xl overflow-hidden"
      rippleColor="rgba(255, 255, 255, 0.2)"
    >
      <View className="flex-row items-center p-4 shadow-lg bg-surfaceDark border border-borderDark rounded-2xl">
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: color }}
          >
            <Ionicons name={icon as any} size={24} color="#fff" />
          </View>

          <View className="flex-1">
            <Text className="text-white text-lg">{name}</Text>
          </View>

          <View className="items-end">
            <Text className="text-white text-lg font-bold">
              {currency}{amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </Text>
            <Text className="text-white text-lg mt-1 font-medium">{percent}%</Text>
          </View>
        </View>
    </RipplePressable>
  );
};

export default ExpenseCategoryCard;
