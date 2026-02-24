import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingHeader from '../components/OnboardingPage/OnboardingHeader';
import { CategoryGridItem } from '../components/OnboardingPage/CategoryGridItem';
import { V3_DEFAULT_CATEGORIES } from '../constants/onboardingCategories';
import { useOnboardingStore } from '../store/useOnboardingStore';

export default function CategoryConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setPendingCategoryNames, setOnboardingStep, completeOnboarding } = useOnboardingStore();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    V3_DEFAULT_CATEGORIES.map((c) => c.name)
  );

  useEffect(() => {
    setOnboardingStep(3);
  }, []);

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name)
        ? prev.filter((c) => c !== name)
        : [...prev, name]
    );
  };

  const handleContinue = () => {
    setPendingCategoryNames(selectedCategories);
    router.push('/(onboarding)/account-name');
  };

  return (
    <View className="flex-1 bg-backgroundDark">
      <OnboardingHeader
        title="Confirm your categories"
        currentStep={2}
        totalSteps={6}
        onBack={() => router.push('/(onboarding)/monthly-target')}
        onSkip={handleSkip}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20 }}
      >
        <Text className="text-base text-secondaryDark text-center mb-2">
          We've selected the most impactful categories.
        </Text>
        <Text className="text-sm text-secondaryDark text-center mb-8">
          You can edit these anytime.
        </Text>

        {/* 2x3 Grid */}
        <View className="gap-4 mb-6">
          {/* Row 1 */}
          <View className="flex-row gap-4">
            {V3_DEFAULT_CATEGORIES.slice(0, 2).map((cat) => (
              <CategoryGridItem
                key={cat.name}
                name={cat.name}
                icon={cat.icon}
                color={cat.color}
                selected={selectedCategories.includes(cat.name)}
                onToggle={() => toggleCategory(cat.name)}
              />
            ))}
          </View>

          {/* Row 2 */}
          <View className="flex-row gap-4">
            {V3_DEFAULT_CATEGORIES.slice(2, 4).map((cat) => (
              <CategoryGridItem
                key={cat.name}
                name={cat.name}
                icon={cat.icon}
                color={cat.color}
                selected={selectedCategories.includes(cat.name)}
                onToggle={() => toggleCategory(cat.name)}
              />
            ))}
          </View>

          {/* Row 3 */}
          <View className="flex-row gap-4">
            {V3_DEFAULT_CATEGORIES.slice(4, 6).map((cat) => (
              <CategoryGridItem
                key={cat.name}
                name={cat.name}
                icon={cat.icon}
                color={cat.color}
                selected={selectedCategories.includes(cat.name)}
                onToggle={() => toggleCategory(cat.name)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View className="px-6" style={{ paddingBottom: insets.bottom + 20 }}>
        <TouchableOpacity
          onPress={handleContinue}
          className="bg-accentBlue rounded-xl py-4 px-6 items-center active:opacity-80"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-semibold">Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
