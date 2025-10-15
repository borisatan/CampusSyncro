import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

interface ExpenseCategoryCardProps {
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
  onPress?: (category_name: string) => void; 
}

const ExpenseCategoryCard: React.FC<ExpenseCategoryCardProps> = ({ name, icon, color, amount, percent, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.93, friction: 3, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };
  
  
  return (
    <Pressable
      onPress={() => onPress && onPress(name)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="my-1 mx-1.5"
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View className="flex-row items-center rounded-2xl p-3 shadow-lg bg-surfaceDark">
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
      </Animated.View>
    </Pressable>
  );
};

export default ExpenseCategoryCard;
