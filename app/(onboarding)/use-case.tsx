import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingHeader } from "../components/Shared/OnboardingHeader";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

const USE_CASES = [
  {
    id: "track_spending",
    label: "Track my spending",
    description: "Know where every dollar goes",
    icon: "stats-chart" as const,
    color: "#3B7EFF",
  },
  {
    id: "stick_to_budget",
    label: "Stick to a budget",
    description: "Control and plan my spending",
    icon: "flag" as const,
    color: "#22D97A",
  },
  {
    id: "save_more",
    label: "Save more money",
    description: "Build savings habits",
    icon: "trending-up" as const,
    color: "#F2A93B",
  },
  {
    id: "save_for_goal",
    label: "Save for a goal",
    description: "Work toward something specific",
    icon: "trophy" as const,
    color: "#A78BFA",
  },
];

export default function UseCaseScreen() {
  const { setOnboardingStep, setNewOnboardingData, completeOnboarding } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>([]);
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    setOnboardingStep(2);
    trackEvent("onboarding_use_case_viewed");
  }, [setOnboardingStep, trackEvent]);

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selected.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "use_case",
      step: 2,
      use_cases: selected,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setNewOnboardingData({ useCase: selected.join(",") });
    setOnboardingStep(3);
    if (selected.includes("save_for_goal")) {
      router.push("/(onboarding)/savings-goal");
    } else {
      router.push("/(onboarding)/category-preselection");
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(onboarding)/welcome");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "use_case",
      step: 2,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    completeOnboarding();
    router.replace("/(auth)/sign-up");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <OnboardingHeader
          onBack={handleBack}
          onSkip={handleSkip}
          currentStep={2}
          totalSteps={12}
        />

        <View className="px-2 pt-4 pb-8">
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200, duration: 600 }}
            className="mb-8"
          >
            <Text className="text-3xl text-white font-bold text-center leading-tight mb-2">
              What's your main{" "}
              <Text className="text-accentBlue">goal</Text>?
            </Text>
          </MotiView>

          {USE_CASES.map((item, index) => {
            const isSelected = selected.includes(item.id);
            return (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 300 + index * 80, duration: 500 }}
              >
                <Pressable
                  onPress={() => handleSelect(item.id)}
                  className="mb-3 rounded-xl overflow-hidden active:opacity-70"
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                >
                  <View
                    style={{
                      backgroundColor: "#161B2E",
                      borderWidth: 1.5,
                      borderColor: isSelected ? "#3B7EFF" : "#2A3250",
                      borderRadius: 12,
                    }}
                  >
                    <View className="p-4 flex-row items-center gap-4">
                      <View
                        className="w-11 h-11 rounded-xl items-center justify-center"
                        style={{ backgroundColor: item.color }}
                      >
                        <Ionicons
                          name={item.icon}
                          size={22}
                          color="#fff"
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-white font-semibold"
                          style={{ fontSize: 16 }}
                        >
                          {item.label}
                        </Text>
                        <Text className="text-secondaryDark text-sm mt-0.5">
                          {item.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color="#fff" />
                      )}
                    </View>
                  </View>
                </Pressable>
              </MotiView>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-2 pb-8">
        <AnimatedGradientButton
          onPress={handleNext}
          text="Continue"
          rounded="3xl"
          disabled={selected.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}
