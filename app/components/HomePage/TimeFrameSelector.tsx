import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type TimeFrame = 'week' | 'month' | 'year';

interface TimeFrameSelectorProps {
  selected: TimeFrame;
  onChange: (period: TimeFrame) => void;
}

export const TimeFrameSelector = ({ selected, onChange }: TimeFrameSelectorProps) => {
  const options: { label: string; value: TimeFrame }[] = [
    { label: 'Weekly', value: 'week' },
    { label: 'Monthly', value: 'month' },
    { label: 'Yearly', value: 'year' },
  ];

  return (
    <View className="flex-row gap-2 mb-6">
      {options.map((option) => {
        const isActive = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`flex-1 py-3 rounded-2xl border border-borderDark ${
              isActive ? 'bg-accentBlue' : 'bg-surfaceDark'
            }`}
          >
            <Text className={`text-center text-md font-medium ${
              isActive ? 'text-textDark' : 'text-secondaryDark'
            }`}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};