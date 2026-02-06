import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Goal } from '../../types/types';

interface GoalSelectorProps {
  goals: Goal[];
  selectedGoal: Goal | null;
  onSelect: (goal: Goal | null) => void;
  currencySymbol: string;
}

export function GoalSelector({
  goals,
  selectedGoal,
  onSelect,
  currencySymbol,
}: GoalSelectorProps) {
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getProgressPercent = (goal: Goal) => {
    if (goal.target_amount <= 0) return 0;
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  return (
    <View className="mt-4">
      <Text className="text-sm text-secondaryDark mb-2">Contribute to Goal (optional)</Text>

      <View className="bg-backgroundDark rounded-xl p-2">
        {/* No Goal option */}
        <TouchableOpacity
          onPress={() => onSelect(null)}
          className={`flex-row items-center p-3 rounded-lg mb-1 ${
            selectedGoal === null ? 'bg-surfaceDark' : ''
          }`}
        >
          <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
            selectedGoal === null ? 'bg-accentBlue' : 'bg-gray-700'
          }`}>
            <Ionicons
              name={selectedGoal === null ? 'checkmark' : 'remove'}
              size={16}
              color={selectedGoal === null ? '#fff' : '#94A3B8'}
            />
          </View>
          <Text className="text-textDark flex-1">No specific goal</Text>
        </TouchableOpacity>

        {/* Goal options */}
        {goals.map((goal) => {
          const isSelected = selectedGoal?.id === goal.id;
          const progress = getProgressPercent(goal);
          const remaining = goal.target_amount - goal.current_amount;

          return (
            <TouchableOpacity
              key={goal.id}
              onPress={() => onSelect(goal)}
              className={`p-3 rounded-lg mb-1 ${isSelected ? 'bg-surfaceDark' : ''}`}
            >
              <View className="flex-row items-center">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: isSelected ? goal.color : '#374151' }}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark' : (goal.icon as any) || 'flag-outline'}
                    size={16}
                    color={isSelected ? '#fff' : '#94A3B8'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-textDark font-medium">{goal.name}</Text>
                  <Text className="text-secondaryDark text-xs">
                    {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                    {remaining > 0 && ` · ${formatCurrency(remaining)} to go`}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: goal.color || '#a78bfa'
                  }}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
