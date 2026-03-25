import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  CloudRain,
  Eye,
  EyeOff,
  Sun,
  TrendingUp,
} from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingHeader } from "../components/Shared/OnboardingHeader";
import { useAnalytics } from "../hooks/useAnalytics";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

export default function CostOfInattentionScreen() {
  const { setOnboardingStep, newOnboardingData, completeOnboarding } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  const monthlyIncome = newOnboardingData.estimatedIncome || 0;
  const retentionAmount = Math.round(monthlyIncome * 0.15);

  const glowOpacity = useSharedValue(0.3);
  const arrowY = useSharedValue(0);

  useEffect(() => {
    setOnboardingStep(4);
    trackEvent("onboarding_cost_of_inattention_viewed");

    glowOpacity.value = withRepeat(
      withTiming(0.55, { duration: 3000 }),
      -1,
      true,
    );

    arrowY.value = withRepeat(
      withTiming(-5, { duration: 600 }),
      -1,
      true,
    );
  }, [setOnboardingStep, glowOpacity, arrowY]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: arrowY.value }],
  }));

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "cost_of_inattention",
      step: 4,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setOnboardingStep(5);
    router.push("/(onboarding)/budget-setup-choice");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(3);
    router.push("/(onboarding)/monthly-income");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "cost_of_inattention",
      step: 4,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    completeOnboarding();
    router.replace("/(auth)/sign-up");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
        <OnboardingHeader
          onBack={handleBack}
          onSkip={handleSkip}
          fromPercent="42.9%"
          toPercent="57.1%"
        />

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
              <Text className="text-3xl text-white text-center leading-tight">
                The Cost of <Text className="text-accentRed">Inattention</Text>
              </Text>
            </MotiView>

            {/* Comparison Cards */}
            <View className="mb-4">
              {/* Without App Card */}
              <MotiView
                from={{ opacity: 0, translateX: -30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 400, duration: 600 }}
                className="mb-4"
              >
                <View className="bg-surfaceDark border border-borderDark rounded-2xl p-5">
                  <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-12 h-12 rounded-xl bg-inputDark items-center justify-center">
                      <EyeOff size={22} color="#8A96B4" />
                    </View>
                    <Text className="text-white text-lg font-semibold">
                      Without Monelo
                    </Text>
                  </View>
                  <View className="mb-3">
                    <Text className="text-secondaryDark text-xs font-semibold tracking-widest mb-1">
                      MONTHLY RETENTION
                    </Text>
                    <Text className="text-white text-3xl font-bold">
                      {currencySymbol}0
                    </Text>
                  </View>
                  <View className="pt-3 border-t border-borderDark">
                    <Text className="text-secondaryDark text-xs font-semibold tracking-widest mb-1">
                      STATUS
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <CloudRain size={16} color="#8A96B4" />
                      <Text className="text-secondaryDark text-sm">Foggy</Text>
                    </View>
                  </View>
                </View>
              </MotiView>

              {/* With App Card — blue gradient + pulsing glow */}
              <MotiView
                from={{ opacity: 0, translateX: 30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 600, duration: 600 }}
              >
                <View style={{ borderRadius: 16, overflow: "hidden" }}>
                  {/* Pulsing blue glow layer */}
                  <Animated.View
                    style={[
                      {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "#1D4ED8",
                      },
                      glowStyle,
                    ]}
                  />
                  {/* Blue gradient background */}
                  <LinearGradient
                    colors={["#0D1B3E", "#0F2D6B", "#1A4CB0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#3B7EFF",
                      borderRadius: 16,
                      padding: 20,
                    }}
                  >
                    <View className="flex-row items-center gap-3 mb-4">
                      <View
                        style={{ backgroundColor: "#3B7EFF" }}
                        className="w-12 h-12 rounded-xl items-center justify-center"
                      >
                        <Eye size={22} color="#ffffff" />
                      </View>
                      <Text className="text-white text-lg font-semibold">
                        With Monelo
                      </Text>
                    </View>
                    <View className="mb-3">
                      <Text
                        style={{ color: "#93C5FD" }}
                        className="text-xs font-semibold tracking-widest mb-1"
                      >
                        MONTHLY RETENTION
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white text-3xl font-bold">
                          {currencySymbol}{retentionAmount.toLocaleString()}
                        </Text>
                        <Animated.View style={arrowStyle}>
                          <TrendingUp size={22} color="#22D97A" />
                        </Animated.View>
                      </View>
                    </View>
                    <View
                      style={{ borderTopWidth: 1, borderTopColor: "#1E3A6B", paddingTop: 12 }}
                    >
                      <Text
                        style={{ color: "#93C5FD" }}
                        className="text-xs font-semibold tracking-widest mb-1"
                      >
                        STATUS
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Sun size={16} color="#F59E0B" />
                        <Text className="text-accentGreen text-sm">
                          Intentional
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </MotiView>
            </View>

            {/* Footnote */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 800, duration: 600 }}
              className="mb-6"
            >
              <View className="bg-surfaceDark border border-borderDark rounded-xl px-4 py-3">
                <Text className="text-secondaryDark text-xs text-center">
                  Based on the{" "}
                  <Text className="text-accentBlue font-semibold">
                    15% Mindfulness Margin
                  </Text>{" "}
                  regained through manual tracking
                </Text>
              </View>
            </MotiView>

            {/* Spacer to push button to bottom */}
            <View className="flex-1" />

            {/* Continue Button */}
            <View className="mb-2">
              <AnimatedGradientButton
                onPress={handleNext}
                text="Secure my clarity ✦"
                delay={1500}
                rounded="xl"
              />
            </View>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
