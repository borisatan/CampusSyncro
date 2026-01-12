import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  return (
    <>
      {/* Header */}
      {showHeader && (
        <View className="mb-6">
          <Text className={isDarkMode ? "text-2xl font-semibold text-white" : "text-2xl font-semibold text-gray-900"}>
            {title}
          </Text>
          <Text className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
            {subtitle}
          </Text>
        </View>
      )}

      {/* Transaction Type Toggle */}
      <View className={`${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'} rounded-2xl p-1 flex-row mb-6`}>
        <TouchableOpacity
          onPress={() => setTransactionType('expense')}
          className={`flex-1 py-3 rounded-xl ${
            transactionType === 'expense'
              ? isDarkMode ? 'bg-accentRed' : 'bg-white'
              : ''
          }`}
        >
          <Text className={`text-center ${
            transactionType === 'expense' 
              ? isDarkMode ? 'text-white' : 'text-gray-900'
              : isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTransactionType('income')}
          className={`flex-1 py-3 rounded-xl ${
            transactionType === 'income'
              ? isDarkMode ? 'bg-accentTeal' : 'bg-white'
              : ''
          }`}
        >
          <Text className={`text-center ${
            transactionType === 'income' 
              ? isDarkMode ? 'text-white' : 'text-gray-900'
              : isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            Income
          </Text>
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