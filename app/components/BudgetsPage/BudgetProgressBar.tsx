import React from 'react';
import { View } from 'react-native';

interface BudgetProgressBarProps {
  percentage: number;
  color: string;
}

const getStatusColor = (percentage: number): string => {
  if (percentage > 95) return '#EF4444'; // Red
  if (percentage >= 80) return '#F59E0B'; // Yellow/Amber
  return '#22C55E'; // Green
};

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  percentage,
  color,
}) => {
  const statusColor = getStatusColor(percentage);
  // Cap visual display at 100% but allow overflow indicator
  const displayPercentage = Math.min(percentage, 100);
  const isOverBudget = percentage > 100;

  return (
    <View className="h-3 bg-gray-700 rounded-full overflow-hidden relative">
      {/* Main progress bar */}
      <View
        className="h-full rounded-full"
        style={{
          width: `${displayPercentage}%`,
          backgroundColor: statusColor,
        }}
      />
      {/* Overflow indicator - subtle stripe pattern at end */}
      {isOverBudget && (
        <View
          className="absolute right-0 top-0 bottom-0 w-2"
          style={{ backgroundColor: '#EF4444' }}
        />
      )}
    </View>
  );
};
