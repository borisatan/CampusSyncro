import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingHeader from '../components/OnboardingPage/OnboardingHeader';
import ValueCard from '../components/OnboardingPage/ValueCard';
import { VALUE_OPTIONS, ValueId } from '../constants/onboardingCategories';
import { useOnboardingStore } from '../store/useOnboardingStore';

export default function ValueAlignmentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedValues, setSelectedValues] = useState<ValueId[]>([]);
  const { setOnboardingStep, completeOnboarding } = useOnboardingStore();

  useEffect(() => {
    setOnboardingStep(2);
  }, []);

  const toggleValue = (id: ValueId) => {
    setSelectedValues((prev) =>
      prev.includes(id)
        ? prev.filter((v) => v !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    router.push('/(onboarding)/category-selection');
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  const isValid = selectedValues.length > 0;

  return (
    <View className="flex-1 bg-backgroundDark">
      <OnboardingHeader
        currentStep={2}
        title="What do you want to prioritize?"
        subtitle="Select the areas that bring you the most value."
        onSkip={handleSkip}
      />

      {/* Value Cards Grid */}
      <View className="flex-1 px-2 mt-6">
        {/* First row - 2 cards */}
        <View className="flex-row">
          {VALUE_OPTIONS.slice(0, 2).map((option, index) => (
            <ValueCard
              key={option.id}
              icon={option.icon}
              label={option.label}
              color={option.color}
              isSelected={selectedValues.includes(option.id)}
              onPress={() => toggleValue(option.id)}
              index={index}
            />
          ))}
        </View>

        {/* Second row - 2 cards */}
        <View className="flex-row">
          {VALUE_OPTIONS.slice(2, 4).map((option, index) => (
            <ValueCard
              key={option.id}
              icon={option.icon}
              label={option.label}
              color={option.color}
              isSelected={selectedValues.includes(option.id)}
              onPress={() => toggleValue(option.id)}
              index={index + 2}
            />
          ))}
        </View>

        {/* Third row - 1 card centered */}
        <View className="flex-row justify-center">
          <View className="w-1/2">
            <ValueCard
              icon={VALUE_OPTIONS[4].icon}
              label={VALUE_OPTIONS[4].label}
              color={VALUE_OPTIONS[4].color}
              isSelected={selectedValues.includes(VALUE_OPTIONS[4].id)}
              onPress={() => toggleValue(VALUE_OPTIONS[4].id)}
              index={4}
            />
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="px-2 pb-4" style={{ paddingBottom: insets.bottom + 16 }}> {/* Dynamic safe area inset */}
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
    </View>
  );
}
