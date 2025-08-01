import React from 'react';
import { Text, View } from 'react-native';

interface BudgetProgressBarProps {
  percent: number;
  target: number;
  projectedStatus: string;
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ percent, target, projectedStatus }) => {
  return (
    <View className="my-5 px-2">
      <View className="flex-row items-center">
        <Text className="text-[#FF6F91] font-bold text-base w-12">{percent}%</Text>
        <View className="flex-1 h-4 mx-2 justify-center relative">
          <View className="absolute left-0 top-0 h-4 rounded-full z-10" style={{ width: `${percent}%`, backgroundColor: '#FF6F91' }} />
          <View className="bg-[#2D3250] h-4 rounded-full w-full z-0" />
        </View>
        <Text className="text-white font-bold text-base w-28 text-right">${target.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
      </View>
      <Text className="text-[#A0A0B2] text-xs mt-1 ml-1">Projected: {projectedStatus}</Text>
    </View>
  );
};

export default BudgetProgressBar; 