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
            className={`text-3xl font-extrabold tracking-tight ${isDarkMode ? "text-slate50" : "text-slate800"}`}
          >
            {title}
          </Text>
          <Text
            className={`text-sm mt-0.5 ${isDarkMode ? "text-slateMuted" : "text-slate300"}`}
          >
            {subtitle}
          </Text>
        </View>
      )}

      {/* Transaction Type Toggle */}
      <View
        className={`${isDarkMode ? 'bg-slate700 border-slate600' : 'bg-backgroundMuted border-borderLight'} rounded-2xl flex-row mb-6 border`}
        style={{ overflow: 'hidden' }}
      >
        {/* Animated sliding indicator */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '50%',
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
        <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate300' : 'text-secondaryLight'}`}>
          Amount
        </Text>
        <View className="relative">
          <Text className={`absolute left-4 top-4 text-2xl z-10 ${isDarkMode ? 'text-slate400' : 'text-gray400'}`}>
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
                ? 'bg-slate700 border-slate600 text-textDark'
                : 'bg-background border-borderLight text-textLight'
            } border`}
          />
        </View>
      </View>
    </>
  );
};
