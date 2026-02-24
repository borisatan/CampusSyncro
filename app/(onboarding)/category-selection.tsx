import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CategoryListItem from '../components/OnboardingPage/CategoryListItem';
import OnboardingHeader from '../components/OnboardingPage/OnboardingHeader';
import { ONBOARDING_CATEGORIES, OnboardingCategory } from '../constants/onboardingCategories';
import { useOnboardingStore } from '../store/useOnboardingStore';

export default function CategorySelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setOnboardingStep, setPendingCategories, pendingCategories, completeOnboarding } = useOnboardingStore();

  // Initialize with default selections or previously saved
  const [selectedCategories, setSelectedCategories] = useState<OnboardingCategory[]>(() => {
    if (pendingCategories.length > 0) {
      return pendingCategories;
    }
    return ONBOARDING_CATEGORIES.filter((cat) => cat.defaultSelected);
  });

  useEffect(() => {
    setOnboardingStep(3);
  }, []);

  const toggleCategory = (category: OnboardingCategory) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.some((c) => c.name === category.name);
      if (isSelected) {
        return prev.filter((c) => c.name !== category.name);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleContinue = () => {
    setPendingCategories(selectedCategories);
    router.push('/(onboarding)/budget-setting');
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  const isSelected = (category: OnboardingCategory) =>
    selectedCategories.some((c) => c.name === category.name);

  const essentials = ONBOARDING_CATEGORIES.filter((c) => c.section === 'essentials');
  const lifestyle = ONBOARDING_CATEGORIES.filter((c) => c.section === 'lifestyle');

  const isValid = selectedCategories.length > 0;

  const renderSection = (title: string, categories: OnboardingCategory[], startIndex: number) => (
    <View className="mb-4">
      <Text className="text-secondaryDark text-sm font-semibold uppercase tracking-wide mb-2 px-4">
        {title}
      </Text>
      {categories.map((category, index) => (
        <CategoryListItem
          key={category.name}
          name={category.name}
          icon={category.icon}
          color={category.color}
          isSelected={isSelected(category)}
          onPress={() => toggleCategory(category)}
          index={startIndex + index}
        />
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-backgroundDark">
      <OnboardingHeader
        currentStep={3}
        title="Choose your focus areas."
        subtitle="We'll track these to keep your spending intentional."
        onSkip={handleSkip}
      />

      {/* Category List */}
      <ScrollView
        className="flex-1 px-2 mt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {renderSection('Essentials', essentials, 0)}
        {renderSection('Lifestyle', lifestyle, essentials.length)}
      </ScrollView>

      {/* Footer */}
      <View
        className="px-2 pt-4 bg-backgroundDark border-t border-borderDark pb-4"
        style={{ paddingBottom: insets.bottom + 16 }} // Dynamic safe area inset
      >
        <Text className="text-secondaryDark text-sm text-center mb-3">
          {selectedCategories.length} categories selected
        </Text>

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
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
