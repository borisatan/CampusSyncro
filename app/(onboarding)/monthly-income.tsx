import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { OnboardingHeader } from "../components/Shared/OnboardingHeader";
import { useAnalytics } from "../hooks/useAnalytics";
import { getCurrencySymbol, SupportedCurrency } from "../types/types";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

const CURRENCIES: { code: SupportedCurrency; label: string }[] = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "Pound" },
  { code: "CAD", label: "CA Dollar" },
  { code: "AUD", label: "AU Dollar" },
  { code: "NZD", label: "NZ Dollar" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "JPY", label: "Yen" },
  { code: "CNY", label: "Yuan" },
  { code: "INR", label: "Rupee" },
  { code: "BRL", label: "Real" },
  { code: "MXN", label: "Peso" },
  { code: "ZAR", label: "Rand" },
  { code: "SEK", label: "Krona" },
];

export default function MonthlyIncomeScreen() {
  const { setOnboardingStep, setNewOnboardingData, completeOnboarding, newOnboardingData } = useOnboardingStore();
  const { currencySymbol, setLocalCurrency } = useCurrencyStore();
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(
    (newOnboardingData.selectedCurrency as SupportedCurrency) ?? "USD"
  );
  const inputRef = useRef<TextInput>(null);
  const screenEnteredAt = useRef(Date.now());
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    setOnboardingStep(3);
    trackEvent("onboarding_monthly_income_viewed");
    // Sync currency store with current selection so symbol shows correctly
    setLocalCurrency(selectedCurrency);
  }, [setOnboardingStep]);

  const handleCurrencySelect = useCallback((code: SupportedCurrency) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCurrency(code);
    setLocalCurrency(code);
    setNewOnboardingData({ selectedCurrency: code });
  }, [setLocalCurrency, setNewOnboardingData]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "monthly_income",
      step: 3,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    const incomeValue = parseFloat(amount) || 0;
    setNewOnboardingData({ estimatedIncome: incomeValue, selectedCurrency });
    setOnboardingStep(4);
    router.push("/(onboarding)/cost-of-inattention");
  }, [amount, selectedCurrency, trackEvent, setNewOnboardingData, setOnboardingStep]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(2);
    router.push("/(onboarding)/category-preselection");
  }, [setOnboardingStep]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "monthly_income",
      step: 3,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    completeOnboarding();
    router.replace("/(auth)/sign-up");
  }, [trackEvent, completeOnboarding]);

  const isValid = amount && parseFloat(amount) > 0;

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <OnboardingHeader
            onBack={handleBack}
            onSkip={handleSkip}
            currentStep={3}
            totalSteps={11}
          />

          <View className="px-2 py-8 pt-4">
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 600 }}
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

              {/* Currency Picker */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 380, duration: 600 }}
                className="mb-4"
              >
                <Text className="text-secondaryDark text-xs text-center mb-2 uppercase tracking-widest">
                  Currency
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
                >
                  {CURRENCIES.map((c) => {
                    const isSelected = selectedCurrency === c.code;
                    return (
                      <Pressable
                        key={c.code}
                        onPress={() => handleCurrencySelect(c.code)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          borderWidth: 1.5,
                          borderColor: isSelected ? "#10B981" : "#2A3352",
                          backgroundColor: isSelected ? "rgba(16,185,129,0.12)" : "#141B2D",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected ? "#10B981" : "#8A96B4",
                            fontWeight: isSelected ? "700" : "400",
                            fontSize: 13,
                          }}
                        >
                          {getCurrencySymbol(c.code)} {c.code}
                        </Text>
                        <Text
                          style={{
                            color: isSelected ? "#10B981" : "#4B5A7A",
                            fontSize: 10,
                            marginTop: 1,
                          }}
                        >
                          {c.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
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
