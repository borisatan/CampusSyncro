import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { CurrencySelector } from "../components/Shared/CurrencySelector";
import { OnboardingHeader } from "../components/Shared/OnboardingHeader";
import { useAnalytics } from "../hooks/useAnalytics";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { SupportedCurrency } from "../types/types";
import { parseAmount } from "../utils/parseAmount";


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
    setOnboardingStep(4);
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
      step: 4,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    const incomeValue = parseAmount(amount) || 0;
    setNewOnboardingData({ estimatedIncome: incomeValue, selectedCurrency });
    setOnboardingStep(5);
    router.push("/(onboarding)/cost-of-inattention");
  }, [amount, selectedCurrency, trackEvent, setNewOnboardingData, setOnboardingStep]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

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

  const isValid = amount && parseAmount(amount) > 0;

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <OnboardingHeader
            onBack={handleBack}
            currentStep={4}
            totalSteps={12}
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
                <Image
                  source={require("../../assets/pictures/money_symbol.png")}
                  style={{ width: 200, height: 130 }}
                  resizeMode="contain"
                />
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
                <CurrencySelector
                  selectedCurrency={selectedCurrency}
                  onSelect={handleCurrencySelect}
                  isDarkMode={true}
                />
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
                    borderRadius: 24,
                    backgroundColor: isValid ? "rgba(16,185,129,0.08)" : "#141B2D",
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                  }}
                >
<View style={{ flexDirection: "row", alignItems: "center", paddingTop: 4 }}>
                    <Text
                      style={{
                        color: isValid ? "#10B981" : "#4B5A7A",
                        fontSize: 40,
                        fontWeight: "300",
                        includeFontPadding: false,
                        lineHeight: 48,
                        marginRight: 4,
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
                      placeholderTextColor={isValid ? "#10B981" : "#4B5A7A"}
                      maxLength={8}
                      style={{
                        includeFontPadding: false,
                        paddingVertical: 0,
                        color: "#ffffff",
                        fontSize: 40,
                        fontWeight: "300",
                        flex: 1,
                        lineHeight: 48,
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
                rounded="3xl"
              />
            </MotiView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
