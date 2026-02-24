import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingHeader from '../components/OnboardingPage/OnboardingHeader';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useCurrencyStore } from '../store/useCurrencyStore';

const QUICK_AMOUNTS = [2000, 3000, 5000];

export default function MonthlyTargetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencySymbol } = useCurrencyStore();
  const { setPendingMonthlyTarget, setOnboardingStep, completeOnboarding } = useOnboardingStore();

  const [targetAmount, setTargetAmount] = useState('3000');
  const [selectedChip, setSelectedChip] = useState(3000);

  useEffect(() => {
    setOnboardingStep(1);
  }, []);

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  const formatNumber = (value: string) => {
    const num = value.replace(/[^0-9]/g, '');
    if (num === '') return '';
    return parseInt(num).toLocaleString();
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setTargetAmount(cleaned);
    const numValue = parseInt(cleaned) || 0;
    setSelectedChip(QUICK_AMOUNTS.includes(numValue) ? numValue : 0);
  };

  const handleChipPress = (amount: number) => {
    setTargetAmount(amount.toString());
    setSelectedChip(amount);
  };

  const handleNext = () => {
    const numericAmount = parseInt(targetAmount) || 0;
    if (numericAmount > 0) {
      setPendingMonthlyTarget(numericAmount);
      router.push('/(onboarding)/dashboard-generation');
    }
  };

  const numericAmount = parseInt(targetAmount) || 0;
  const isValid = numericAmount > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-backgroundDark"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <OnboardingHeader
        title="Set your monthly target"
        currentStep={1}
        totalSteps={6}
        onBack={() => router.push('/(onboarding)/outcome-preview')}
        onSkip={handleSkip}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-base text-secondaryDark text-center mb-8">
          What would you like to spend this month?
        </Text>

        {/* Large Input */}
        <View className="items-center mb-8">
          <View className="flex-row items-center justify-center">
            <Text className="text-5xl text-textDark font-light mr-2">
              {currencySymbol}
            </Text>
            <TextInput
              value={formatNumber(targetAmount)}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              autoFocus
              placeholder="0"
              placeholderTextColor="#6B7280"
              className="text-6xl text-white font-light text-center"
              style={{ minWidth: 200 }}
            />
          </View>
        </View>

        {/* Quick Select Chips */}
        <View className="flex-row justify-center gap-3 mb-6">
          {QUICK_AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount}
              onPress={() => handleChipPress(amount)}
              className="px-6 py-3 rounded-full"
              style={{
                backgroundColor:
                  selectedChip === amount ? '#3B82F6' : '#20283A',
                borderWidth: 1,
                borderColor: selectedChip === amount ? '#3B82F6' : '#4B5563',
              }}
              activeOpacity={0.7}
            >
              <Text
                className="text-base font-medium"
                style={{
                  color: selectedChip === amount ? '#FFFFFF' : '#9CA3AF',
                }}
              >
                {currencySymbol}
                {amount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Helper Text */}
        <Text className="text-sm text-secondaryDark text-center">
          Most users start with {currencySymbol}3,000. You can change this later.
        </Text>
      </ScrollView>

      {/* Next Button */}
      <View
        className="px-6"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={!isValid}
          className="rounded-xl py-4 px-6 items-center"
          style={{
            backgroundColor: isValid ? '#3B82F6' : '#374151',
            opacity: isValid ? 1 : 0.5,
          }}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-semibold">Next</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
