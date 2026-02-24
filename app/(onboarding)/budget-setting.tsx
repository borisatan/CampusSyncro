import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import OnboardingHeader from '../components/OnboardingPage/OnboardingHeader';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useOnboardingStore } from '../store/useOnboardingStore';

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
];

export default function BudgetSettingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencyCode, updateCurrency } = useCurrencyStore();
  const {
    setOnboardingStep,
    pendingIncome,
    setPendingIncome,
    completeOnboarding,
  } = useOnboardingStore();

  const [income, setIncome] = useState(pendingIncome > 0 ? pendingIncome.toString() : '');
  const [selectedCurrency, setSelectedCurrency] = useState(currencyCode || 'USD');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setOnboardingStep(4);
  }, []);

  const handleIncomeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setIncome(numericValue);
  };

  const handleCurrencySelect = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCurrency(code);
    setShowDropdown(false);
  };

  const handleContinue = async () => {
    const incomeNum = parseInt(income, 10) || 0;
    setPendingIncome(incomeNum);

    // Save currency selection
    if (selectedCurrency !== currencyCode) {
      await updateCurrency(selectedCurrency);
    }

    router.push('/(onboarding)/savings-potential');
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  const incomeNum = parseInt(income, 10) || 0;
  const isValid = incomeNum > 0;
  const currentCurrency = CURRENCY_OPTIONS.find(c => c.code === selectedCurrency) || CURRENCY_OPTIONS[0];

  return (
    <View className="flex-1 bg-backgroundDark">
      <OnboardingHeader
        currentStep={4}
        title="What's your monthly income?"
        subtitle="This helps us calculate your savings potential."
        onSkip={handleSkip}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-2 mt-8">
          {/* Monthly Income Input */}
          <Text className="text-secondaryDark text-sm font-semibold uppercase tracking-wide mb-2">
            Monthly Take-Home
          </Text>
          <View className="flex-row items-center">
            {/* Currency Dropdown Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowDropdown(true);
              }}
              activeOpacity={0.7}
              className="items-center justify-center bg-surfaceDark rounded-xl px-5 py-4 border border-borderDark mr-2"
            >
              <Text className="text-textDark text-2xl font-semibold">
                {currentCurrency.symbol}
              </Text>
            </TouchableOpacity>

            {/* Income Input */}
            <View className="flex-1 flex-row items-center bg-surfaceDark rounded-xl px-4 py-4 border border-borderDark">
              <TextInput
                value={income}
                onChangeText={handleIncomeChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#6B7280"
                className="flex-1 text-textDark text-2xl"
              />
            </View>
          </View>

          {/* Helper text */}
          <Text className="text-secondaryDark text-sm mt-3">
            Enter your monthly income after taxes.
          </Text>
        </View>

        {/* Footer */}
        <View
          className="px-2 pt-4 bg-backgroundDark pb-4"
          style={{ paddingBottom: insets.bottom + 16 }} // Dynamic safe area inset
        >
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.8}
            className={`
              w-full py-4 rounded-xl items-center border
              ${isValid ? 'bg-accentBlue border-accentBlue' : 'bg-borderDark border-borderDark'}
            `}
          >
            <Text className={`text-base font-semibold ${isValid ? 'text-white' : 'text-secondaryDark'}`}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Currency Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
          className="flex-1 bg-black/50 justify-center px-6"
        >
          <View className="bg-surfaceDark rounded-2xl overflow-hidden border border-borderDark">
            <Text className="text-secondaryDark text-sm font-semibold uppercase tracking-wide px-4 pt-4 pb-2">
              Select Currency
            </Text>
            {CURRENCY_OPTIONS.map((currency, index) => (
              <TouchableOpacity
                key={currency.code}
                onPress={() => handleCurrencySelect(currency.code)}
                activeOpacity={0.7}
                className={`flex-row items-center px-4 py-4 ${
                  index < CURRENCY_OPTIONS.length - 1 ? 'border-b border-borderDark' : ''
                } ${selectedCurrency === currency.code ? 'bg-backgroundDark' : ''}`}
              >
                <Text className="text-textDark text-xl font-semibold w-8">
                  {currency.symbol}
                </Text>
                <View className="flex-1 ml-3">
                  <Text className="text-textDark text-base font-medium">
                    {currency.code}
                  </Text>
                  <Text className="text-secondaryDark text-sm">
                    {currency.label}
                  </Text>
                </View>
                {selectedCurrency === currency.code && (
                  <Ionicons name="checkmark" size={22} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
