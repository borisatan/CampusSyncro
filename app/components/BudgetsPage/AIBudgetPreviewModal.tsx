/**
 * AI Budget Preview Modal
 *
 * Displays AI-generated budget allocations for user review before applying.
 * Shows categories grouped by classification (needs/wants/savings) with the 50/30/20 breakdown.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetAllocation } from '../../services/budgetAIService';
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

// ─── Loading progress bar component ───────────────────────────────────────────

const STATUS_MESSAGES = [
  'Analyzing your categories...',
  'Applying 50/30/20 rule...',
  'Calculating allocations...',
  'Finalizing your smart budgets',
];

const FLOATING_DOTS = [
  { top: 10,  left: 30,  size: 6,  delay: 0 },
  { top: 30,  left: 10,  size: 4,  delay: 300 },
  { top: 60,  right: 20, size: 8,  delay: 600 },
  { top: 15,  right: 35, size: 5,  delay: 150 },
  { top: 70,  left: 25,  size: 4,  delay: 450 },
  { top: 50,  right: 10, size: 6,  delay: 750 },
];

const LoadingProgressState: React.FC = () => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const [displayProgress, setDisplayProgress] = React.useState(0);
  const [statusIdx, setStatusIdx] = React.useState(0);

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 88,
      duration: 3200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();

    const listener = progressAnim.addListener(({ value }) => {
      setDisplayProgress(Math.round(value));
      if (value < 25) setStatusIdx(0);
      else if (value < 50) setStatusIdx(1);
      else if (value < 72) setStatusIdx(2);
      else setStatusIdx(3);
    });

    return () => progressAnim.removeListener(listener);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="items-center px-8 w-full">
      {/* Icon with floating dots */}
      <View className="w-40 h-40 items-center justify-center mb-7">
        {/* Floating dots — sizes/positions are dynamic, keep inline */}
        {FLOATING_DOTS.map((dot, i) => (
          <MotiView
            key={`dot-${i}`}
            from={{ opacity: 0.2, scale: 0.8 }}
            animate={{ opacity: 0.7, scale: 1.2 }}
            transition={{
              type: 'timing',
              duration: 900,
              delay: dot.delay,
              loop: true,
              repeatReverse: true,
            }}
            style={{
              position: 'absolute',
              top: dot.top,
              left: (dot as any).left,
              right: (dot as any).right,
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              backgroundColor: '#3B7EFF', // accentBlue — must stay inline (dynamic per-dot)
            }}
          />
        ))}

        {/* Outer glow ring */}
        <View className="w-32 h-32 rounded-full absolute bg-accentBlue/7" />
        {/* Middle ring */}
        <View className="absolute rounded-full bg-accentBlue/12" style={{ width: 106, height: 106 }} />

        {/* Gradient icon circle */}
        <LinearGradient
          colors={['#3B7EFF', '#00C6FF']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="sparkles" size={38} color="#FFF" />
        </LinearGradient>
      </View>

      {/* Title */}
      <Text className="text-textDark text-xl font-bold mb-7 text-center">
        Applying 50/30/20 rule...
      </Text>

      {/* Progress bar */}
      <View className="w-full h-2.5 rounded-full bg-inputDark overflow-hidden mb-2.5">
        <Animated.View style={{ width: progressWidth, height: '100%' }}>
          <LinearGradient
            colors={['#3B7EFF', '#00C6FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>

      {/* Progress % */}
      <Text className="text-secondaryDark text-[13px] mb-4">{displayProgress}%</Text>

      {/* Status message */}
      <View className="flex-row items-center">
        <Ionicons name="sparkles" size={12} color="#3B7EFF" style={{ marginRight: 5 }} />
        <Text className="text-secondaryDark text-[13px]">{STATUS_MESSAGES[statusIdx]}</Text>
      </View>
    </View>
  );
};

// ─── Allocation row ────────────────────────────────────────────────────────────

const AllocationRow: React.FC<{
  alloc: BudgetAllocation;
  icon: string;
  color: string;
  currencySymbol: string;
  key?: React.Key;
}> = ({ alloc, icon, color, currencySymbol }) => (
  <View className="flex-row items-center py-3 px-3 rounded-xl mb-2 border bg-surfaceDark border-borderDark">
    <View
      className="w-11 h-11 rounded-xl items-center justify-center mr-3"
      style={{ backgroundColor: color }}
    >
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color="#fff" />
    </View>
    <Text className="flex-1 text-textDark font-semibold text-sm">
      {alloc.categoryName}
    </Text>
    <View className="items-end">
      <Text className="text-accentTeal font-bold text-base">
        {formatCurrency(alloc.amount, currencySymbol)}
      </Text>
      <Text className="text-secondaryDark text-[11px] font-semibold">{alloc.percentage}%</Text>
    </View>
  </View>
);

// ─── Section label ─────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string; pct: string; color: string }> = ({ label, pct, color }) => (
  <View className="flex-row items-center mb-2 mt-3">
    <View className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: color }} />
    <Text className="text-xs font-bold uppercase tracking-widest text-secondaryDark flex-1">{label}</Text>
    <Text className="text-xs font-bold" style={{ color }}>{pct}</Text>
  </View>
);

// ─── Main component ────────────────────────────────────────────────────────────

