import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { useAnalytics } from "../hooks/useAnalytics";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

export default function AhaMomentScreen() {
  const { setOnboardingStep, newOnboardingData } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  const monthlyIncome = newOnboardingData.estimatedIncome || 0;
  const annualSavings = Math.round(monthlyIncome * 0.20 * 12);

  // Animated count-up for the savings number
  const [displayedAmount, setDisplayedAmount] = useState(0);

  const cardOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.2);
  const subtextOpacity = useSharedValue(0);
  const subtextTranslateY = useSharedValue(12);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(12);

  useEffect(() => {
    setOnboardingStep(9);
    trackEvent("onboarding_aha_moment_viewed");

    // Celebration entrance
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 400);

    cardOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));

    subtextOpacity.value = withDelay(1400, withTiming(1, { duration: 500 }));
    subtextTranslateY.value = withDelay(1400, withTiming(0, { duration: 500 }));
    ctaOpacity.value = withDelay(1600, withTiming(1, { duration: 500 }));
    ctaTranslateY.value = withDelay(1600, withTiming(0, { duration: 500 }));

    // Count-up animation
    if (annualSavings > 0) {
      const duration = 1200;
      const steps = 40;
      const interval = duration / steps;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayedAmount(Math.round(eased * annualSavings));
        if (step >= steps) clearInterval(timer);
      }, interval);
      return () => clearInterval(timer);
    }
  }, [setOnboardingStep, trackEvent]);

  // Persistent glow pulse after count-up
  useEffect(() => {
    const timeout = setTimeout(() => {
      glowOpacity.value = withRepeat(
        withTiming(0.5, { duration: 2500 }),
        -1,
        true,
      );
    }, 1600);
    return () => {
      clearTimeout(timeout);
      cancelAnimation(glowOpacity);
    };
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const subtextAnimStyle = useAnimatedStyle(() => ({
    opacity: subtextOpacity.value,
    transform: [{ translateY: subtextTranslateY.value }],
  }));

  const ctaAnimStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(onboarding)/aha-moment-choice");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(onboarding)/savings-goal");
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
          <OnboardingProgressDots currentStep={9} totalSteps={12} />
          <View style={{ width: 36 }} />
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 8, justifyContent: "center", paddingBottom: 80 }}>
        {/* Savings card with spring entrance */}
        <Animated.View style={[{ marginBottom: 32, alignSelf: "stretch" }, cardAnimStyle]}>
          <View style={{ borderRadius: 24, overflow: "hidden" }}>
            <Animated.View
              style={[
                { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#14532D" },
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
                paddingVertical: 52,
                paddingHorizontal: 28,
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Sparkles size={20} color="#22D97A" />
                <Text style={{ color: "#22D97A", fontSize: 13, fontWeight: "600", letterSpacing: 1.5 }}>
                  YOUR SAVINGS POTENTIAL
                </Text>
              </View>

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                style={{
                  fontSize: 80,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  lineHeight: 88,
                  alignSelf: "stretch",
                  textAlign: "center",
                }}
              >
                {currencySymbol}{displayedAmount > 0 ? displayedAmount.toLocaleString() : annualSavings > 0 ? "0" : "—"}
              </Text>
              <Text style={{ color: "#86EFAC", fontSize: 18, marginTop: 10 }}>
                this year
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Subtext */}
        <Animated.View style={[{ marginBottom: 48 }, subtextAnimStyle]}>
          <Text style={{ color: "#8A96B4", fontSize: 22, textAlign: "center", lineHeight: 34 }}>
            That's real money.{"\n"}Not a guess.
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={ctaAnimStyle}>
          <AnimatedGradientButton
            onPress={handleNext}
            text="See what I'd do with it"
            rounded="3xl"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
