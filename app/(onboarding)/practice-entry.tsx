import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";
import { OnboardingCategoryGrid } from "../components/OnboardingPage/OnboardingCategoryGrid";
import { SuccessModal } from "../components/Shared/SuccessModal";
import { OnboardingTransactionHero } from "../components/OnboardingPage/OnboardingTransactionHero";
import { V3_DEFAULT_CATEGORIES } from "../constants/onboardingCategories";
import { useAnalytics } from "../hooks/useAnalytics";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

// Category-specific prompts and amounts
const CATEGORY_PROMPTS: Record<
  string,
  { prefix: string; suffix: string; amount: number }
> = {
  Housing: {
    prefix: "Log your",
    suffix: "monthly rent",
    amount: 1200,
  },
  Groceries: {
    prefix: "Log your",
    suffix: "grocery shopping",
    amount: 85,
  },
  "Eating Out": {
    prefix: "Log your",
    suffix: "lunch order",
    amount: 19,
  },
  Subscriptions: {
    prefix: "Log your",
    suffix: "Netflix subscription",
    amount: 16,
  },
  Transport: {
    prefix: "Log your",
    suffix: "gas fill-up",
    amount: 45,
  },
  Shopping: {
    prefix: "Log your",
    suffix: "Amazon order",
    amount: 62,
  },
  Nightlife: {
    prefix: "Log your",
    suffix: "night out",
    amount: 55,
  },
  Healthcare: {
    prefix: "Log your",
    suffix: "pharmacy visit",
    amount: 29,
  },
  Other: {
    prefix: "Log your",
    suffix: "expense",
    amount: 25,
  },
};

