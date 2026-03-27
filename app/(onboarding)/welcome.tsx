import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
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
      <ScrollView className="flex-1">
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

        <View className="flex-1 px-2 py-8 pt-4">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 800 }}
            className="flex-1"
          >
            {/* Icon/Logo Area */}
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 2, opacity: 1 }}
              transition={{ delay: 200, duration: 800, type: "spring" }}
              className="items-center mt-16 mb-8"
            >
              <Image
                source={require("../../assets/icons/logo-gray-300.png")}
                className="w-20 h-20"
                resizeMode="contain"
              />
            </MotiView>

            {/* Headline */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 400, duration: 800 }}
              className="px-2"
            >
              <Text className="text-4xl text-white text-center leading-tight mb-4 mt-8">
                Stop watching your money{" "}
                <Text className="text-accentRed">leave</Text>.
              </Text>
              <Text className="text-4xl text-white text-center leading-tight">
                Start deciding where it{" "}
                <Text className="text-accentGreen">goes</Text>.
              </Text>
            </MotiView>

            {/* Spacer to push content to bottom */}

            {/* Sub-headline */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 600, duration: 800 }}
              className="mt-16 mb-6"
            >
              <Text className="text-secondaryDark text-lg italic text-center px-6">
                Mastery begins with awareness.
              </Text>
            </MotiView>

            {/* 3 dots animation */}
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 800, duration: 800 }}
              className="flex-row justify-center gap-2 mb-4 mt-4"
            >
              {[0, 1, 2].map((i) => (
                <MotiView
                  key={i}
                  from={{ scale: 1, opacity: 0.5 }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    type: "timing",
                    duration: 2000,
                    loop: true,
                    delay: i * 300,
                  }}
                  className="h-1.5 w-1.5 rounded-full overflow-hidden"
                >
                  <LinearGradient
                    colors={["#1E40AF", "#3B7EFF"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ width: "100%", height: "100%" }}
                  />
                </MotiView>
              ))}
            </MotiView>

            {/* Primary Button */}
            <View className="mb-2">
              <AnimatedGradientButton
                onPress={handleNext}
                text="Begin your journey"
                showIcon
                rounded="3xl"
              />
            </View>

            {/* Bottom decorative text */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1200, duration: 800 }}
              className="mt-4"
            >
              <Text className="text-secondaryDark text-xs text-center tracking-widest uppercase">
                A mindful approach to money
              </Text>
            </MotiView>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
