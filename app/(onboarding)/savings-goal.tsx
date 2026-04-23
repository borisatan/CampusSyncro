import { Ionicons } from "@expo/vector-icons";
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
  TouchableOpacity,
  View,
} from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { ColorPicker } from "../components/Shared/ColorPicker";
import { OnboardingHeader } from "../components/Shared/OnboardingHeader";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { parseAmount } from "../utils/parseAmount";

const GOAL_ICONS = [
  "flag-outline", "trophy-outline", "ribbon-outline", "star-outline", "rocket-outline", "flash-outline",
  "home-outline", "key-outline", "bed-outline", "business-outline", "hammer-outline", "construct-outline",
  "airplane-outline", "car-outline", "train-outline", "bus-outline", "bicycle-outline", "boat-outline",
  "map-outline", "globe-outline", "compass-outline", "trail-sign-outline", "navigate-outline", "location-outline",
  "wallet-outline", "cash-outline", "card-outline", "diamond-outline", "trending-up-outline", "bar-chart-outline",
  "receipt-outline", "pricetag-outline", "gift-outline", "bag-outline", "cart-outline", "storefront-outline",
  "heart-outline", "people-outline", "person-outline", "baby-outline", "paw-outline", "rose-outline",
  "fitness-outline", "barbell-outline", "medkit-outline", "leaf-outline", "pulse-outline", "nutrition-outline",
  "school-outline", "book-outline", "library-outline", "laptop-outline", "pencil-outline", "briefcase-outline",
  "film-outline", "musical-notes-outline", "game-controller-outline", "headset-outline", "camera-outline", "ticket-outline",
  "restaurant-outline", "cafe-outline", "wine-outline", "beer-outline", "pizza-outline", "ice-cream-outline",
  "phone-portrait-outline", "desktop-outline", "hardware-chip-outline", "tv-outline", "color-palette-outline", "brush-outline",
  "sunny-outline", "moon-outline", "snow-outline", "umbrella-outline", "flower-outline", "planet-outline",
  "american-football-outline", "basketball-outline", "tennisball-outline", "baseball-outline", "football-outline", "golf-outline",
  "shirt-outline", "glasses-outline", "watch-outline", "newspaper-outline", "calculator-outline", "cube-outline",
];

const DEFAULT_ICON = "flag-outline";
const DEFAULT_COLOR = "#a78bfa";
const COLS = 2;

