import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

export default function ProblemFramingScreen() {
  const { setOnboardingStep } = useOnboardingStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    setOnboardingStep(2);
    trackEvent("onboarding_problem_framing_viewed");
  }, [setOnboardingStep, trackEvent]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "problem_framing",
      step: 2,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setOnboardingStep(3);
    router.push("/(onboarding)/solution-act-of-intent");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <LinearGradient
        colors={["#0F0A1E", "#08090F", "#08090F"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      <View style={{ paddingTop: 48, paddingBottom: 16, paddingHorizontal: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          <OnboardingProgressDots currentStep={2} totalSteps={12} />
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center", paddingBottom: 64 }}>
        {/* Main question */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, duration: 700 }}
          style={{ marginBottom: 36 }}
        >
          <Text
            style={{
              fontSize: 38,
              fontWeight: "700",
              color: "#EDF0FA",
              lineHeight: 50,
            }}
          >
            Is your account{" "}
            <Text style={{ color: "#F87171" }}>empty</Text>
            {" "}by the second week of the month?
          </Text>
        </MotiView>

        {/* Supporting lines */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 600, duration: 600 }}
          style={{ marginBottom: 14 }}
        >
          <Text style={{ fontSize: 18, color: "#8A96B4", lineHeight: 28 }}>
            Feeling anxious about your money?
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 800, duration: 600 }}
          style={{ marginBottom: 64 }}
        >
          <Text style={{ fontSize: 18, color: "#8A96B4", lineHeight: 28 }}>
            Spending on things that don't actually matter?
          </Text>
        </MotiView>

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 1100, duration: 600 }}
        >
          <AnimatedGradientButton
            onPress={handleNext}
            text="That's me"
            rounded="3xl"
          />
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
