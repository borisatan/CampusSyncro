import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface CustomNumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  isDarkMode: boolean;
}

export const CustomNumericKeypad = ({
  onKeyPress,
  onDelete,
  isDarkMode,
}: CustomNumericKeypadProps) => {
  const handlePress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onKeyPress(key);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDelete();
  };

  const renderKey = (key: string, isSpecial = false) => {
    if (key === 'delete') {
      return (
        <TouchableOpacity
          key={key}
          onPress={handleDelete}
          className={`flex-1 h-14 mx-1 rounded-xl items-center justify-center ${
            isDarkMode ? 'bg-surfaceDark' : 'bg-gray-100'
          }`}
        >
          <Ionicons
            name="backspace-outline"
            size={24}
            color={isDarkMode ? '#E2E8F0' : '#1F2937'}
          />
        </TouchableOpacity>
      );
    }

    if (key === 'empty') {
      return <View key={`empty-${Math.random()}`} className="flex-1 h-14 mx-1" />;
    }

    return (
      <TouchableOpacity
        key={key}
        onPress={() => handlePress(key)}
        className={`flex-1 h-14 mx-1 rounded-xl items-center justify-center ${
          isDarkMode ? 'bg-surfaceDark' : 'bg-gray-100'
        }`}
      >
        <Text
          className={`text-2xl font-medium ${
            isDarkMode ? 'text-textDark' : 'text-textLight'
          }`}
        >
          {key}
        </Text>
      </TouchableOpacity>
    );
  };

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'delete'],
  ];

  return (
    <View className="px-2">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row mb-2">
          {row.map((key) => renderKey(key))}
        </View>
      ))}
    </View>
  );
};
