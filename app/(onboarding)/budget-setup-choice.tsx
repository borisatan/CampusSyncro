import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Sparkles, PenTool, ArrowRight, Lightbulb } from "lucide-react-native";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

export default function BudgetSetupChoiceScreen() {
  const { setOnboardingStep, setNewOnboardingData, completeOnboarding } = useOnboardingStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    setOnboardingStep(5);
    trackEvent("onboarding_budget_setup_choice_viewed");
  }, [setOnboardingStep, trackEvent]);

  const handleSmartBudget = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_budget_choice_selected", {
      choice: "smart",
      step: 5,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setNewOnboardingData({ budgetSetupChoice: "smart" });
    setOnboardingStep(6);
    router.push("/(onboarding)/ai-budget-setup");
  };

  const handleManualBudget = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_budget_choice_selected", {
      choice: "manual",
      step: 5,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setNewOnboardingData({ budgetSetupChoice: "manual" });
    setOnboardingStep(7);
    router.push("/(onboarding)/manual-budget-setup");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_budget_choice_selected", {
      choice: "skip",
      step: 5,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setNewOnboardingData({ budgetSetupChoice: "skip" });
    setOnboardingStep(8);
    router.push("/(onboarding)/why-manual");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(4);
    router.push("/(onboarding)/cost-of-inattention");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
        {/* Progress Bar */}
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <OnboardingBackButton onPress={handleBack} />
            <OnboardingProgressDots currentStep={5} totalSteps={11} />
            <View style={{ width: 36 }} />
          </View>
        </View>

        <View className="flex-1 px-2 py-8 pt-4">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 600 }}
            className="flex-1"
          >
            {/* Headline */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, duration: 600 }}
              className="mb-8"
            >
              <Text className="text-3xl text-white text-center leading-tight mb-2 px-4">
                How would you like to set your{" "}
                <Text className="text-accentGreen">budgets</Text>?
              </Text>
            </MotiView>

            {/* Option Cards */}
            <View className="mb-8">
              {/* Smart Budget Option */}
              <MotiView
                from={{ opacity: 0, translateX: -30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 400, duration: 600 }}
                className="mb-4"
              >
                <Pressable
                  onPress={handleSmartBudget}
                  className="rounded-3xl overflow-hidden active:opacity-80"
                  android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
                >
                  <LinearGradient
                    colors={["#0D1B3E", "#1A4CB0", "#2563EB"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderWidth: 2, borderColor: "#3B7EFF", borderRadius: 24 }}
                  >
                    <View className="p-5">
                      <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-12 h-12 rounded-3xl bg-accentBlue items-center justify-center">
                          <Sparkles size={24} color="#ffffff" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-xl font-semibold">Smart Budget</Text>
                          <Text className="text-blue-200 text-xs">AI-Powered</Text>
                        </View>
                        <ArrowRight size={20} color="#60A5FA" />
                      </View>
                      <Text className="text-blue-100 text-sm leading-relaxed">
                        Let us allocate your budget using the proven 50/30/20 rule.
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </MotiView>

              {/* Manual Budget Option */}
              <MotiView
                from={{ opacity: 0, translateX: 30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 550, duration: 600 }}
                className="mb-4"
              >
                <Pressable
                  onPress={handleManualBudget}
                  className="rounded-3xl overflow-hidden active:opacity-80"
                  android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
                >
                  <View
                    className="bg-surfaceDark border-2 border-borderDark rounded-3xl p-5"
                  >
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="w-12 h-12 rounded-3xl bg-inputDark items-center justify-center">
                        <PenTool size={24} color="#8A96B4" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-xl font-semibold">Manual Setup</Text>
                        <Text className="text-secondaryDark text-xs">Full Control</Text>
                      </View>
                      <ArrowRight size={20} color="#8A96B4" />
                    </View>
                    <Text className="text-secondaryDark text-sm leading-relaxed">
                      Set your own budget amounts for each category.
                    </Text>
                  </View>
                </Pressable>
              </MotiView>

              {/* Skip Option */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 700, duration: 600 }}
              >
                <Pressable
                  onPress={handleSkip}
                  className="rounded-3xl overflow-hidden active:opacity-60"
                >
                  <View className="bg-transparent border border-borderDark rounded-3xl p-4">
                    <Text className="text-secondaryDark text-base text-center">
                      Skip for now
                    </Text>
                  </View>
                </Pressable>
              </MotiView>
            </View>

            {/* Info Card */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 850, duration: 600 }}
              className="mt-auto"
            >
              <View className="bg-surfaceDark/50 border border-borderDark rounded-3xl px-4 py-3 flex-row items-center justify-center gap-2">
                <Lightbulb size={13} color="#8A96B4" />
                <Text className="text-secondaryDark text-xs text-center leading-relaxed">
                  Don&apos;t worry - you can always adjust your budgets later in the app
                </Text>
              </View>
            </MotiView>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
