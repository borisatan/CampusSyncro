import { Edit2 } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface IncomeCardProps {
  income: number;
  allocatedPercentage: number;
  currencySymbol: string;
  onEditPress: () => void;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const IncomeCard: React.FC<IncomeCardProps> = ({
  income,
  allocatedPercentage,
  currencySymbol,
  onEditPress,
}) => {
  const clampedPercentage = Math.min(allocatedPercentage, 100);

  return (
    <View className="bg-accentPurple rounded-2xl p-5 mb-4">
      {/* Header with edit button */}
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-white/90 text-sm">Total Monthly Income</Text>
        <TouchableOpacity
          onPress={onEditPress}
          className="w-8 h-8 bg-white/20 rounded-lg items-center justify-center"
          activeOpacity={0.7}
        >
          <Edit2 size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Income amount */}
      <Text className="text-white text-3xl font-bold mb-3">
        {formatAmount(income, currencySymbol)}
      </Text>

      {/* Progress bar and percentage */}
      <View className="flex-row items-center gap-3">
        <View className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
          <View
            className="h-full bg-white/50 rounded-full"
            style={{ width: `${clampedPercentage}%` }}
          />
        </View>
        <Text className="text-white/90 text-sm">
          {Math.round(allocatedPercentage)}% allocated
        </Text>
      </View>
    </View>
  );
};
