import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Flag, MapPin, Zap } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { useAnalytics } from "../hooks/useAnalytics";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

const USE_CASE_LABELS: Record<string, string> = {
  track:   "Track my spending",
  budget:  "Stick to a budget",
  save:    "Save more money",
  goal:    "Save for a goal",
};

export default function JourneySummaryScreen() {
  const { setOnboardingStep, newOnboardingData } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  const monthlyIncome = newOnboardingData.estimatedIncome || 0;
  const monthlySavingsPotential = Math.round(monthlyIncome * 0.20);
  const goal = newOnboardingData.pendingSavingsGoal;
  const useCaseRaw = newOnboardingData.useCase || "";
  const useCaseIds = useCaseRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const useCaseLabels = useCaseIds
    .map((id) => USE_CASE_LABELS[id])
    .filter(Boolean);

  useEffect(() => {
    setOnboardingStep(11);
    trackEvent("onboarding_journey_summary_viewed");
  }, [setOnboardingStep, trackEvent]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "journey_summary",
      step: 11,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setOnboardingStep(12);
    router.push("/(onboarding)/personalizing");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(onboarding)/practice-entry");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <OnboardingBackButton onPress={handleBack} />
            <OnboardingProgressDots currentStep={11} totalSteps={12} />
            <View style={{ width: 36 }} />
          </View>
        </View>

        <View className="flex-1 px-2 py-8 pt-4">
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
              <Text className="text-3xl text-white text-center leading-tight">
                Here's where{" "}
                <Text style={{ color: "#3B7EFF" }}>you start</Text>.
              </Text>
            </MotiView>

            {/* Section 1: Where you are */}
            <MotiView
              from={{ opacity: 0, translateX: -30 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: 400, duration: 600 }}
              className="mb-4"
            >
              <View className="bg-surfaceDark border border-borderDark rounded-3xl p-6">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-10 h-10 rounded-2xl bg-inputDark items-center justify-center">
                    <MapPin size={18} color="#8A96B4" />
                  </View>
                  <Text style={{ color: "#8A96B4", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 }}>
                    WHERE YOU ARE
                  </Text>
                </View>
                <Text className="text-white text-base leading-relaxed">
                  {monthlyIncome > 0
                    ? `${currencySymbol}${monthlyIncome.toLocaleString()}/month coming in, $0 tracked. That changes today.`
                    : "Money coming in, but none of it tracked. That changes today."
                  }
                </Text>
              </View>
            </MotiView>

            {/* Section 2: Where you want to go */}
            <MotiView
              from={{ opacity: 0, translateX: 30 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: 600, duration: 600 }}
              className="mb-4"
            >
              <View style={{ borderRadius: 24, overflow: "hidden" }}>
                <LinearGradient
                  colors={["#0D1B3E", "#0F2D6B", "#1A4CB0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: "#3B7EFF",
                    borderRadius: 24,
                    padding: 24,
                  }}
                >
                  <View className="flex-row items-center gap-3 mb-3">
                    <View
                      className="w-10 h-10 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: "#3B7EFF" }}
                    >
                      <Flag size={18} color="#ffffff" />
                    </View>
                    <Text style={{ color: "#93C5FD", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 }}>
                      WHERE YOU WANT TO GO
                    </Text>
                  </View>
                  {useCaseLabels.length > 0 ? (
                    <View className="gap-1">
                      {useCaseLabels.map((label) => (
                        <Text key={label} className="text-white text-base">
                          · {label}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-white text-base">Take control of your money.</Text>
                  )}
                  {goal?.name ? (
                    <View
                      style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#1E3A6B" }}
                    >
                      <Text style={{ color: "#93C5FD", fontSize: 13 }}>
                        Goal:{" "}
                        <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                          {goal.name}
                        </Text>
                        {goal.targetAmount > 0 && (
                          <Text style={{ color: "#93C5FD" }}>
                            {" "}— {currencySymbol}{goal.targetAmount.toLocaleString()}
                          </Text>
                        )}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </MotiView>

            {/* Section 3: 30 days from now */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 800, duration: 600 }}
              className="mb-4"
            >
              <View className="bg-surfaceDark border border-borderDark rounded-3xl p-6">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-10 h-10 rounded-2xl bg-inputDark items-center justify-center">
                    <Zap size={18} color="#F59E0B" />
                  </View>
                  <Text style={{ color: "#8A96B4", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 }}>
                    30 DAYS FROM NOW
                  </Text>
                </View>
                <Text className="text-white text-base leading-relaxed">
                  You'll know exactly where every dollar goes.
                  {monthlySavingsPotential > 0 && (
                    <Text>
                      {" "}Most users recapture{" "}
                      <Text style={{ color: "#22D97A", fontWeight: "600" }}>
                        {currencySymbol}{monthlySavingsPotential.toLocaleString()}/month
                      </Text>
                      {" "}they used to lose.
                    </Text>
                  )}
                </Text>
              </View>
            </MotiView>

            {/* Stat footnote */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1000, duration: 600 }}
              className="mb-8"
            >
              <View className="bg-surfaceDark/50 border border-borderDark rounded-3xl px-4 py-3">
                <Text className="text-secondaryDark text-xs text-center leading-relaxed">
                  Users who track for 30 days save an average of{" "}
                  <Text className="text-accentBlue font-semibold">20% more</Text>
                  {" "}than those who don't.
                </Text>
              </View>
            </MotiView>

            <AnimatedGradientButton
              onPress={handleNext}
              text="Let's do this"
              rounded="3xl"
            />
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
