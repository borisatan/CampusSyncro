import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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
import { OnboardingHeader } from "../components/Shared/OnboardingHeader";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { parseAmount } from "../utils/parseAmount";

const GOAL_PRESETS = [
  { id: "emergency", label: "Emergency Fund", suggestedAmount: 5000 },
  { id: "vacation",  label: "Vacation",       suggestedAmount: 2000 },
  { id: "car",       label: "New Car",         suggestedAmount: 10000 },
  { id: "custom",    label: "Something else",  suggestedAmount: null  },
] as const;

const DEFAULT_ICON = "flag-outline";
const DEFAULT_COLOR = "#a78bfa";

export default function SavingsGoalScreen() {
  const { setNewOnboardingData, newOnboardingData, setOnboardingStep } = useOnboardingStore();
  const currencySymbol = useCurrencyStore((s) => s.currencySymbol) || "$";
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());
  const nameInputRef = useRef<TextInput>(null);

  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const estimatedIncome = newOnboardingData.estimatedIncome || 0;
  const incomeHint = estimatedIncome > 0
    ? { low: Math.round(estimatedIncome * 0.10), high: Math.round(estimatedIncome * 0.20) }
    : null;

  useEffect(() => {
    setOnboardingStep(5);
    trackEvent("onboarding_savings_goal_viewed");
  }, []);

  const canSave = name.trim().length > 0 && parseAmount(targetAmount) > 0;

  const navigateNext = () => router.push("/(onboarding)/cost-of-inattention");

  const handlePresetSelect = (preset: typeof GOAL_PRESETS[number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackEvent("onboarding_savings_goal_preset_selected", { preset: preset.id, step: 5 });
    setSelectedPresetId(preset.id);
    if (preset.id !== "custom") {
      setName(preset.label);
      if (preset.suggestedAmount) {
        setTargetAmount(String(preset.suggestedAmount));
      }
    } else {
      setName("");
      setTargetAmount("");
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "savings_goal",
      step: 5,
      skipped: false,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setNewOnboardingData({
      pendingSavingsGoal: {
        name: name.trim(),
        targetAmount: parseAmount(targetAmount),
        monthlyContribution: null,
        icon: DEFAULT_ICON,
        color: DEFAULT_COLOR,
      },
    });
    navigateNext();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "savings_goal",
      step: 5,
      skipped: true,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    navigateNext();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(onboarding)/monthly-income");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <OnboardingHeader
        onBack={handleBack}
        currentStep={5}
        totalSteps={12}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 8 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Headline */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 150, duration: 500 }}
            className="pt-4 mb-6"
          >
            <Text className="text-3xl text-white font-bold text-center leading-tight mb-1">
              What are you{" "}
              <Text className="text-accentBlue">saving for?</Text>
            </Text>
            <Text className="text-secondaryDark text-center text-sm">
              You can always add more goals later
            </Text>
          </MotiView>

          {/* Preset chips */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 250, duration: 400 }}
            className="mb-5"
          >
            <View className="flex-row flex-wrap gap-3">
              {GOAL_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => handlePresetSelect(preset)}
                    className="active:opacity-70"
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: 100,
                      borderWidth: 1.5,
                      borderColor: isSelected ? "#a78bfa" : "#2A3250",
                      backgroundColor: isSelected ? "rgba(167,139,250,0.12)" : "#161B2E",
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#a78bfa" : "#8A96B4",
                        fontWeight: isSelected ? "600" : "400",
                        fontSize: 14,
                      }}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </MotiView>

          {/* Goal Name */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 320, duration: 400 }}
            className="mb-4"
          >
            <Text className="text-secondaryDark text-sm mb-2">Goal Name</Text>
            <TextInput
              ref={nameInputRef}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Vacation Fund, Emergency Savings"
              placeholderTextColor="#64748B"
              className="px-4 py-3 rounded-xl bg-surfaceDark border border-borderDark text-white"
            />
          </MotiView>

          {/* Target Amount */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 370, duration: 400 }}
            className="mb-4"
          >
            <Text className="text-secondaryDark text-sm mb-2">Target Amount</Text>
            <View className="flex-row items-center px-4 py-3 rounded-xl bg-surfaceDark border border-borderDark">
              <Text className="text-white/70 text-lg mr-2" style={{ lineHeight: 18 }}>
                {currencySymbol}
              </Text>
              <TextInput
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="0"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                className="flex-1 text-lg text-white"
                style={{ lineHeight: 18 }}
              />
            </View>
          </MotiView>

          {/* Income tip */}
          {incomeHint ? (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 420, duration: 400 }}
              className="mb-6"
            >
              <View
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: "#a78bfa",
                  paddingLeft: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  Tip: Saving 10–20% of your income ={" "}
                  <Text style={{ color: "#a78bfa" }}>
                    {currencySymbol}{incomeHint.low.toLocaleString()}–{currencySymbol}{incomeHint.high.toLocaleString()}/month
                  </Text>
                </Text>
              </View>
            </MotiView>
          ) : (
            <View className="mb-6" />
          )}

          {/* CTA */}
          <AnimatedGradientButton
            onPress={handleSave}
            text="Save & Continue"
            rounded="3xl"
            disabled={!canSave}
          />

          {/* Ghost skip */}
          <Pressable
            onPress={handleSkip}
            className="items-center mt-6 py-2 active:opacity-60"
          >
            <Text style={{ color: "#4B5A7A", fontSize: 12 }}>Set this up later</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
