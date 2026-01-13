import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { BudgetPeriodType } from '../../types/types';

interface PeriodSelectorProps {
  selectedPeriod: BudgetPeriodType;
  onPeriodSelect: (period: BudgetPeriodType) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDatesChange: (startDate: string, endDate: string) => void;
  isDarkMode?: boolean;
}

const PERIODS: { value: BudgetPeriodType; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodSelect,
  customStartDate,
  customEndDate,
  onCustomDatesChange,
  isDarkMode = true,
}) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const startDate = customStartDate ? new Date(customStartDate) : new Date();
  const endDate = customEndDate ? new Date(customEndDate) : new Date();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Select date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleStartDateChange = (event: any, date?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) {
      onCustomDatesChange(date.toISOString().split('T')[0], customEndDate || '');
    }
  };

  const handleEndDateChange = (event: any, date?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (date) {
      onCustomDatesChange(customStartDate || '', date.toISOString().split('T')[0]);
    }
  };

  return (
    <View className="mb-4">
      <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Period</Text>

      {/* Period toggle */}
      <View className={`${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'} rounded-2xl p-1 flex-row mb-3`}>
        {PERIODS.map((period) => (
          <TouchableOpacity
            key={period.value}
            onPress={() => onPeriodSelect(period.value)}
            className={`flex-1 py-3 rounded-xl ${
              selectedPeriod === period.value
                ? isDarkMode ? 'bg-accentBlue' : 'bg-white'
                : ''
            }`}
          >
            <Text
              className={`text-center ${
                selectedPeriod === period.value
                  ? isDarkMode ? 'text-white' : 'text-gray-900'
                  : isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom date pickers */}
      {selectedPeriod === 'custom' && (
        <View className="gap-3">
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            className={`flex-row items-center rounded-xl px-4 py-3 border ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
            }`}
          >
            <Calendar size={20} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
            <View className="ml-3 flex-1">
              <Text className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Start Date</Text>
              <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatDate(customStartDate)}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            className={`flex-row items-center rounded-xl px-4 py-3 border ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
            }`}
          >
            <Calendar size={20} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
            <View className="ml-3 flex-1">
              <Text className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>End Date (exclusive)</Text>
              <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatDate(customEndDate)}</Text>
            </View>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
              themeVariant="dark"
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndDateChange}
              minimumDate={startDate}
              themeVariant="dark"
            />
          )}
        </View>
      )}
    </View>
  );
};
