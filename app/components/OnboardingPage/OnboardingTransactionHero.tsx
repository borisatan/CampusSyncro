import React from 'react';
import { View } from 'react-native';
import { Text, TextInput } from '../Shared/AppText';
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
        <View className={`flex-row items-center w-full rounded-xl border ${isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-background border-borderLight'}`}>
          <Text className={`pl-4 text-2xl ${isDarkMode ? 'text-slate400' : 'text-gray400'}`} style={{ lineHeight: 24 }}>
            {currencySymbol}
          </Text>
          <TextInput
            ref={amountInputRef}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={isDarkMode ? "#475569" : "#9ca3af"}
            className={`flex-1 pl-2 pr-4 py-4 text-2xl ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}
            style={{ lineHeight: 24 }}
          />
        </View>
      </View>
    </>
  );
};