export default function SavingsGoalScreen() {
  const { setNewOnboardingData, completeOnboarding } = useOnboardingStore();
  const currencySymbol = useCurrencyStore((s) => s.currencySymbol) || "$";
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_ICON);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);

  useEffect(() => {
    trackEvent("onboarding_savings_goal_viewed");
  }, [trackEvent]);

  const canSave = name.trim().length > 0 && parseAmount(targetAmount) > 0;

  const navigateNext = () => router.push("/(onboarding)/category-preselection");

  const handleSave = () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "savings_goal",
      step: 2,
      skipped: false,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setNewOnboardingData({
      pendingSavingsGoal: {
        name: name.trim(),
        targetAmount: parseAmount(targetAmount),
        monthlyContribution: parseAmount(monthlyContribution) > 0 ? parseAmount(monthlyContribution) : null,
        icon: selectedIcon,
        color: selectedColor,
      },
    });
    navigateNext();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "savings_goal",
      step: 2,
      skipped: true,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    navigateNext();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(onboarding)/use-case");
  };

  const handleHeaderSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "savings_goal",
      step: 2,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    completeOnboarding();
    router.replace("/(auth)/sign-up");
  };

  const monthsToGoal =
    parseAmount(monthlyContribution) > 0 && parseAmount(targetAmount) > 0
      ? Math.ceil(parseAmount(targetAmount) / parseAmount(monthlyContribution))
      : null;

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <OnboardingHeader
        onBack={handleBack}
        onSkip={handleHeaderSkip}
        currentStep={2}
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
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 150, duration: 500 }}
            className="pt-4 mb-6"
          >
            <Text className="text-3xl text-white font-bold text-center leading-tight mb-1">
              Set up your{" "}
              <Text className="text-accentBlue">savings goal</Text>
            </Text>
            <Text className="text-secondaryDark text-center text-sm">
              You can always add more goals later
            </Text>
          </MotiView>

          {/* Live preview card */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 250, duration: 400 }}
            className="mx-2 mb-6"
          >
            <View className="rounded-3xl p-6 items-center justify-center border bg-surfaceDark border-borderDark">
              <View
                className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
                style={{ backgroundColor: selectedColor }}
              >
                <Ionicons name={selectedIcon as any} size={40} color="#FFFFFF" />
              </View>
              <Text className="text-textDark text-xl font-bold text-center" numberOfLines={1}>
                {name || "Goal Name"}
              </Text>
              {parseAmount(targetAmount) > 0 && (
                <Text className="text-secondaryDark text-sm mt-1">
                  {currencySymbol}{parseAmount(targetAmount).toLocaleString()} target
                </Text>
              )}
            </View>
          </MotiView>

          {/* Goal Name */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300, duration: 400 }}
            className="mb-4"
          >
            <Text className="text-secondaryDark text-sm mb-2">Goal Name</Text>
            <TextInput
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
            transition={{ delay: 350, duration: 400 }}
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

          {/* Monthly Contribution */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 400, duration: 400 }}
            className="mb-4"
          >
            <Text className="text-secondaryDark text-sm mb-2">
              Monthly Contribution{" "}
              <Text className="text-slateMuted">(optional)</Text>
            </Text>
            <View className="flex-row items-center px-4 py-3 rounded-xl bg-surfaceDark border border-borderDark">
              <Text className="text-white/70 text-lg mr-2" style={{ lineHeight: 18 }}>
                {currencySymbol}
              </Text>
              <TextInput
                value={monthlyContribution}
                onChangeText={setMonthlyContribution}
                placeholder="0"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                className="flex-1 text-lg text-white"
                style={{ lineHeight: 18 }}
              />
            </View>
            {monthsToGoal !== null && (
              <Text className="text-secondaryDark text-xs mt-1.5">
                ≈ {monthsToGoal} months to reach goal
              </Text>
            )}
          </MotiView>

          {/* Icon Picker */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 450, duration: 400 }}
            className="mb-4"
          >
            <Text className="text-secondaryDark text-sm mb-2">Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row" }}>
                {Array.from({ length: Math.ceil(GOAL_ICONS.length / COLS) }).map((_, colIndex) => (
                  <View key={colIndex} style={{ flexDirection: "column", marginRight: 8 }}>
                    {GOAL_ICONS.slice(colIndex * COLS, colIndex * COLS + COLS).map((icon) => {
                      const isSelected = selectedIcon === icon;
                      return (
                        <TouchableOpacity
                          key={icon}
                          onPress={() => setSelectedIcon(icon)}
                          activeOpacity={0.7}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 8,
                            backgroundColor: isSelected ? selectedColor : "#1F2937",
                            borderWidth: 1.5,
                            borderColor: isSelected ? selectedColor : "#374151",
                          }}
                        >
                          <Ionicons
                            name={icon as any}
                            size={22}
                            color={isSelected ? "#FFFFFF" : "#6B7280"}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </MotiView>

          {/* Color Picker */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 500, duration: 400 }}
            className="mb-6"
          >
            <ColorPicker
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
              isDarkMode
            />
          </MotiView>

          {/* CTA */}
          <AnimatedGradientButton
            onPress={handleSave}
            text="Save & Continue"
            rounded="3xl"
            disabled={!canSave}
          />

          {/* Skip for now */}
          <Pressable
            onPress={handleSkip}
            className="items-center mt-4 py-2 active:opacity-60"
          >
            <Text className="text-secondaryDark text-sm">Skip for now</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
