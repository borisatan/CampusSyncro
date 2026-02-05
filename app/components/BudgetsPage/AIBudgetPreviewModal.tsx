/**
 * AI Budget Preview Modal
 *
 * Displays AI-generated budget allocations for user review before applying.
 * Shows categories grouped by classification (needs/wants/savings) with the 50/30/20 breakdown.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '../../context/ThemeContext';
import { BudgetAllocation, BudgetClassification } from '../../services/budgetAIService';
import { Category } from '../../types/types';

interface AIBudgetPreviewModalProps {
  visible: boolean;
  isLoading: boolean;
  error: string | null;
  allocations: BudgetAllocation[] | null;
  categories: Category[];
  monthlyIncome: number;
  currencySymbol: string;
  fromCache?: boolean;
  onApply: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

const formatCurrency = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const CLASSIFICATION_CONFIG: Record<
  BudgetClassification,
  { label: string; color: string; bgColor: string; darkBgColor: string }
> = {
  needs: {
    label: 'Needs',
    color: '#22C55E',
    bgColor: 'bg-green-100',
    darkBgColor: 'bg-green-900/30',
  },
  wants: {
    label: 'Wants',
    color: '#3B82F6',
    bgColor: 'bg-blue-100',
    darkBgColor: 'bg-blue-900/30',
  },
  savings: {
    label: 'Savings',
    color: '#A855F7',
    bgColor: 'bg-purple-100',
    darkBgColor: 'bg-purple-900/30',
  },
};

export const AIBudgetPreviewModal: React.FC<AIBudgetPreviewModalProps> = ({
  visible,
  isLoading,
  error,
  allocations,
  categories,
  monthlyIncome,
  currencySymbol,
  fromCache,
  onApply,
  onCancel,
  onRetry,
}) => {
  const { isDarkMode } = useTheme();

  const textPrimary = isDarkMode ? 'text-white' : 'text-black';
  const textSecondary = isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight';

  // Group allocations by classification
  const groupedAllocations = React.useMemo(() => {
    if (!allocations) return null;

    const groups: Record<BudgetClassification, BudgetAllocation[]> = {
      needs: [],
      wants: [],
      savings: [],
    };

    allocations.forEach((alloc) => {
      groups[alloc.classification].push(alloc);
    });

    return groups;
  }, [allocations]);

  // Calculate totals
  const totals = React.useMemo(() => {
    if (!allocations) return { needs: 0, wants: 0, savings: 0 };

    return {
      needs: allocations
        .filter((a) => a.classification === 'needs')
        .reduce((sum, a) => sum + a.percentage, 0),
      wants: allocations
        .filter((a) => a.classification === 'wants')
        .reduce((sum, a) => sum + a.percentage, 0),
      savings: allocations
        .filter((a) => a.classification === 'savings')
        .reduce((sum, a) => sum + a.percentage, 0),
    };
  }, [allocations]);

  // Get category icon and color
  const getCategoryInfo = (categoryName: string) => {
    const category = categories.find(
      (c) => c.category_name.toLowerCase() === categoryName.toLowerCase()
    );
    return {
      icon: category?.icon ?? 'ellipse',
      color: category?.color ?? '#6B7280',
    };
  };

  const renderLoadingState = () => (
    <View className="items-center justify-center py-12">
      <ActivityIndicator size="large" color="#FACC15" />
      <Text className={`text-lg mt-4 ${textPrimary}`}>Analyzing your categories...</Text>
      <Text className={`text-sm mt-2 ${textSecondary}`}>
        This may take a few seconds
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View className="items-center justify-center py-12">
      <View
        className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
          isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
        }`}
      >
        <Ionicons name="alert-circle" size={32} color="#EF4444" />
      </View>
      <Text className={`text-lg font-semibold mb-2 ${textPrimary}`}>
        Unable to generate budget
      </Text>
      <Text className={`text-sm text-center mb-6 px-4 ${textSecondary}`}>{error}</Text>
      <TouchableOpacity
        onPress={onRetry}
        className="rounded-xl py-3 px-8"
        style={{ backgroundColor: '#FACC15' }}
      >
        <Text className="text-black font-bold text-base">Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSummaryPills = () => (
    <View className="flex-row justify-center mb-4 gap-2">
      {(['needs', 'wants', 'savings'] as BudgetClassification[]).map((classification) => {
        const config = CLASSIFICATION_CONFIG[classification];
        const percentage = totals[classification];
        return (
          <View
            key={classification}
            className={`px-4 py-2 rounded-full ${isDarkMode ? config.darkBgColor : config.bgColor}`}
          >
            <Text className="text-center font-bold" style={{ color: config.color }}>
              {percentage}%
            </Text>
            <Text className={`text-center text-xs ${textSecondary}`}>{config.label}</Text>
          </View>
        );
      })}
    </View>
  );

  const renderCategoryRow = (alloc: BudgetAllocation) => {
    const { icon, color } = getCategoryInfo(alloc.categoryName);
    return (
      <View
        key={alloc.categoryId}
        className={`flex-row items-center py-3 px-3 rounded-xl mb-2 ${
          isDarkMode ? 'bg-backgroundDark' : 'bg-gray-50'
        }`}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={color} />
        </View>
        <View className="flex-1">
          <Text className={`font-medium ${textPrimary}`}>{alloc.categoryName}</Text>
        </View>
        <View className="items-end">
          <Text className={`font-bold ${textPrimary}`}>{alloc.percentage}%</Text>
          <Text className={`text-xs ${textSecondary}`}>
            {formatCurrency(alloc.amount, currencySymbol)}
          </Text>
        </View>
      </View>
    );
  };

  const renderSection = (classification: BudgetClassification) => {
    const config = CLASSIFICATION_CONFIG[classification];
    const items = groupedAllocations?.[classification] ?? [];

    if (items.length === 0) return null;

    return (
      <View key={classification} className="mb-4">
        <View className="flex-row items-center mb-2">
          <View
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: config.color }}
          />
          <Text className={`font-semibold ${textPrimary}`}>{config.label}</Text>
          <Text className={`ml-2 ${textSecondary}`}>
            ({items.reduce((sum, a) => sum + a.percentage, 0)}%)
          </Text>
        </View>
        {items.map(renderCategoryRow)}
      </View>
    );
  };

  const renderSuccessState = () => (
    <>
      <Text className={`text-2xl font-bold text-center mb-2 ${textPrimary}`}>
        Your AI Budget
      </Text>
      <Text className={`text-center mb-4 ${textSecondary}`}>
        Based on the 50/30/20 rule
        {fromCache && ' (cached)'}
      </Text>

      {renderSummaryPills()}

      <View
        className={`rounded-xl p-3 mb-4 ${isDarkMode ? 'bg-backgroundDark' : 'bg-gray-100'}`}
      >
        <Text className={`text-center ${textSecondary}`}>
          Monthly Income:{' '}
          <Text className={`font-bold ${textPrimary}`}>
            {formatCurrency(monthlyIncome, currencySymbol)}
          </Text>
        </Text>
      </View>

      <ScrollView
        style={{ maxHeight: 300 }}
        showsVerticalScrollIndicator={false}
        className="mb-4"
      >
        {renderSection('needs')}
        {renderSection('wants')}
        {renderSection('savings')}
      </ScrollView>

      <TouchableOpacity
        onPress={onApply}
        className="rounded-xl py-3 items-center"
        style={{ backgroundColor: '#FACC15' }}
      >
        <Text className="text-black font-bold text-base">Apply Budget</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <View
          className={`mx-6 rounded-2xl p-6 w-11/12 max-w-md ${
            isDarkMode ? 'bg-surfaceDark border border-borderDark' : 'bg-white'
          }`}
        >
          {isLoading && renderLoadingState()}
          {!isLoading && error && renderErrorState()}
          {!isLoading && !error && allocations && renderSuccessState()}

          {/* Cancel button - always visible unless loading */}
          {!isLoading && (
            <TouchableOpacity
              onPress={onCancel}
              className={`mt-3 rounded-xl py-3 items-center border ${
                isDarkMode ? 'border-borderDark' : 'border-gray-300'
              }`}
            >
              <Text className={`text-base font-semibold ${textSecondary}`}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};
