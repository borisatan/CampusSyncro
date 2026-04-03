import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingHeader } from "../components/Shared/OnboardingHeader";
import { V3_DEFAULT_CATEGORIES } from "../constants/onboardingCategories";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";


const CATEGORY_MOTI_FROM = { opacity: 0, translateY: 20 } as const;
const CATEGORY_MOTI_ANIMATE = { opacity: 1, translateY: 0 } as const;

// Module-level constants to prevent MotiView from restarting animations on re-render
const WRAPPER_FROM = { opacity: 0 } as const;
const WRAPPER_ANIMATE = { opacity: 1 } as const;
const WRAPPER_TRANSITION = { duration: 600 } as const;

const HEADLINE_FROM = { opacity: 0, translateY: 20 } as const;
const HEADLINE_ANIMATE = { opacity: 1, translateY: 0 } as const;
const HEADLINE_TRANSITION = { delay: 200, duration: 600 } as const;

interface CategoryRowProps {
  category: { name: string; color: string; icon: string };
  index: number;
  isSelected: boolean;
  onToggle: (name: string) => void;
}

const CategoryRow = React.memo(({ category, index, isSelected, onToggle }: CategoryRowProps) => {

  const transition = useMemo(
    () => ({ delay: 400 + index * 100, duration: 500 }),
    [index]
  );

  const handlePress = useCallback(() => {
    onToggle(category.name);
  }, [onToggle, category.name]);

  return (
    <Pressable
      onPress={handlePress}
      className="rounded-xl overflow-hidden mb-3"
      android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
    >
      <MotiView
        from={CATEGORY_MOTI_FROM}
        animate={CATEGORY_MOTI_ANIMATE}
        transition={transition}
      >
        <View
          style={{
            backgroundColor: "#161B2E",
            borderWidth: 1,
            borderColor: isSelected ? "#3B7EFF" : "#2A3250",
            borderRadius: 12,
          }}
        >
          <View className="p-3">
            <View className="flex-row items-center gap-3">
              <View
                className="w-12 h-12 rounded-lg items-center justify-center"
                style={{ backgroundColor: category.color }}
              >
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color="#ffffff"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-medium">
                  {category.name}
                </Text>
              </View>
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#ffffff"
                />
              )}
            </View>
          </View>
        </View>
      </MotiView>
    </Pressable>
  );
});

export default function CategoryPreselectionScreen() {
  const { setOnboardingStep, setNewOnboardingData, completeOnboarding } = useOnboardingStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  // Ref so handleNext always reads the latest value without being recreated on every toggle
  const selectedCategoriesRef = useRef(selectedCategories);
  selectedCategoriesRef.current = selectedCategories;

  useEffect(() => {
    setOnboardingStep(2);
    trackEvent("onboarding_category_preselection_viewed");
  }, [setOnboardingStep, trackEvent]);

  const toggleCategory = useCallback((categoryName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategories((prev) => {
      return prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName];
    });
    trackEvent("onboarding_category_toggled", {
      screen: "category_preselection",
      category: categoryName,
    });
  }, [trackEvent]);

  const handleNext = useCallback(() => {
    const categories = selectedCategoriesRef.current;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "category_preselection",
      step: 2,
      selected_categories: categories,
      category_count: categories.length,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setNewOnboardingData({ selectedCategories: categories });
    setOnboardingStep(3);
    router.push("/(onboarding)/monthly-income");
  }, [trackEvent, setNewOnboardingData, setOnboardingStep]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(1);
    router.push("/(onboarding)/welcome");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "category_preselection",
      step: 2,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    completeOnboarding();
    router.replace("/(auth)/sign-up");
  };

  const isNextDisabled = selectedCategories.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <OnboardingHeader
          onBack={handleBack}
          onSkip={handleSkip}
          currentStep={2}
          totalSteps={11}
        />

        <View className="px-2 py-8 pt-4">
          <MotiView
            from={WRAPPER_FROM}
            animate={WRAPPER_ANIMATE}
            transition={WRAPPER_TRANSITION}
          >
            {/* Headline */}
            <MotiView
              from={HEADLINE_FROM}
              animate={HEADLINE_ANIMATE}
              transition={HEADLINE_TRANSITION}
              className="mb-8"
            >
              <Text className="text-3xl text-white text-center leading-tight mb-2 px-4">
                Which categories do you want to{" "}
                <Text className="text-accentBlue font-bold">track</Text>?
              </Text>
              <Text className="text-secondaryDark text-sm text-center mt-2">
                Select the expenses you want to monitor
              </Text>
            </MotiView>

            {/* Category Cards */}
            <View className="mb-3">
              {V3_DEFAULT_CATEGORIES.map((category, index) => (
                <CategoryRow
                  key={category.name}
                  category={category}
                  index={index}
                  isSelected={selectedCategories.includes(category.name)}
                  onToggle={toggleCategory}
                />
              ))}
            </View>
          </MotiView>
        </View>
      </ScrollView>

      {/* Continue Button — fixed footer, outside ScrollView to avoid iOS gesture zone touch issues */}
      <View className="px-4 pb-8">
        <AnimatedGradientButton
          onPress={handleNext}
          text="Continue"
          rounded="3xl"
          disabled={isNextDisabled}
        />
      </View>
    </SafeAreaView>
  );
}
