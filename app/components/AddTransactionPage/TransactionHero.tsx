import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useCurrencyStore } from '../../store/useCurrencyStore';

interface TransactionHeroProps {
  transactionType: 'expense' | 'income';
  setTransactionType: (type: 'expense' | 'income') => void;
  amount: string;
  setAmount: (val: string) => void;
  isDarkMode: boolean;
  amountInputRef: React.RefObject<TextInput>;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
}

export const TransactionHero = ({
  transactionType,
  setTransactionType,
  amount,
  setAmount,
  isDarkMode,
  amountInputRef,
  title = 'Add Transaction',
  subtitle = 'Record your income or expense',
  showHeader = true,
}: TransactionHeroProps) => {
  const { currencySymbol } = useCurrencyStore();

  // 0 = expense, 1 = income
  const progress = useSharedValue(transactionType === 'income' ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(transactionType === 'income' ? 1 : 0, { duration: 150 });
  }, [transactionType]);

  const sliderStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 50}%`,
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      isDarkMode ? ['#EF4444', '#2A9D8F'] : ['#ffffff', '#ffffff']
    ),
  }));

  const expenseTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      isDarkMode ? ['#ffffff', '#94a3b8'] : ['#111827', '#6b7280']
    ),
  }));

  const incomeTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      isDarkMode ? ['#94a3b8', '#ffffff'] : ['#6b7280', '#111827']
    ),
  }));

  return (
    <>
      {/* Header */}
      {showHeader && (
        <View className="pt-4 pb-3">
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: isDarkMode ? "#F1F5F9" : "#0F172A",
              letterSpacing: -0.5,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: isDarkMode ? "#7C8CA0" : "#94A3B8",
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        </View>
      )}

      {/* Transaction Type Toggle */}
      <View className={`${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'} rounded-2xl p-1 flex-row mb-6`}>
        {/* Animated sliding indicator */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 4,
              width: '50%',
              height: '100%',
              borderRadius: 12,
            },
            sliderStyle,
          ]}
        />
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTransactionType('expense');
          }}
          className="flex-1 py-3 rounded-xl z-10"
          activeOpacity={0.7}
        >
          <Animated.Text style={[{ textAlign: 'center', fontWeight: '500' }, expenseTextStyle]}>
            Expense
          </Animated.Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTransactionType('income');
          }}
          className="flex-1 py-3 rounded-xl z-10"
          activeOpacity={0.7}
        >
          <Animated.Text style={[{ textAlign: 'center', fontWeight: '500' }, incomeTextStyle]}>
            Income
          </Animated.Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View className="mb-6">
        <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Amount
        </Text>
        <View className="relative">
          <Text className={`absolute left-4 top-4 text-2xl z-10 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            {currencySymbol}
          </Text>
          <TextInput
            ref={amountInputRef}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={isDarkMode ? "#475569" : "#9ca3af"}
            className={`w-full pl-10 pr-4 py-4 rounded-xl text-2xl ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } border`}
          />
        </View>
      </View>
    </>
  );
};
