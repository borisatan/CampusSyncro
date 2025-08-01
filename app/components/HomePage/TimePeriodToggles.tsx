import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface TimePeriodTogglesProps {
  selected: 'Daily' | 'Weekly' | 'Monthly';
  onSelect: (period: 'Daily' | 'Weekly' | 'Monthly') => void;
}

const periods: Array<'Daily' | 'Weekly' | 'Monthly'> = ['Daily', 'Weekly', 'Monthly'];

const TimePeriodToggles: React.FC<TimePeriodTogglesProps> = ({ selected, onSelect }) => {
  return (
    <View className="flex-row justify-center my-3">
      {periods.map((period) => {
        const isActive = selected === period;
        return (
          <TouchableOpacity
            key={period}
            className={`flex-1 mx-1 py-2 rounded-full items-center shadow ${isActive ? 'bg-[#36D1C4]' : 'bg-[#3B1C5A]'}`}
            onPress={() => onSelect(period)}
            activeOpacity={0.8}
          >
            <Text className={`text-base font-semibold ${isActive ? 'text-white' : 'text-[#B2A4FF]'}`}>{period}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TimePeriodToggles; 