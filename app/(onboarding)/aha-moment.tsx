import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { useAnalytics } from "../hooks/useAnalytics";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

const AHA_CHOICES = [
  { id: "vacation",  label: "Vacation",   emoji: "✈️" },
  { id: "phone",     label: "New Phone",  emoji: "📱" },
  { id: "invest",    label: "Invest It",  emoji: "📈" },
  { id: "freedom",   label: "Just Freedom", emoji: "🌿" },
] as const;

const AHA_MESSAGES: Record<string, string> = {
  vacation: "That's a vacation waiting for you.",
  phone:    "That's a new phone — every year.",
  invest:   "That's a real start to your portfolio.",
  freedom:  "That's breathing room. Every single month.",
};

export default function AhaMomentScreen() {
  const { setOnboardingStep, newOnboardingData, setNewOnboardingData } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const monthlyIncome = newOnboardingData.estimatedIncome || 0;
  const annualSavings = Math.round(monthlyIncome * 0.20 * 12);
  const goal = newOnboardingData.pendingSavingsGoal;
  const hasSavingsGoal = !!goal && !!goal.name;
  const monthsToGoal = hasSavingsGoal && monthlyIncome > 0
    ? Math.ceil(goal!.targetAmount / (monthlyIncome * 0.20))
    : null;

  const glowOpacity = useSharedValue(0.25);

  useEffect(() => {
    setOnboardingStep(9);
    trackEvent("onboarding_aha_moment_viewed");

    glowOpacity.value = withRepeat(
      withTiming(0.5, { duration: 2500 }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(glowOpacity);
    };
  }, [setOnboardingStep, trackEvent]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleChoiceSelect = (choiceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedChoice(choiceId);
    setNewOnboardingData({ ahaChoice: choiceId });
    trackEvent("onboarding_aha_choice_selected", { choice: choiceId });
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "aha_moment",
      step: 9,
      has_savings_goal: hasSavingsGoal,
      aha_choice: selectedChoice,
      annual_savings: annualSavings,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setOnboardingStep(10);
    router.push("/(onboarding)/practice-entry");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(onboarding)/savings-goal");
  };

  const canContinue = hasSavingsGoal || selectedChoice !== null;

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <OnboardingBackButton onPress={handleBack} />
            <OnboardingProgressDots currentStep={9} totalSteps={12} />
            <View style={{ width: 36 }} />
          </View>
        </View>

        <View className="flex-1 px-2 py-8 pt-4">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 600 }}
          >
            {/* Big savings number — highlighted card */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, duration: 700 }}
              className="mb-6"
            >
              <View style={{ borderRadius: 24, overflow: "hidden" }}>
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: "#14532D",
                    },
                    glowStyle,
                  ]}
                />
                <LinearGradient
                  colors={["#052E16", "#064E3B", "#065F46"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: "#22D97A",
                    borderRadius: 24,
                    padding: 28,
                    alignItems: "center",
                  }}
                >
                  <View className="flex-row items-center gap-2 mb-3">
                    <Sparkles size={18} color="#22D97A" />
                    <Text style={{ color: "#22D97A", fontSize: 12, fontWeight: "600", letterSpacing: 1.5 }}>
                      YOUR SAVINGS POTENTIAL
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 56,
                      fontWeight: "800",
                      color: "#FFFFFF",
                      lineHeight: 64,
                    }}
                  >
                    {currencySymbol}{annualSavings > 0 ? annualSavings.toLocaleString() : "—"}
                  </Text>
                  <Text style={{ color: "#86EFAC", fontSize: 15, marginTop: 4 }}>
                    this year
                  </Text>
                </View>
              </View>
            </MotiView>

            {/* Branch A: has savings goal */}
            {hasSavingsGoal && monthsToGoal !== null && (
              <MotiView
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 500, duration: 600 }}
                className="mb-8"
              >
                <View className="bg-surfaceDark border border-borderDark rounded-3xl p-6">
                  <Text className="text-secondaryDark text-xs font-semibold tracking-widest mb-2">
                    YOUR GOAL
                  </Text>
                  <Text className="text-white text-xl font-semibold mb-1">
                    {goal!.name}
                  </Text>
                  <Text className="text-secondaryDark text-sm leading-relaxed">
                    At 20% savings, you could reach{" "}
                    <Text style={{ color: "#22D97A", fontWeight: "600" }}>
                      {currencySymbol}{goal!.targetAmount.toLocaleString()}
                    </Text>
                    {" "}in just{" "}
                    <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                      {monthsToGoal} {monthsToGoal === 1 ? "month" : "months"}
                    </Text>
                    .
                  </Text>
                </View>
              </MotiView>
            )}

            {/* Branch B: no savings goal — tappable choices */}
            {!hasSavingsGoal && (
              <MotiView
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 500, duration: 600 }}
                className="mb-8"
              >
                {selectedChoice ? (
                  <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 400 }}
                  >
                    <View className="bg-surfaceDark border border-borderDark rounded-3xl p-6">
                      <Text className="text-white text-lg font-semibold text-center leading-relaxed">
                        {AHA_MESSAGES[selectedChoice]}
                      </Text>
                    </View>
                  </MotiView>
                ) : (
                  <View>
                    <Text className="text-secondaryDark text-center text-sm mb-4">
                      What would you do with it?
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                      {AHA_CHOICES.map((choice) => (
                        <Pressable
                          key={choice.id}
                          onPress={() => handleChoiceSelect(choice.id)}
                          className="active:opacity-70"
                          style={{ flexBasis: "47%" }}
                        >
                          <View className="bg-surfaceDark border border-borderDark rounded-2xl p-4 items-center gap-2">
                            <Text style={{ fontSize: 28 }}>{choice.emoji}</Text>
                            <Text className="text-white text-sm font-medium text-center">
                              {choice.label}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </MotiView>
            )}

            {/* CTA — always visible for goal branch, appears after choice for no-goal branch */}
            {canContinue && (
              <MotiView
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ duration: 400 }}
              >
                <AnimatedGradientButton
                  onPress={handleNext}
                  text="Let's make it happen"
                  rounded="3xl"
                />
              </MotiView>
            )}
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
