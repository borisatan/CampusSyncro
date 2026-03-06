import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { useCurrencyStore } from '../../store/useCurrencyStore';

interface OnboardingTransactionHeroProps {
  amount: string;
  setAmount: (val: string) => void;
  isDarkMode: boolean;
  amountInputRef: React.RefObject<TextInput>;
}

export const OnboardingTransactionHero = ({
  amount,
  setAmount,
  isDarkMode,
  amountInputRef,
}: OnboardingTransactionHeroProps) => {
  const { currencySymbol } = useCurrencyStore();

  return (
    <>
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
                ? 'bg-inputDark border-borderDark text-textDark'
                : 'bg-background border-borderLight text-textLight'
            } border`}
          />
        </View>
      </View>
    </>
  );
};
