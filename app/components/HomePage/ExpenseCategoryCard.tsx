import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

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
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, friction: 3, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };
  
  
  return (
    <Pressable
      onPress={() => onPress && onPress(name)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="mb-2 "
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View className="flex-row items-center rounded-2xl p-4 shadow-lg bg-surfaceDark border border-borderDark">
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
      </Animated.View>
    </Pressable>
  );
};

export default ExpenseCategoryCard;
