import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { useAnalytics } from "../hooks/useAnalytics";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

export default function MonthlyIncomeScreen() {
  const { setOnboardingStep, setNewOnboardingData, completeOnboarding } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const [amount, setAmount] = useState("");
  const inputRef = useRef<TextInput>(null);
  const screenEnteredAt = useRef(Date.now());
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    setOnboardingStep(3);
    trackEvent("onboarding_monthly_income_viewed");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 600);
  }, [setOnboardingStep]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "monthly_income",
      step: 3,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    const incomeValue = parseFloat(amount) || 0;
    setNewOnboardingData({ estimatedIncome: incomeValue });
    setOnboardingStep(4);
    router.push("/(onboarding)/cost-of-inattention");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(2);
    router.push("/(onboarding)/category-preselection");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "monthly_income",
      step: 3,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    completeOnboarding();
    router.replace("/(auth)/sign-up");
  };

  const isValid = amount && parseFloat(amount) > 0;

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {/* Progress Bar */}
          <View className="px-2 pt-12 pb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Pressable
                onPress={handleBack}
                className="flex-row items-center gap-1 active:opacity-60"
              >
                <ChevronLeft size={20} color="#8A96B4" />
                <Text className="text-secondaryDark text-sm">Back</Text>
              </Pressable>
              <Pressable
                onPress={handleSkip}
                className="active:opacity-60"
              >
                <Text className="text-accentBlue text-sm font-medium">
                  Skip
                </Text>
              </Pressable>
            </View>
            <View className="items-center">
              <View className="h-2 bg-surfaceDark rounded-full overflow-hidden" style={{ width: '33%' }}>
                <MotiView
                  from={{ width: "28.6%" }}
                  animate={{ width: "42.9%" }}
                  transition={{ type: "timing", duration: 500 }}
                  className="h-full overflow-hidden relative"
                >
                  <LinearGradient
                    colors={["#1E40AF", "#3B7EFF", "#60A5FA"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ width: "100%", height: "100%" }}
                  />
                  <MotiView
                    from={{ translateX: -200 }}
                    animate={{ translateX: 200 }}
                    transition={{
                      type: "timing",
                      duration: 3000,
                      loop: true,
                      delay: 1500,
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: 100,
                    }}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255, 255, 255, 0)",
                        "rgba(255, 255, 255, 0.3)",
                        "rgba(255, 255, 255, 0)",
                      ]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </MotiView>
                </MotiView>
              </View>
            </View>
          </View>

          <View className="flex-1 px-2 py-8 pt-4">
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 600 }}
              className="flex-1"
            >
              {/* Icon */}
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 200, duration: 600 }}
                className="items-center mb-6"
              >
                {/* Coin shadow/ring behind */}
                <View
                  style={{
                    position: "absolute",
                    top: 12,
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "#065F46",
                  }}
                />
                {/* Main coin circle */}
                <LinearGradient
                  colors={["#34D399", "#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 34, fontWeight: "800" }}>$</Text>
                </LinearGradient>
              </MotiView>

              {/* Headline */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 300, duration: 600 }}
                className="mb-2 px-4"
              >
                <Text className="text-3xl text-white text-center leading-tight">
                  What&apos;s your rough monthly{" "}
                  <Text className="text-accentGreen">take-home pay?</Text>
                </Text>
              </MotiView>

              {/* Subtext */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 350, duration: 600 }}
                className="mb-6 px-4"
              >
                <Text className="text-secondaryDark text-sm text-center">
                  This helps us calculate your potential savings. Just a rough estimate is fine.
                </Text>
              </MotiView>

              {/* Amount Input */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400, duration: 600 }}
                className="mb-6"
              >
                <View
                  style={{
                    borderWidth: 2,
                    borderColor: isValid ? "#10B981" : "#2A3352",
                    borderRadius: 16,
                    backgroundColor: isValid ? "rgba(16,185,129,0.08)" : "#141B2D",
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    overflow: "hidden",
                  }}
                >

                  <Text className="text-secondaryDark text-sm text-center mb-2">
                    Monthly Take-Home
                  </Text>
                  <View className="flex-row items-center justify-center gap-3">
                    <Text
                      style={{
                        color: isValid ? "#10B981" : "#4B5A7A",
                        fontSize: 32,
                        fontWeight: "300",
                      }}
                    >
                      {currencySymbol}
                    </Text>
                    <TextInput
                      ref={inputRef}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={isValid ? "#10B981" : "#ffffff"}
                      maxLength={8}
                      style={{
                        includeFontPadding: false,
                        paddingVertical: 0,
                        lineHeight: 60,
                        color: "#ffffff",
                        fontSize: 48,
                        fontWeight: "300",
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    />
                  </View>
                </View>
              </MotiView>

              {/* Continue Button */}
              <AnimatedGradientButton
                onPress={handleNext}
                text="Calculate my margin"
                disabled={!isValid}
                delay={500}
                rounded="xl"
                gradientColors={["#059669", "#10B981", "#34D399"]}
              />
            </MotiView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
