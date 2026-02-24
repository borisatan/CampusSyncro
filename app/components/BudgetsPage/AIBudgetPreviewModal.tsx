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
  visible?: boolean;
  isLoading: boolean;
  isApplying?: boolean;
  error: string | null;
  allocations: BudgetAllocation[] | null;
  categories: Category[];
  monthlyIncome: number;
  spendingBudget: number;
  savingsAmount: number;
  currencySymbol: string;
  fromCache?: boolean;
  onApply: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

const formatCurrency = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const CLASSIFICATION_CONFIG: Record<
  BudgetClassification,
  { label: string; color: string; icon: string }
> = {
  needs: {
    label: 'Needs',
    color: '#3B7EFF',
    icon: 'home',
  },
  wants: {
    label: 'Wants',
    color: '#F2514A',
    icon: 'heart',
  },
};

const SAVINGS_CONFIG = {
  label: 'Savings',
  color: '#22D97A',
  icon: 'trending-up',
};

export const AIBudgetPreviewModal: React.FC<AIBudgetPreviewModalProps> = ({
  visible,
  isLoading,
  isApplying,
  error,
  allocations,
  categories,
  monthlyIncome,
  spendingBudget,
  savingsAmount,
  currencySymbol,
  fromCache,
  onApply,
  onCancel,
  onRetry,
}) => {
  const { isDarkMode } = useTheme();

  // Group allocations by classification
  const groupedAllocations = React.useMemo(() => {
    if (!allocations) return null;

    const groups: Record<BudgetClassification, BudgetAllocation[]> = {
      needs: [],
      wants: [],
    };

    allocations.forEach((alloc) => {
      if (alloc.classification === 'needs' || alloc.classification === 'wants') {
        groups[alloc.classification].push(alloc);
      }
    });

    return groups;
  }, [allocations]);

  const totals = React.useMemo(() => {
    if (!allocations) return { needs: 0, wants: 0 };

    return {
      needs: allocations
        .filter((a) => a.classification === 'needs')
        .reduce((sum, a) => sum + a.percentage, 0),
      wants: allocations
        .filter((a) => a.classification === 'wants')
        .reduce((sum, a) => sum + a.percentage, 0),
    };
  }, [allocations]);

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
    <View className="py-12 items-center">
      <Text className={`text-[17px] font-semibold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
        Analyzing your categories...
      </Text>
      <Text className={`text-[13px] mt-1.5 ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
        This may take a few seconds
      </Text>
      <ActivityIndicator size="large" color={isDarkMode ? '#FFFFFF' : '#000000'} className="mt-6" />
    </View>
  );

  const isRateLimited = error?.toLowerCase().includes('rate') || error?.toLowerCase().includes('too many');

  const renderErrorState = () => (
    <View className="py-12">
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center mb-4 self-end ${
          isRateLimited ? 'bg-overlayAmber' : 'bg-overlayRed'
        }`}
      >
        <Ionicons
          name={isRateLimited ? 'time-outline' : 'alert-circle'}
          size={18}
          color={isRateLimited ? '#F4A623' : '#F2514A'}
        />
      </View>
      <View className="items-center">
        <Text className={`text-[17px] font-semibold mb-1.5 ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
          {isRateLimited ? 'Too many requests' : 'Unable to generate budget'}
        </Text>
        <Text className={`text-[13px] text-center px-4 mb-5 ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
          {isRateLimited ? 'Please wait a moment and try again.' : error}
        </Text>
        <TouchableOpacity
          onPress={onRetry}
          className="rounded-xl py-3 px-8 bg-accentBlue"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-sm">Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSummaryPills = () => (
    <View className="flex-row justify-between mb-4">
      {(['needs', 'wants'] as BudgetClassification[]).map((classification) => {
        const config = CLASSIFICATION_CONFIG[classification];
        const percentage = totals[classification];
        return (
          <View
            key={classification}
            className="flex-1 mx-1 py-3 rounded-xl items-center"
            style={{ backgroundColor: `${config.color}12`, borderWidth: 1, borderColor: `${config.color}20` }}
          >
            <Text style={{ fontWeight: '800', fontSize: 16, color: config.color }}>
              {percentage}%
            </Text>
            <Text className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
              {config.label}
            </Text>
          </View>
        );
      })}
      <View
        className="flex-1 mx-1 py-3 rounded-xl items-center"
        style={{ backgroundColor: `${SAVINGS_CONFIG.color}12`, borderWidth: 1, borderColor: `${SAVINGS_CONFIG.color}20` }}
      >
        <Text style={{ fontWeight: '800', fontSize: 16, color: SAVINGS_CONFIG.color }}>
          20%
        </Text>
        <Text className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
          {SAVINGS_CONFIG.label}
        </Text>
      </View>
    </View>
  );

  const renderCategoryRow = (alloc: BudgetAllocation) => {
    const { icon, color } = getCategoryInfo(alloc.categoryName);
    return (
      <View
        key={alloc.categoryId}
        className={`flex-row items-center py-3 px-3 rounded-xl mb-1.5 border ${
          isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-background border-borderLight'
        }`}
      >
        <View
          className="w-10 h-10 rounded-lg items-center justify-center mr-3"
          style={{ backgroundColor: color }}
        >
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className={`font-semibold text-sm ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
            {alloc.categoryName}
          </Text>
        </View>
        <View className="items-end">
          <Text className={`font-bold text-[15px] ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
            {alloc.percentage}%
          </Text>
          <Text className={`text-xs ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
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

    // Sort by percentage, highest first
    const sortedItems = [...items].sort((a, b) => b.percentage - a.percentage);

    return (
      <View key={classification} className="mb-3">
        <View className="flex-row items-center mb-2">
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: config.color }}
          />
          <Text className={`font-semibold text-[13px] ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
            {config.label}
          </Text>
          <Text className={`ml-1.5 text-xs ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
            ({items.reduce((sum, a) => sum + a.percentage, 0)}%)
          </Text>
        </View>
        {sortedItems.map(renderCategoryRow)}
      </View>
    );
  };

  const renderSuccessState = () => (
    <>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-1">
        <Text className={`text-[22px] font-bold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
          Your Budget
        </Text>
        <View className="w-11 h-11 rounded-2xl items-center justify-center bg-accentBlue">
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        </View>
      </View>
      <Text className={`text-[13px] mb-3 ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
        80% spending, 20% savings
        {fromCache ? ' (cached)' : ''}
      </Text>

      {/* Budget summary bar */}
      <View
        className={`rounded-xl p-3 mb-4 border ${
          isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-background border-borderLight'
        }`}
      >
        <View className="flex-row justify-between">
          <View>
            <Text className={`text-[11px] uppercase tracking-wide ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
              Spending
            </Text>
            <Text className={`text-base font-bold mt-0.5 ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
              {formatCurrency(spendingBudget, currencySymbol)}
            </Text>
          </View>
          <View className="items-end">
            <Text className={`text-[11px] uppercase tracking-wide ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
              Savings
            </Text>
            <Text className="text-base font-bold mt-0.5" style={{ color: SAVINGS_CONFIG.color }}>
              {formatCurrency(savingsAmount, currencySymbol)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ maxHeight: 360 }}
        showsVerticalScrollIndicator={false}
        className="mb-4"
      >
        {renderSection('needs')}
        {renderSection('wants')}
      </ScrollView>

      <View className="flex-row mt-1 gap-2.5">
        <TouchableOpacity
          onPress={onCancel}
          disabled={isApplying}
          className={`flex-1 rounded-xl py-3.5 items-center border ${
            isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-background border-borderLight'
          }`}
          style={{ opacity: isApplying ? 0.5 : 1 }}
          activeOpacity={0.7}
        >
          <Text className={`text-sm font-semibold ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onApply}
          disabled={isApplying}
          className="flex-1 rounded-xl py-3.5 items-center flex-row justify-center bg-accentTeal"
          style={{ opacity: isApplying ? 0.8 : 1 }}
          activeOpacity={0.8}
        >
          {isApplying ? (
            <>
              <ActivityIndicator size="small" color="#FFF" className="mr-2" />
              <Text className="text-white font-bold text-[15px]">Applying...</Text>
            </>
          ) : (
            <Text className="text-white font-bold text-[15px]">Apply Budget</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const content = (
    <View
      className={`w-[94%] rounded-2xl p-4 border ${
        isDarkMode ? 'bg-backgroundDark border-borderDark' : 'bg-background border-borderLight'
      }`}
    >
      {isLoading && renderLoadingState()}
      {!isLoading && error && renderErrorState()}
      {!isLoading && !error && allocations && renderSuccessState()}

      {!isLoading && !allocations && (
        <TouchableOpacity
          onPress={onCancel}
          className={`mt-2.5 rounded-xl py-3 items-center border ${
            isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-background border-borderLight'
          }`}
          activeOpacity={0.7}
        >
          <Text className={`text-sm font-semibold ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
            Cancel
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // When used inline (no visible prop), render just the card content
  if (visible === undefined) {
    return content;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        {content}
      </View>
    </Modal>
  );
};
