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
    maximumFractionDigits: 0,
  })}`;
};

const CLASSIFICATION_CONFIG: Record<
  BudgetClassification,
  { label: string; color: string; icon: string }
> = {
  needs: {
    label: 'Needs',
    color: '#2A9D8F',
    icon: 'home',
  },
  wants: {
    label: 'Wants',
    color: '#3B82F6',
    icon: 'heart',
  },
};

const SAVINGS_CONFIG = {
  label: 'Savings',
  color: '#A855F7',
  icon: 'trending-up',
};

export const AIBudgetPreviewModal: React.FC<AIBudgetPreviewModalProps> = ({
  visible,
  isLoading,
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

  const cardBg = isDarkMode ? '#0F172A' : '#FFFFFF';
  const innerBg = isDarkMode ? '#151C2E' : '#F8FAFC';
  const borderColor = isDarkMode ? '#1E293B' : '#E2E8F0';
  const textPrimary = isDarkMode ? '#F1F5F9' : '#0F172A';
  const textSecondary = isDarkMode ? '#8B99AE' : '#94A3B8';

  const renderLoadingState = () => (
    <View className="items-center justify-center py-12">
      <View
        className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(37,99,235,0.12)' }}
      >
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
      <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>
        Analyzing your categories...
      </Text>
      <Text style={{ fontSize: 13, color: textSecondary, marginTop: 6 }}>
        This may take a few seconds
      </Text>
    </View>
  );

  const isRateLimited = error?.toLowerCase().includes('rate') || error?.toLowerCase().includes('too many');

  const renderErrorState = () => (
    <View className="items-center justify-center py-12">
      <View
        className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
        style={{ backgroundColor: isRateLimited ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.1)' }}
      >
        <Ionicons
          name={isRateLimited ? 'time-outline' : 'alert-circle'}
          size={28}
          color={isRateLimited ? '#F59E0B' : '#EF4444'}
        />
      </View>
      <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary, marginBottom: 6 }}>
        {isRateLimited ? 'Too many requests' : 'Unable to generate budget'}
      </Text>
      <Text style={{ fontSize: 13, color: textSecondary, textAlign: 'center', paddingHorizontal: 16, marginBottom: 20 }}>
        {isRateLimited ? 'Please wait a moment and try again.' : error}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        className="rounded-xl py-3 px-8"
        style={{ backgroundColor: '#2563EB' }}
        activeOpacity={0.8}
      >
        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Try Again</Text>
      </TouchableOpacity>
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
            <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
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
        <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
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
        className="flex-row items-center py-3 px-3 rounded-xl mb-1.5"
        style={{ backgroundColor: innerBg, borderWidth: 1, borderColor: borderColor }}
      >
        <View
          className="w-10 h-10 rounded-lg items-center justify-center mr-3"
          style={{ backgroundColor: color }}
        >
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color="#fff" />
        </View>
        <View className="flex-1">
          <Text style={{ fontWeight: '600', fontSize: 14, color: textPrimary }}>{alloc.categoryName}</Text>
        </View>
        <View className="items-end">
          <Text style={{ fontWeight: '700', fontSize: 15, color: textPrimary }}>{alloc.percentage}%</Text>
          <Text style={{ fontSize: 12, color: textSecondary }}>
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
      <View key={classification} className="mb-3">
        <View className="flex-row items-center mb-2">
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: config.color }}
          />
          <Text style={{ fontWeight: '600', fontSize: 13, color: textPrimary }}>
            {config.label}
          </Text>
          <Text style={{ marginLeft: 6, fontSize: 12, color: textSecondary }}>
            ({items.reduce((sum, a) => sum + a.percentage, 0)}%)
          </Text>
        </View>
        {items.map(renderCategoryRow)}
      </View>
    );
  };

  const renderSuccessState = () => (
    <>
      {/* Header */}
      <View className="items-center mb-4">
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
          style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}
        >
          <Ionicons name="sparkles" size={26} color="#F59E0B" />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: textPrimary }}>
          Your AI Budget
        </Text>
        <Text style={{ fontSize: 13, color: textSecondary, marginTop: 4 }}>
          80% spending, 20% savings
          {fromCache ? ' (cached)' : ''}
        </Text>
      </View>

      {renderSummaryPills()}

      {/* Budget summary bar */}
      <View
        className="rounded-xl p-3 mb-4"
        style={{ backgroundColor: innerBg, borderWidth: 1, borderColor: borderColor }}
      >
        <View className="flex-row justify-between">
          <View>
            <Text style={{ fontSize: 11, color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Spending
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textPrimary, marginTop: 2 }}>
              {formatCurrency(spendingBudget, currencySymbol)}
            </Text>
          </View>
          <View className="items-end">
            <Text style={{ fontSize: 11, color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Savings
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: SAVINGS_CONFIG.color, marginTop: 2 }}>
              {formatCurrency(savingsAmount, currencySymbol)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ maxHeight: 280 }}
        showsVerticalScrollIndicator={false}
        className="mb-4"
      >
        {renderSection('needs')}
        {renderSection('wants')}
      </ScrollView>

      <TouchableOpacity
        onPress={onApply}
        className="rounded-xl py-3.5 items-center"
        style={{ backgroundColor: '#2A9D8F' }}
        activeOpacity={0.8}
      >
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Ionicons name="checkmark-circle" size={18} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Apply Budget</Text>
        </View>
      </TouchableOpacity>
    </>
  );

  const content = (
    <View
      style={{
        width: '94%',
        borderRadius: 20,
        padding: 16,
        backgroundColor: cardBg,
        borderWidth: 1,
        borderColor: borderColor,
      }}
    >
      {isLoading && renderLoadingState()}
      {!isLoading && error && renderErrorState()}
      {!isLoading && !error && allocations && renderSuccessState()}

      {!isLoading && (
        <TouchableOpacity
          onPress={onCancel}
          className="mt-2.5 rounded-xl py-3 items-center"
          style={{
            borderWidth: 1,
            borderColor: borderColor,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: textSecondary }}>Cancel</Text>
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
