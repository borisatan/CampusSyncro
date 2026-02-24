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

const QUICK_SUGGESTIONS = ['Main Account', 'Checking', 'Spending Account'];

export default function AccountNameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setPendingAccountName, setOnboardingStep, completeOnboarding } = useOnboardingStore();

  const [accountName, setAccountName] = useState('Main Account');

  useEffect(() => {
    setOnboardingStep(4);
  }, []);

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  const handleSuggestionPress = (name: string) => {
    setAccountName(name);
  };

  const handleContinue = () => {
    if (accountName.trim().length > 0) {
      setPendingAccountName(accountName.trim());
      router.push('/(onboarding)/first-transaction');
    }
  };

  const isValid = accountName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-backgroundDark"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <OnboardingHeader
        title="Name your account"
        currentStep={3}
        totalSteps={6}
        onBack={() => router.push('/(onboarding)/category-confirmation')}
        onSkip={handleSkip}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-base text-secondaryDark text-center mb-8">
          What should we call your primary account?
        </Text>

        {/* Input */}
        <View className="bg-surfaceDark rounded-xl border border-borderDark p-4 mb-6">
          <TextInput
            value={accountName}
            onChangeText={setAccountName}
            placeholder="Account name"
            placeholderTextColor="#6B7280"
            autoFocus
            className="text-textDark text-lg"
            maxLength={30}
          />
        </View>

        {/* Quick Suggestions */}
        <Text className="text-sm text-secondaryDark mb-3">
          Quick suggestions:
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {QUICK_SUGGESTIONS.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              onPress={() => handleSuggestionPress(suggestion)}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor:
                  accountName === suggestion ? '#3B82F6' : '#20283A',
                borderWidth: 1,
                borderColor:
                  accountName === suggestion ? '#3B82F6' : '#4B5563',
              }}
              activeOpacity={0.7}
            >
              <Text
                className="text-sm font-medium"
                style={{
                  color: accountName === suggestion ? '#FFFFFF' : '#9CA3AF',
                }}
              >
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View className="px-6" style={{ paddingBottom: insets.bottom + 20 }}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isValid}
          className="rounded-xl py-4 px-6 items-center"
          style={{
            backgroundColor: isValid ? '#3B82F6' : '#374151',
            opacity: isValid ? 1 : 0.5,
          }}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-semibold">Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