export default function PracticeEntryScreen() {
  const { setOnboardingStep, newOnboardingData, setNewOnboardingData, completeOnboarding } =
    useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const amountInputRef = useRef<TextInput>(null);
  const screenEnteredAt = useRef(Date.now());
  const { trackEvent } = useAnalytics();

  // Get selected categories from Screen 2 for preselection
  const selectedCategoriesFromOnboarding =
    newOnboardingData.selectedCategories || newOnboardingData.selectedAutopilotCategories || [];

  // Show all categories but only enable the ones selected earlier
  const allCategories = V3_DEFAULT_CATEGORIES.map((cat) => cat.name);
  const enabledCategories = selectedCategoriesFromOnboarding.length > 0 ? selectedCategoriesFromOnboarding : undefined;
  const [selectedCategory, setSelectedCategory] = useState<string>(
    selectedCategoriesFromOnboarding[0] || allCategories[0] || "",
  );

  useEffect(() => {
    setOnboardingStep(9);
    trackEvent("onboarding_practice_entry_viewed");
  }, [setOnboardingStep, trackEvent]);

  // Get the current category's expected amount and text
  const currentPrompt = CATEGORY_PROMPTS[selectedCategory] || {
    prefix: "Log a",
    suffix: "Coffee",
    amount: 5,
  };
  const expectedAmount = currentPrompt.amount;

  const categoryColor =
    V3_DEFAULT_CATEGORIES.find((cat) => cat.name === selectedCategory)?.color ||
    "#22D97A";

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && amount.trim() !== "") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackEvent("onboarding_screen_completed", {
        screen: "practice_entry",
        step: 9,
        category: selectedCategory,
        time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
      });
      setNewOnboardingData({ practiceEntryCompleted: true });
      setShowSuccess(true);
    }
  };

  const handleSuccessModalDismiss = () => {
    setShowSuccess(false);
    setShowSaveSheet(true);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(onboarding)/why-manual");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "practice_entry",
      step: 9,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    router.replace("/(auth)/sign-up?from=onboarding");
  };

  const isComplete = amount.trim() !== "" && !isNaN(parseFloat(amount));

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* Progress Bar */}
          <View className="px-2 pt-12 pb-4">
            <View className="flex-row items-center justify-between">
              <OnboardingBackButton onPress={handleBack} />
              <OnboardingProgressDots currentStep={9} totalSteps={11} />
              <View style={{ width: 36 }} />
            </View>
          </View>

          <View className="flex-1 px-2 py-8 pt-4">
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 600 }}
            >
              {/* Task heading */}
              <View className="text-center mb-8">
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 200, duration: 600 }}
                >
                  <View className="flex-row justify-center items-baseline">
                    <Text className="text-4xl font-semibold text-white">
                      {currentPrompt.prefix}{" "}
                    </Text>
                    <Text
                      style={{
                        color: categoryColor,
                        fontSize: 36,
                        fontWeight: "600",
                      }}
                    >
                      {currencySymbol}
                    </Text>
                    <AnimatedRollingNumber
                      value={expectedAmount}
                      spinningAnimationConfig={{ duration: 600 }}
                      toFixed={expectedAmount % 1 !== 0 ? 2 : 0}
                      textStyle={{
                        color: categoryColor,
                        fontSize: 36,
                        fontWeight: "600",
                      }}
                    />
                  </View>
                  <Text
                    style={{ color: categoryColor }}
                    className="text-4xl font-semibold text-center"
                  >
                    {currentPrompt.suffix}
                  </Text>
                </MotiView>
              </View>

              {/* Amount input */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 300, duration: 600 }}
              >
                <OnboardingTransactionHero
                  amount={amount}
                  setAmount={setAmount}
                  isDarkMode={true}
                  amountInputRef={amountInputRef}
                />
              </MotiView>

              {/* Description field */}
              <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 400, duration: 600 }}
                  className="mb-6"
                >
                  <Text className="text-sm text-slate300 mb-2">
                    Note (optional)
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add a note"
                    placeholderTextColor="#475569"
                    className="w-full px-4 py-3 rounded-xl bg-inputDark border border-borderDark text-textDark"
                  />
                </MotiView>

              {/* Category Grid */}
              {allCategories.length > 0 && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 500, duration: 600 }}
                >
                  <OnboardingCategoryGrid
                    categories={allCategories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    isDarkMode={true}
                    enabledCategories={enabledCategories}
                  />
                </MotiView>
              )}
            </MotiView>
          </View>
        </ScrollView>

        {/* Submit button - Fixed at bottom */}
        <View className="px-2 mb-10 py-2">
            {isComplete ? (
              <MotiView
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  type: "timing",
                  duration: 1500,
                  loop: true,
                }}
              >
                <MotiView
                  animate={{
                    shadowOpacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    type: "timing",
                    duration: 2000,
                    loop: true,
                  }}
                  style={{
                    shadowColor: "#EF4444",
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: 24,
                    elevation: 8,
                  }}
                >
                  <Pressable
                    onPress={handleSubmit}
                    className="w-full rounded-3xl overflow-hidden active:opacity-80"
                    android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <LinearGradient
                      colors={["#DC2626", "#EF4444", "#F87171"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: '100%', paddingVertical: 16 }}
                    >
                      <Text className="text-lg text-center font-medium text-white">
                        Add Transaction
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </MotiView>
              </MotiView>
            ) : (
              <View className="w-full py-4 rounded-3xl bg-surfaceDark border border-borderDark">
                <Text className="text-lg text-center font-medium text-secondaryDark">
                  Add Transaction
                </Text>
              </View>
            )}
          </View>
      </KeyboardAvoidingView>
      <SuccessModal
        visible={showSuccess}
        text="Transaction Added!"
        onDismiss={handleSuccessModalDismiss}
      />

      <Modal
        visible={showSaveSheet}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View className="bg-surfaceDark rounded-t-3xl px-6 pt-8 pb-12">
            <Text style={{ fontSize: 32, textAlign: "center", marginBottom: 8, fontFamily: undefined }}>🎉</Text>
            <Text className="text-2xl font-bold text-white text-center mb-3">
              Don't lose your progress
            </Text>
            <Text className="text-base text-slate300 text-center mb-8">
              Create a free account to save your transactions and budgets!
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace("/(auth)/sign-up?from=onboarding");
              }}
              className="w-full rounded-3xl overflow-hidden active:opacity-80"
              android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
            >
              <LinearGradient
                colors={["#1D4ED8", "#3B7EFF", "#60A5FA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: "100%", paddingVertical: 16 }}
              >
                <Text className="text-lg text-center font-medium text-white">
                  Save my progress
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