export const AIBudgetPreviewModal: React.FC<AIBudgetPreviewModalProps> = ({
  visible,
  isLoading,
  isApplying,
  error,
  allocations,
  categories,
  monthlyIncome,
  spendingBudget: _spendingBudget,
  savingsAmount,
  currencySymbol,
  fromCache,
  onApply,
  onCancel,
  onRetry,
}) => {
  const getCategoryInfo = (categoryName: string) => {
    const category = categories.find(
      (c) => c.category_name.toLowerCase() === categoryName.toLowerCase()
    );
    return {
      icon: category?.icon ?? 'ellipse',
      color: category?.color ?? '#6B7280',
    };
  };

  const isRateLimited = error?.toLowerCase().includes('rate') || error?.toLowerCase().includes('too many');

  const renderErrorState = () => (
    <View className="py-8">
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
        <Text className="text-[17px] font-semibold mb-1.5 text-textDark">
          {isRateLimited ? 'Too many requests' : 'Unable to generate budget'}
        </Text>
        <Text className="text-[13px] text-center px-4 mb-5 text-secondaryDark">
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

  const renderSuccessState = () => {
    const needs = (allocations ?? []).filter(a => a.classification === 'needs');
    const wants = (allocations ?? []).filter(a => a.classification === 'wants');
    const needsPct = needs.reduce((s, a) => s + a.percentage, 0);
    const wantsPct = wants.reduce((s, a) => s + a.percentage, 0);

    return (
    <>
      {/* Centered header */}
      <View className="items-center mb-5">
        <View className="w-16 h-16 rounded-xl items-center justify-center mb-4 bg-accentBlue">
          <Ionicons name="sparkles" size={28} color="#FFF" />
        </View>
        <Text className="text-2xl font-bold text-textDark mb-1">Your Smart Budget</Text>
        <Text className="text-sm text-secondaryDark mb-4">
          Optimized using the 50/30/20 rule{fromCache ? ' (cached)' : ''}
        </Text>

        {/* Total pill */}
        <View className="border border-accentBlue bg-accentBlue/8 px-4 py-1.5 rounded-2xl">
          <Text className="text-accentBlue font-semibold text-sm">
            Total: {formatCurrency(monthlyIncome, currencySymbol)}/month
          </Text>
        </View>
      </View>

      {/* Category list grouped by section */}
      <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
        {needs.length > 0 && (
          <>
            <SectionLabel label="Needs" pct={`${needsPct}%`} color="#1DB8A3" />
            {needs.map((alloc) => {
              const { icon, color } = getCategoryInfo(alloc.categoryName);
              return <AllocationRow key={String(alloc.categoryId)} alloc={alloc} icon={icon} color={color} currencySymbol={currencySymbol} />;
            })}
          </>
        )}

        {wants.length > 0 && (
          <>
            <SectionLabel label="Wants" pct={`${wantsPct}%`} color="#8B5CF6" />
            {wants.map((alloc) => {
              const { icon, color } = getCategoryInfo(alloc.categoryName);
              return <AllocationRow key={String(alloc.categoryId)} alloc={alloc} icon={icon} color={color} currencySymbol={currencySymbol} />;
            })}
          </>
        )}

        <SectionLabel label="Savings" pct="20%" color="#3B7EFF" />
        <View className="flex-row items-center py-3 px-3 rounded-xl mb-2 border bg-surfaceDark border-borderDark">
          <View className="w-11 h-11 rounded-xl items-center justify-center mr-3 bg-accentBlue">
            <Ionicons name="wallet-outline" size={20} color="#fff" />
          </View>
          <Text className="flex-1 text-textDark font-semibold text-sm">Savings Goal</Text>
          <View className="items-end">
            <Text className="text-accentBlue font-bold text-base">{formatCurrency(savingsAmount, currencySymbol)}</Text>
            <Text className="text-secondaryDark text-[11px] font-semibold">20%</Text>
          </View>
        </View>
      </ScrollView>

      {/* Cancel + Apply row */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onCancel}
          disabled={isApplying}
          className="flex-1 rounded-xl py-4 items-center justify-center border border-borderDark"
          style={{ opacity: isApplying ? 0.5 : 1 }}
          activeOpacity={0.7}
        >
          <Text className="text-secondaryDark font-semibold text-base">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onApply}
          disabled={isApplying}
          className="flex-1 rounded-xl py-4 items-center justify-center bg-accentTeal"
          style={{ opacity: isApplying ? 0.8 : 1 }}
          activeOpacity={0.8}
        >
          {isApplying ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text className="text-white font-bold text-base">Apply Budget</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
  };

  // ─── Inline mode (used from budgets.tsx inside a full-screen Modal) ─────────
  if (visible === undefined) {
    if (isLoading) {
      return (
        <SafeAreaView className="flex-1 items-center justify-center">
          <LoadingProgressState />
        </SafeAreaView>
      );
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {error && renderErrorState()}
        {!error && allocations && renderSuccessState()}
        {!allocations && !error && (
          <TouchableOpacity
            onPress={onCancel}
            className="mt-2 rounded-xl py-3.5 items-center border border-borderDark bg-surfaceDark"
            activeOpacity={0.7}
          >
            <Text className="text-secondaryDark text-sm font-semibold">Cancel</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  // ─── Modal mode (legacy) ───────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-overlayDark">
        <View className="w-[94%] rounded-2xl p-4 border bg-backgroundDark border-borderDark">
          {isLoading && (
            <View className="py-12 items-center">
              <LoadingProgressState />
            </View>
          )}
          {!isLoading && error && renderErrorState()}
          {!isLoading && !error && allocations && renderSuccessState()}
        </View>
      </View>
    </Modal>
  );
};
