import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { V3_DEFAULT_CATEGORIES } from "../constants/onboardingCategories";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

// Map filled icons to outline variants
const getOutlineIcon = (icon: string): keyof typeof Ionicons.glyphMap => {
  // If already an outline icon, return as-is
  if (icon.endsWith('-outline')) {
    return icon as keyof typeof Ionicons.glyphMap;
  }

  const outlineMap: Record<string, string> = {
    'home': 'home-outline',
    'cart': 'cart-outline',
    'restaurant': 'restaurant-outline',
    'tv': 'tv-outline',
    'car': 'car-outline',
    'bag-handle': 'bag-outline',
    'apps': 'apps-outline',
  };
  return (outlineMap[icon] || icon) as keyof typeof Ionicons.glyphMap;
};

export default function CategoryPreselectionScreen() {
  const { setOnboardingStep, setNewOnboardingData, completeOnboarding } = useOnboardingStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    setOnboardingStep(2);
    trackEvent("onboarding_category_preselection_viewed");
  }, [setOnboardingStep, trackEvent]);

  const toggleCategory = (categoryName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategories((prev) => {
      const isCurrentlySelected = prev.includes(categoryName);
      trackEvent("onboarding_category_toggled", {
        screen: "category_preselection",
        category: categoryName,
        selected: !isCurrentlySelected,
      });
      return isCurrentlySelected
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName];
    });
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "category_preselection",
      step: 2,
      selected_categories: selectedCategories,
      category_count: selectedCategories.length,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setNewOnboardingData({ selectedCategories: selectedCategories });
    setOnboardingStep(3);
    router.push("/(onboarding)/monthly-income");
  };

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
      <ScrollView className="flex-1">
        {/* Progress Bar */}
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Pressable
              onPress={handleBack}
              className="flex-row items-center gap-1 active:opacity-60"
            >
              <ChevronLeft size={20} color="#8A96B4" />
              <Text className="text-secondaryDark text-sm">Back</Text>
            </Pressable>
            <Pressable
              onPress={handleSkip}
              className="active:opacity-60"
            >
              <Text className="text-accentBlue text-sm font-medium">Skip</Text>
            </Pressable>
          </View>
          <View className="items-center">
            <View className="h-2 bg-surfaceDark rounded-full overflow-hidden" style={{ width: '33%' }}>
              <MotiView
                from={{ width: "14.3%" }}
                animate={{ width: "28.6%" }}
                transition={{ type: "timing", duration: 500 }}
                className="h-full overflow-hidden relative"
              >
                <LinearGradient
                  colors={["#1E40AF", "#3B7EFF", "#60A5FA"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ width: "100%", height: "100%" }}
                />
                <MotiView
                  from={{ translateX: -200 }}
                  animate={{ translateX: 200 }}
                  transition={{
                    type: "timing",
                    duration: 3000,
                    loop: true,
                    delay: 1500,
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: 100,
                  }}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0)",
                      "rgba(255, 255, 255, 0.3)",
                      "rgba(255, 255, 255, 0)",
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ width: "100%", height: "100%" }}
                  />
                </MotiView>
              </MotiView>
            </View>
          </View>
        </View>

        <View className="px-2 py-8 pt-4">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 600 }}
          >
            {/* Headline */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, duration: 600 }}
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
            <View className="mb-8">
              {V3_DEFAULT_CATEGORIES.map((category, index) => {
                const isSelected = selectedCategories.includes(category.name);

                return (
                  <MotiView
                    key={category.name}
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 400 + index * 100, duration: 500 }}
                    className="mb-2"
                  >
                    <Pressable
                      onPress={() => toggleCategory(category.name)}
                      className="rounded-xl overflow-hidden"
                      android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
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
                                name={getOutlineIcon(category.icon)}
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
                    </Pressable>
                  </MotiView>
                );
              })}
            </View>

            {/* Continue Button */}
            <AnimatedGradientButton
              onPress={handleNext}
              text="Continue"
              delay={900}
              rounded="xl"
              disabled={isNextDisabled}
            />
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
