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
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";
import { OnboardingCategoryGrid } from "../components/OnboardingPage/OnboardingCategoryGrid";
import { OnboardingTransactionHero } from "../components/OnboardingPage/OnboardingTransactionHero";
import { SuccessModal } from "../components/Shared/SuccessModal";
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
    if (numAmount === expectedAmount) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackEvent("onboarding_screen_completed", {
        screen: "practice_entry",
        step: 9,
        category: selectedCategory,
        time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
      });
      setShowSuccess(true);
      setNewOnboardingData({ practiceEntryCompleted: true });
    }
  };

  const handleSuccessModalDismiss = () => {
    setShowSuccess(false);
    setOnboardingStep(10);
    router.push("/(onboarding)/subscription-trial");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(8);
    router.push("/(onboarding)/why-manual");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "practice_entry",
      step: 9,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    completeOnboarding();
    router.replace("/(auth)/sign-up");
  };

  const isComplete = parseFloat(amount) === expectedAmount;

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
                  from={{ width: "92.9%" }}
                  animate={{ width: "96.4%" }}
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
              {!showSuccess && (
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
              )}

              {/* Category Grid */}
              {!showSuccess && allCategories.length > 0 && (
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
        {!showSuccess && (
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
                    className="w-full rounded-xl overflow-hidden active:opacity-80"
                    android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <LinearGradient
                      colors={["#DC2626", "#EF4444", "#F87171"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="w-full py-4"
                    >
                      <Text className="text-lg text-center font-medium text-white">
                        Add Transaction
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </MotiView>
              </MotiView>
            ) : (
              <View className="w-full py-4 rounded-xl bg-surfaceDark border border-borderDark">
                <Text className="text-lg text-center font-medium text-secondaryDark">
                  Add Transaction
                </Text>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccess}
        text="Transaction Added!"
        onDismiss={handleSuccessModalDismiss}
      />
    </SafeAreaView>
  );
}
