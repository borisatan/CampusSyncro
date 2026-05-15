import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { setOnboardingStep, completeOnboarding } = useOnboardingStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    setOnboardingStep(1);
    trackEvent("onboarding_welcome_viewed");
  }, [setOnboardingStep]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "welcome",
      step: 1,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setOnboardingStep(2);
    router.push("/(onboarding)/problem-framing");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "welcome",
      step: 1,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    completeOnboarding();
    router.replace("/(auth)/sign-up");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <LinearGradient
        colors={["#090F1E", "#08090F", "#05100C"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      <View style={{ flex: 1, paddingHorizontal: 8 }}>
        {/* Progress dots */}
        <View style={{ paddingTop: 48, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <OnboardingProgressDots currentStep={1} totalSteps={12} />
          </View>
        </View>

        {/* Gate image */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, duration: 700 }}
          style={{ alignItems: "center", justifyContent: "center", marginBottom: 8 }}
        >
          <Image
            source={require("../../assets/pictures/welcome.png")}
            style={{ width: "100%", height: SCREEN_HEIGHT * 0.45 }}
            resizeMode="contain"
          />
        </MotiView>

        {/* Text + buttons */}
        <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 24 }}>
          {/* Headline */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 500, duration: 600 }}
          >
            <Text
              style={{
                fontSize: 36,
                fontWeight: "700",
                color: "#EDF0FA",
                lineHeight: 46,
                textShadowColor: "rgba(0,0,0,0.9)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
              }}
            >
              Take{" "}
              <Text style={{ color: "#3B7EFF" }}>control</Text>
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 700, duration: 600 }}
          >
            <Text
              style={{
                fontSize: 36,
                fontWeight: "700",
                color: "#EDF0FA",
                lineHeight: 46,
                textShadowColor: "rgba(0,0,0,0.9)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
                marginBottom: 16,
              }}
            >
              Chart your{" "}
              <Text style={{ color: "#22D97A" }}>future</Text>
            </Text>
          </MotiView>

          {/* Subtitle */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 900, duration: 600 }}
            style={{ marginBottom: 28 }}
          >
            <Text
              style={{
                fontSize: 15,
                color: "#8A96B4",
                lineHeight: 22,
              }}
            >
              Understand your money, make better decisions and build the life you want.
            </Text>
          </MotiView>

          {/* Primary button */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1100, duration: 600 }}
            style={{ marginBottom: 16 }}
          >
            <AnimatedGradientButton
              onPress={handleNext}
              text="Begin your journey"
              rounded="3xl"
            />
          </MotiView>

          {/* Secondary button */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1300, duration: 800 }}
          >
            <Pressable
              onPress={() => router.push("/(auth)/sign-in")}
              style={{
                borderWidth: 1,
                borderColor: "#3B82F6",
                borderRadius: 24,
                paddingVertical: 14,
                paddingHorizontal: 24,
              }}
              className="active:opacity-60"
            >
              <Text style={{ color: "#3B82F6", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                Already have an account?
              </Text>
            </Pressable>
          </MotiView>
        </View>
      </View>
    </SafeAreaView>
  );
}
