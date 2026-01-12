import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { BudgetWithSpent } from '../../types/types';
import { BudgetProgressBar } from './BudgetProgressBar';

interface BudgetCardProps {
  budget: BudgetWithSpent;
  currencySymbol: string;
  onPress: () => void;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const getStatusColor = (percentage: number): string => {
  if (percentage >= 100) return '#EF4444'; // Red - over budget
  if (percentage >= 80) return '#F59E0B'; // Yellow/Amber - warning
  return '#FFFFFF'; // White - good
};

const getStatusLabel = (percentage: number): { text: string; color: string } => {
  if (percentage >= 100) return { text: 'Over budget', color: '#EF4444' };
  if (percentage >= 80) return { text: 'Near limit', color: '#F59E0B' };
  return { text: 'On track', color: '#22C55E' };
};

const getPeriodLabel = (periodType: string): string => {
  switch (periodType) {
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'custom': return 'Custom';
    default: return periodType;
  }
};

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  currencySymbol,
  onPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { name, color, spent, limit, percentage_used, categories, amount_type, amount, period_type } = budget;

  
  const spentColor = getStatusColor(-percentage_used);
  const statusInfo = getStatusLabel(-percentage_used);

  const handleExpandPress = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View className="bg-surfaceDark border border-borderDark rounded-2xl overflow-hidden">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="p-4"
      >
        {/* Header: Color indicator + Name + Expand */}
        <View className="flex-row items-center mb-3">
          <View
            className="w-3 h-3 rounded-full mr-3"
            style={{ backgroundColor: color }}
          />
          <Text className="text-white text-lg font-semibold flex-1">
            {name}
          </Text>
          <TouchableOpacity
            onPress={handleExpandPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1"
          >
            {isExpanded ? (
              <ChevronUp size={20} color="#9CA3AF" />
            ) : (
              <ChevronDown size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Amount spent vs limit */}
        <View className="flex-row items-baseline mb-3">
          <Text
            className="text-2xl font-bold"
            style={{ color: spentColor }}
          >
            {formatAmount(spent, currencySymbol)}
          </Text>
          <Text className="text-secondaryDark text-base ml-2">
            of {formatAmount(limit, currencySymbol)} ({getPeriodLabel(period_type).toLowerCase()})
          </Text>
        </View>

        {/* Progress bar */}
        <View className="mb-3">
          <BudgetProgressBar percentage={-percentage_used} color={color} />
        </View>

        {/* Budget details row */}
        <View className="flex-row items-center flex-wrap gap-x-3 gap-y-1">
          <Text className="text-secondaryDark text-xs">
            {amount_type === 'percentage' ? `${amount}% of income` : formatAmount(amount, currencySymbol)}
          </Text>
          <Text className="text-secondaryDark text-xs">|</Text>
          <Text className="text-secondaryDark text-xs">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </Text>
          <Text className="text-secondaryDark text-xs">|</Text>
          <Text className="text-xs" style={{ color: statusInfo.color }}>
            {Math.round(-percentage_used)}% used
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded categories section */}
      {isExpanded && (
        <View className="px-4 pb-4 pt-2 border-t border-borderDark">
          <Text className="text-secondaryDark text-xs mb-2">Included Categories:</Text>
          {categories.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {categories.map((category) => (
                <View
                  key={category.id}
                  className="bg-gray-700/50 rounded-full px-3 py-1.5"
                >
                  <Text className="text-secondaryDark text-xs">
                    {category.category_name}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-secondaryDark text-xs italic">
              No categories assigned
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
