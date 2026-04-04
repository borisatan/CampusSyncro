import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { V3_DEFAULT_CATEGORIES } from "../constants/onboardingCategories";
import { useAnalytics } from "../hooks/useAnalytics";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

export default function ManualBudgetSetupScreen() {
  const { setOnboardingStep, setNewOnboardingData, newOnboardingData } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  const selectedCategories = newOnboardingData.selectedCategories || [];
  const monthlyIncome = newOnboardingData.estimatedIncome || 0;

  // Budget mode: 'fixed' = dollar amounts, 'percentage' = % of income
  const [budgetMode, setBudgetMode] = useState<'fixed' | 'percentage'>('fixed');

  const toggleProgress = useSharedValue(0);
  useEffect(() => {
    toggleProgress.value = withTiming(budgetMode === 'percentage' ? 1 : 0, { duration: 200 });
  }, [budgetMode]);
  const sliderStyle = useAnimatedStyle(() => ({
    left: `${toggleProgress.value * 50}%` as any,
  }));
  const fixedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(toggleProgress.value, [0, 1], ['#ffffff', '#64748B']),
  }));
  const percentTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(toggleProgress.value, [0, 1], ['#64748B', '#ffffff']),
  }));

  // Store budgets as amounts (convert from percentage when needed)
  const [budgets, setBudgets] = useState<Record<string, number>>({});

  useEffect(() => {
    setOnboardingStep(7);
    trackEvent("onboarding_manual_budget_setup_viewed");
  }, [setOnboardingStep, trackEvent]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(5);
    router.push("/(onboarding)/budget-setup-choice");
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_manual_budget_applied", {
      step: 7,
      category_count: Object.keys(budgets).length,
      total_budgeted: totalBudgeted,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });

    // Save budget allocations to onboarding store
    const categoryBudgets = Object.entries(budgets).map(([categoryName, amount]) => ({
      category_name: categoryName,
      budget_amount: amount,
      budget_percentage: monthlyIncome > 0 ? Math.round((amount / monthlyIncome) * 100 * 10) / 10 : 0,
    }));

    setNewOnboardingData({
      budgetSetupChoice: 'manual',
      categoryBudgets,
    });

    setOnboardingStep(8);
    router.push("/(onboarding)/why-manual");
  };

  const updateBudget = (categoryName: string, value: string) => {
    const numValue = parseFloat(value) || 0;

    if (budgetMode === 'fixed') {
      setBudgets(prev => ({ ...prev, [categoryName]: numValue }));
    } else {
      // Convert percentage to amount
      const amount = Math.round((numValue / 100) * monthlyIncome);
      setBudgets(prev => ({ ...prev, [categoryName]: amount }));
    }
  };

  const getBudgetDisplay = (categoryName: string) => {
    const amount = budgets[categoryName] || 0;
    if (budgetMode === 'fixed') {
      return amount.toString();
    } else {
      const percentage = monthlyIncome > 0 ? Math.round((amount / monthlyIncome) * 100 * 10) / 10 : 0;
      return percentage.toString();
    }
  };

  const getBudgetEquivalent = (categoryName: string) => {
    const amount = budgets[categoryName] || 0;
    if (budgetMode === 'fixed') {
      const percentage = monthlyIncome > 0 ? Math.round((amount / monthlyIncome) * 100 * 10) / 10 : 0;
      return `${percentage}% of income`;
    } else {
      return `${currencySymbol}${amount.toLocaleString()}`;
    }
  };

  // Get category color
  const getCategoryColor = (name: string) => {
    return V3_DEFAULT_CATEGORIES.find((c) => c.name === name)?.color || '#6B7280';
  };

  // Get category icon
  const getCategoryIcon = (name: string) => {
    return (V3_DEFAULT_CATEGORIES.find((c) => c.name === name)?.icon || 'apps-outline') as keyof typeof Ionicons.glyphMap;
  };

  const totalBudgeted = Object.values(budgets).reduce((sum, amount) => sum + amount, 0);
  const totalPercentage = monthlyIncome > 0 ? Math.round((totalBudgeted / monthlyIncome) * 100 * 10) / 10 : 0;
  const remaining = monthlyIncome - totalBudgeted;
  const isValid = Object.keys(budgets).length > 0 && totalBudgeted <= monthlyIncome;

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
              <OnboardingProgressDots currentStep={7} totalSteps={11} />
              <View style={{ width: 36 }} />
            </View>
          </View>

          <View className="flex-1 px-2 py-8 pt-4">
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 600 }}
            >
              {/* Headline */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 200, duration: 600 }}
                className="mb-4"
              >
                <Text className="text-3xl text-white text-center leading-tight mb-2">
                  Set Your Budgets
                </Text>
                <Text className="text-secondaryDark text-sm text-center">
                  Monthly Income: {currencySymbol}{monthlyIncome.toLocaleString()}
                </Text>
              </MotiView>

              {/* Summary Card */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 300, duration: 600 }}
                className="mb-6"
              >
                <View className="bg-surfaceDark border border-borderDark rounded-3xl p-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-secondaryDark text-sm">Total Budgeted</Text>
                    <Text className="text-white text-lg font-bold">
                      {currencySymbol}{totalBudgeted.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-secondaryDark text-sm">Remaining</Text>
                    <Text
                      className={`text-lg font-bold ${
                        remaining < 0 ? 'text-accentRed' : 'text-accentGreen'
                      }`}
                    >
                      {currencySymbol}{Math.abs(remaining).toLocaleString()}
                    </Text>
                  </View>
                  <View className="mt-2 pt-2 border-t border-borderDark">
                    <Text className="text-secondaryDark text-xs text-center">
                      {totalPercentage}% of income allocated
                      {totalPercentage <= 80 && ` • ${80 - totalPercentage}% available for savings`}
                    </Text>
                  </View>
                </View>
              </MotiView>

              {/* Mode Toggle */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400, duration: 600 }}
                className="mb-6"
              >
                <View className="rounded-3xl flex-row bg-inputDark border border-borderDark overflow-hidden">
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '50%',
                        borderRadius: 11,
                        backgroundColor: '#3B7EFF',
                      },
                      sliderStyle,
                    ]}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (budgetMode !== 'fixed') trackEvent("onboarding_budget_mode_toggled", { mode: "fixed" });
                      setBudgetMode('fixed');
                    }}
                    className="flex-1 py-2.5 z-10"
                    activeOpacity={0.7}
                  >
                    <Animated.Text style={[{ textAlign: 'center', fontWeight: '500', fontSize: 13 }, fixedTextStyle]}>
                      Fixed Amount
                    </Animated.Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (budgetMode !== 'percentage') trackEvent("onboarding_budget_mode_toggled", { mode: "percentage" });
                      setBudgetMode('percentage');
                    }}
                    className="flex-1 py-2.5 z-10"
                    activeOpacity={0.7}
                  >
                    <Animated.Text style={[{ textAlign: 'center', fontWeight: '500', fontSize: 13 }, percentTextStyle]}>
                      % of Income
                    </Animated.Text>
                  </TouchableOpacity>
                </View>
              </MotiView>

              {/* Category Budget Inputs */}
              <View className="mb-6">
                {selectedCategories.map((categoryName, index) => (
                  <MotiView
                    key={categoryName}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ delay: 500 + index * 100, duration: 500 }}
                    className="mb-3"
                  >
                    <View className="bg-surfaceDark border border-borderDark rounded-3xl p-4">
                      <View className="flex-row items-center gap-3 mb-3">
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center"
                          style={{ backgroundColor: getCategoryColor(categoryName) }}
                        >
                          <Ionicons name={getCategoryIcon(categoryName)} size={20} color="white" />
                        </View>
                        <Text className="flex-1 text-white text-base font-medium">
                          {categoryName}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-3">
                        {budgetMode === 'fixed' ? (
                          <Text className="text-secondaryDark text-lg">{currencySymbol}</Text>
                        ) : null}
                        <TextInput
                          value={getBudgetDisplay(categoryName)}
                          onChangeText={(value) => updateBudget(categoryName, value)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#4B5A7A"
                          className="flex-1 text-white text-xl font-semibold bg-inputDark border border-borderDark rounded-3xl px-4 py-3"
                        />
                        {budgetMode === 'percentage' ? (
                          <Text className="text-secondaryDark text-lg">%</Text>
                        ) : null}
                      </View>
                      {budgets[categoryName] ? (
                        <Text className="text-secondaryDark text-sm mt-2 text-center">
                          = {getBudgetEquivalent(categoryName)}
                        </Text>
                      ) : null}
                    </View>
                  </MotiView>
                ))}
              </View>

              {/* Continue Button */}
              <AnimatedGradientButton
                onPress={handleContinue}
                text="Continue"
                rounded="3xl"
                disabled={!isValid}
              />

              {!isValid && totalBudgeted > monthlyIncome && (
                <Text className="text-accentRed text-sm text-center mt-3">
                  Total budget exceeds monthly income
                </Text>
              )}
            </MotiView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
