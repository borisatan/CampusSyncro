import { Ionicons } from "@expo/vector-icons";
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
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

export default function MonthlyIncomeScreen() {
  const { setOnboardingStep, setNewOnboardingData } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const [amount, setAmount] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setOnboardingStep(3);
    // Auto-focus on input after a short delay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 600);
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const incomeValue = parseFloat(amount) || 0;
    setNewOnboardingData({ estimatedIncome: incomeValue });
    setOnboardingStep(4);
    router.push("/(onboarding)/cost-of-inattention");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(2);
    router.push("/(onboarding)/category-autopilot");
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
              <Text className="text-secondaryDark text-sm">Step 3 of 7</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.replace("/(tabs)/dashboard");
                }}
                className="active:opacity-60"
              >
                <Text className="text-accentBlue text-sm font-medium">
                  Skip
                </Text>
              </Pressable>
            </View>
            <View className="h-1 bg-surfaceDark rounded-full overflow-hidden">
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
                    repeatDelay: 1500,
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
                <View className="w-16 h-16 rounded-xl bg-accentGreen items-center justify-center">
                  <Ionicons name="cash-outline" size={32} color="#ffffff" />
                </View>
              </MotiView>

              {/* Headline */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 300, duration: 600 }}
                className="mb-2 px-4"
              >
                <Text className="text-3xl text-white text-center leading-tight">
                  What's your rough monthly take-home pay?
                </Text>
              </MotiView>

              {/* Subtext */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 350, duration: 600 }}
                className="mb-6 px-4"
              >
                <Text className="text-secondaryDark text-base text-center">
                  A rough estimate is enough
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
                  className={`rounded-xl p-2 border-2 ${
                    isValid
                      ? "bg-accentGreen/10 border-accentGreen"
                      : "bg-surfaceDark border-borderDark"
                  }`}
                >
                  <View className="flex-row items-center justify-center">
                    <Text
                      className={`text-4xl ${
                        isValid ? "text-accentGreen" : "text-secondaryDark"
                      }`}
                    >
                      {currencySymbol}
                    </Text>
                    <TextInput
                      ref={inputRef}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#ffffff"
                      maxLength={8}
                      style={{
                        includeFontPadding: false,
                        paddingVertical: 0,
                        lineHeight: 60,
                      }}
                      className={`text-5xl font-light min-w-[20px] text-center ${
                        isValid ? "text-accentGreen" : "text-white"
                      }`}
                    />
                  </View>
                </View>
              </MotiView>

              {/* Continue Button */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 500, duration: 500 }}
              >
                <Pressable
                  onPress={handleNext}
                  disabled={!isValid}
                  className={`w-full py-4 rounded-xl ${
                    !isValid
                      ? "bg-surfaceDark border border-borderDark"
                      : "bg-accentBlue active:opacity-80"
                  }`}
                  android_ripple={
                    isValid ? { color: "rgba(255, 255, 255, 0.1)" } : undefined
                  }
                >
                  <Text
                    className={`text-lg text-center font-medium ${
                      !isValid ? "text-secondaryDark" : "text-white"
                    }`}
                  >
                    Calculate my margin
                  </Text>
                </Pressable>
              </MotiView>
            </MotiView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
