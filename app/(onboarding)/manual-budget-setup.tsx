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
              <View className="w-12" />
            </View>
            <View className="items-center">
              <View className="h-2 bg-surfaceDark rounded-full overflow-hidden" style={{ width: '33%' }}>
                <MotiView
                  from={{ width: "71.4%" }}
                  animate={{ width: "85.7%" }}
                  transition={{ type: "timing", duration: 500 }}
                  className="h-full overflow-hidden"
                >
                  <LinearGradient
                    colors={["#1E40AF", "#3B7EFF", "#60A5FA"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ width: "100%", height: "100%" }}
                  />
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
                <View className="bg-surfaceDark border border-borderDark rounded-xl p-4">
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
                <View className="bg-surfaceDark rounded-xl p-1.5 border border-borderDark flex-row">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (budgetMode !== 'fixed') {
                        trackEvent("onboarding_budget_mode_toggled", { mode: "fixed" });
                      }
                      setBudgetMode('fixed');
                    }}
                    className={`flex-1 py-3 rounded-xl ${
                      budgetMode === 'fixed' ? 'bg-accentBlue' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-center font-medium ${
                        budgetMode === 'fixed' ? 'text-white' : 'text-secondaryDark'
                      }`}
                    >
                      Fixed Amount
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (budgetMode !== 'percentage') {
                        trackEvent("onboarding_budget_mode_toggled", { mode: "percentage" });
                      }
                      setBudgetMode('percentage');
                    }}
                    className={`flex-1 py-3 rounded-xl ${
                      budgetMode === 'percentage' ? 'bg-accentBlue' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-center font-medium ${
                        budgetMode === 'percentage' ? 'text-white' : 'text-secondaryDark'
                      }`}
                    >
                      % of Income
                    </Text>
                  </Pressable>
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
                    <View className="bg-surfaceDark border border-borderDark rounded-xl p-4">
                      <View className="flex-row items-center gap-3 mb-3">
                        <View
                          className="w-10 h-10 rounded-lg items-center justify-center"
                          style={{ backgroundColor: getCategoryColor(categoryName) }}
                        >
                          <View className="w-3 h-3 rounded-full bg-white" />
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
                          className="flex-1 text-white text-xl font-semibold bg-inputDark border border-borderDark rounded-lg px-4 py-3"
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
                delay={800}
                rounded="xl"
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
