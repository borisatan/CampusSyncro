import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

export default function SolutionActOfIntentScreen() {
  const { setOnboardingStep } = useOnboardingStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    setOnboardingStep(3);
    trackEvent("onboarding_solution_viewed");
  }, [setOnboardingStep, trackEvent]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "solution_act_of_intent",
      step: 3,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setOnboardingStep(4);
    router.push("/(onboarding)/use-case");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(onboarding)/problem-framing");
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
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <OnboardingBackButton onPress={handleBack} />
          <OnboardingProgressDots currentStep={3} totalSteps={12} />
          <View style={{ width: 36 }} />
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 8, justifyContent: "center", paddingBottom: 32 }}>
        {/* Main headline */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, duration: 700 }}
          style={{ marginBottom: 44 }}
        >
          <Text
            style={{
              fontSize: 46,
              fontWeight: "700",
              color: "#EDF0FA",
              lineHeight: 58,
            }}
          >
            It takes{" "}
            <Text style={{ color: "#22D97A" }}>3 seconds</Text>
            .{"\n"}That's all.
          </Text>
        </MotiView>

        {/* Icon rows */}
        {[
          { text: "Automation makes spending invisible.", delay: 600 },
          { text: "Logging it yourself makes it real.", delay: 800 },
        ].map(({ text, delay }, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay, duration: 600 }}
            style={{ marginBottom: i === 0 ? 18 : 52, flexDirection: "row", alignItems: "flex-start" }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#22D97A", marginTop: 11, marginRight: 14 }} />
            <Text style={{ flex: 1, fontSize: 22, color: "#8A96B4", lineHeight: 32 }}>
              {text}
            </Text>
          </MotiView>
        ))}

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 1100, duration: 600 }}
        >
          <AnimatedGradientButton
            onPress={handleNext}
            text="I'm in"
            rounded="3xl"
          />
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
