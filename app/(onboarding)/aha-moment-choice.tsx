import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { CreditCard, Plane, Shield, TrendingUp } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { useAnalytics } from "../hooks/useAnalytics";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

const AHA_CHOICES = [
  { id: "vacation",  label: "Vacation",       Icon: Plane,      color: "#60A5FA" },
  { id: "invest",    label: "Invest It",       Icon: TrendingUp, color: "#22D97A" },
  { id: "emergency", label: "Emergency Fund",  Icon: Shield,     color: "#F59E0B" },
  { id: "debt",      label: "Pay Off Debt",    Icon: CreditCard, color: "#F87171" },
] as const;

const AHA_MESSAGES: Record<string, string> = {
  vacation:  "That's a vacation waiting for you.",
  invest:    "That's a real start to your portfolio.",
  emergency: "That's 3 months of security, covered.",
  debt:      "That's a debt you could clear for good.",
};

export default function AhaMomentChoiceScreen() {
  const { setOnboardingStep, newOnboardingData, setNewOnboardingData } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const monthlyIncome = newOnboardingData.estimatedIncome || 0;
  const goal = newOnboardingData.pendingSavingsGoal;
  const hasSavingsGoal = !!goal && !!goal.name;
  const monthsToGoal = hasSavingsGoal && monthlyIncome > 0
    ? Math.ceil(goal!.targetAmount / (monthlyIncome * 0.20))
    : null;

  useEffect(() => {
    setOnboardingStep(9);
    trackEvent("onboarding_aha_choice_viewed");
  }, [setOnboardingStep, trackEvent]);

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
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setOnboardingStep(10);
    router.push("/(onboarding)/journey-summary");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const canContinue = hasSavingsGoal || selectedChoice !== null;

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <View style={{ paddingTop: 48, paddingBottom: 16, paddingHorizontal: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <OnboardingBackButton onPress={handleBack} />
          <OnboardingProgressDots currentStep={9} totalSteps={12} />
          <View style={{ width: 36 }} />
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 8, justifyContent: "center", paddingBottom: 80 }}>
        {/* Branch A: has savings goal */}
        {hasSavingsGoal && monthsToGoal !== null && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200, duration: 600 }}
            style={{ marginBottom: 40 }}
          >
            <View className="bg-surfaceDark border border-borderDark rounded-3xl p-6">
              <Text className="text-secondaryDark text-xs font-semibold tracking-widest mb-3">
                YOUR GOAL
              </Text>
              <Text className="text-white text-3xl font-bold mb-3">
                {goal!.name}
              </Text>
              <Text className="text-secondaryDark text-base leading-relaxed">
                At 20% savings, you could reach{" "}
                <Text style={{ color: "#22D97A", fontWeight: "700" }}>
                  {currencySymbol}{goal!.targetAmount.toLocaleString()}
                </Text>
                {" "}in just{" "}
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
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
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200, duration: 600 }}
            style={{ marginBottom: 40 }}
          >
            {selectedChoice ? (
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 400 }}
              >
                <View className="bg-surfaceDark border border-borderDark rounded-3xl p-8">
                  <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "700", textAlign: "center", lineHeight: 38 }}>
                    {AHA_MESSAGES[selectedChoice]}
                  </Text>
                </View>
              </MotiView>
            ) : (
              <View>
                <Text style={{ color: "#EDF0FA", textAlign: "center", fontSize: 32, fontWeight: "700", marginBottom: 28 }}>
                  What would you do with it?
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
                  {AHA_CHOICES.map((choice, i) => (
                    <MotiView
                      key={choice.id}
                      from={{ opacity: 0, translateY: 16 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ delay: 300 + i * 70, duration: 400 }}
                      style={{ flexBasis: "47%" }}
                    >
                      <Pressable
                        onPress={() => handleChoiceSelect(choice.id)}
                        className="active:opacity-70"
                      >
                        <View className="bg-surfaceDark border border-borderDark rounded-3xl items-center" style={{ gap: 14, paddingVertical: 28, paddingHorizontal: 16 }}>
                          <View style={{
                            width: 88, height: 88, borderRadius: 22,
                            backgroundColor: choice.color,
                            alignItems: "center", justifyContent: "center",
                          }}>
                            <choice.Icon size={44} color="#ffffff" />
                          </View>
                          <Text className="text-white font-medium text-center" style={{ fontSize: 16 }}>
                            {choice.label}
                          </Text>
                        </View>
                      </Pressable>
                    </MotiView>
                  ))}
                </View>
              </View>
            )}
          </MotiView>
        )}

        {/* CTA */}
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
      </View>
    </SafeAreaView>
  );
}
