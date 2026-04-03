import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";


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
    router.push("/(onboarding)/category-preselection");
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
      {/* Background glow layer */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        <LinearGradient
          colors={["#090F1E", "#08090F", "#05100C"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        />
        <MotiView
          from={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 300, duration: 1000, type: "timing" }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <Svg style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
            <Defs>
              <RadialGradient id="greenGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <Stop offset="0%"   stopColor="#00FF88" stopOpacity="0.35" />
                <Stop offset="50%"  stopColor="#00CC66" stopOpacity="0.16" />
                <Stop offset="100%" stopColor="#004422" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx="78%" cy="50%" rx={210} ry={210} fill="url(#greenGlow)" />
          </Svg>
        </MotiView>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: "transparent" }} contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}>
        {/* Progress Bar */}
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <View style={{ width: 36 }} />
            <OnboardingProgressDots currentStep={1} totalSteps={11} />
            <Pressable onPress={handleSkip} className="active:opacity-60">
              <Text className="text-accentBlue text-sm font-medium">Skip</Text>
            </Pressable>
          </View>
        </View>

        {/* Text Content */}
        <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 40, justifyContent: "space-between" }}>
          {/* Top: headlines + images */}
          <View>
            {/* First headline */}
            <View style={{ position: "relative" }}>
              {/* Money flying out from "leave" */}
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 500, duration: 700 }}
                style={{ position: "absolute", bottom: 0, right: -38 }}
              >
                <Image
                  source={require("../../assets/pictures/money_flying_out.png")}
                  style={{ width: 130, height: 130 }}
                  resizeMode="contain"
                />
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 24 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400, duration: 700 }}
                style={{ paddingVertical: 12 }}
              >
                <Text
                  style={{
                    fontSize: 36,
                    color: "#EDF0FA",
                    textAlign: "center",
                    fontWeight: "700",
                    lineHeight: 46,
                    textShadowColor: "rgba(0, 0, 0, 0.9)",
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 8,
                  }}
                >
                  Stop watching your money{" "}
                  <Text
                    style={{
                      color: "#F2514A",
                      textShadowColor: "rgba(0, 0, 0, 0.85)",
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 8,
                    }}
                  >
                    leave
                  </Text>
                  .
                </Text>
              </MotiView>
            </View>

            {/* Second headline with money path behind it */}
            <View style={{ position: "relative", marginTop: 12 }}>
              {/* Money path rendered first so text paints on top */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 700, duration: 800 }}
                style={{ position: "absolute", top: 35, right: -60 }}
              >
                <Image
                  source={require("../../assets/pictures/money_path.png")}
                  style={{ width: 460, height: 300 }}
                  resizeMode="contain"
                />
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 24 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 650, duration: 700 }}
                style={{ paddingVertical: 12 }}
              >
                <Text
                  style={{
                    fontSize: 36,
                    color: "#EDF0FA",
                    textAlign: "center",
                    fontWeight: "700",
                    lineHeight: 46,
                    textShadowColor: "rgba(0, 0, 0, 0.9)",
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 8,
                  }}
                >
                  Start deciding where it{" "}
                  <Text
                    style={{
                      color: "#22D97A",
                      textShadowColor: "rgba(0, 0, 0, 0.85)",
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 16,
                    }}
                  >
                    goes
                  </Text>
                  .
                </Text>
              </MotiView>
            </View>
          </View>

          {/* Bottom: button + footer */}
          <View style={{ paddingBottom: 16 }}>
            {/* Sub-headline */}

            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1200, duration: 600 }}
              style={{ marginBottom: 16 }}
            >
              <AnimatedGradientButton
                onPress={handleNext}
                text="Begin your journey"
                rounded="3xl"
              />
            </MotiView>

            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1400, duration: 800 }}
            >
              <Text className="text-secondaryDark text-xs text-center tracking-widest uppercase">
                A mindful approach to money
              </Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1600, duration: 800 }}
              style={{ marginTop: 20 }}
            >
              <Pressable onPress={() => router.push("/(auth)/sign-in")} className="active:opacity-60">
                <Text className="text-accentBlue text-xs text-center">
                  Already have an account? Sign in
                </Text>
              </Pressable>
            </MotiView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
