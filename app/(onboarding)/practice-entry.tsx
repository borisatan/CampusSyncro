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
import { AUTOPILOT_CATEGORIES } from "./category-autopilot";
import { OnboardingCategoryGrid } from "../components/OnboardingPage/OnboardingCategoryGrid";
import { OnboardingTransactionHero } from "../components/OnboardingPage/OnboardingTransactionHero";
import { SuccessModal } from "../components/Shared/SuccessModal";
import { useOnboardingStore } from "../store/useOnboardingStore";

// Category-specific prompts and amounts
const CATEGORY_PROMPTS: Record<
  string,
  { prefix: string; suffix: string; amount: number }
> = {
  Subscriptions: {
    prefix: "Log your",
    suffix: "Netflix subscription",
    amount: 17.99,
  },
  "Impulse Buys": { prefix: "Log a", suffix: "impulse purchase", amount: 25 },
  "Dining Out": { prefix: "Log your", suffix: "lunch order", amount: 30 },
  Nightlife: { prefix: "Log your", suffix: "bar tab", amount: 35 },
};

export default function PracticeEntryScreen() {
  const { setOnboardingStep, newOnboardingData, setNewOnboardingData } =
    useOnboardingStore();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  // Get autopilot categories from Screen 2 for preselection
  const autopilotCategories =
    newOnboardingData.selectedAutopilotCategories || [];

  // Show all categories, but preselect the first autopilot one
  const allCategories = AUTOPILOT_CATEGORIES.map(cat => cat.name);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    autopilotCategories[0] || allCategories[0] || "",
  );

  useEffect(() => {
    setOnboardingStep(6);
  }, []);

  // Get the current category's expected amount and text
  const currentPrompt = CATEGORY_PROMPTS[selectedCategory] || {
    prefix: "Log a",
    suffix: "Coffee",
    amount: 5,
  };
  const expectedAmount = currentPrompt.amount;

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (numAmount === expectedAmount) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      setNewOnboardingData({ practiceEntryCompleted: true });
    }
  };

  const handleSuccessModalDismiss = () => {
    setShowSuccess(false);
    setOnboardingStep(7);
    router.push("/(onboarding)/subscription-trial");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(5);
    router.push("/(onboarding)/why-manual");
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
              <Text className="text-secondaryDark text-sm">Step 6 of 7</Text>
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
                from={{ width: "71.4%" }}
                animate={{ width: "85.7%" }}
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
            >
              {/* Task heading */}
              <View className="text-center mb-8">
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 200, duration: 600 }}
                >
                  <Text className="text-4xl font-semibold text-white text-center">
                    {currentPrompt.prefix}{" "}
                    <Text className="text-accentGreen">
                      ${currentPrompt.amount}
                    </Text>{" "}
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
                <Pressable
                  onPress={handleSubmit}
                  className="w-full rounded-xl overflow-hidden active:opacity-80"
                  android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
                  style={{
                    shadowColor: "#EF4444",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: 8,
                  }}
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
