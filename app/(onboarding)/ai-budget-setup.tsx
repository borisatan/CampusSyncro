import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ChevronLeft, Sparkles, TrendingUp } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { V3_DEFAULT_CATEGORIES } from "../constants/onboardingCategories";
import { useAnalytics } from "../hooks/useAnalytics";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

// Simple client-side budget allocation using 50/30/20 principles
// This is a simplified version for onboarding (no auth required)
function generateSimpleBudgetAllocations(categoryNames: string[], monthlyIncome: number) {
  const spendingBudget = monthlyIncome * 0.8; // 80% for spending, 20% for savings

  // Define typical percentages for each category as % of TOTAL income
  const allocationRules: Record<string, { percentage: number; classification: 'needs' | 'wants' }> = {
    Housing: { percentage: 28, classification: 'needs' },
    Groceries: { percentage: 12, classification: 'needs' },
    Transport: { percentage: 10, classification: 'needs' },
    'Eating Out': { percentage: 8, classification: 'wants' },
    Subscriptions: { percentage: 6, classification: 'wants' },
    Shopping: { percentage: 8, classification: 'wants' },
    Other: { percentage: 8, classification: 'wants' },
  };

  // Calculate allocations for selected categories
  const allocations = categoryNames.map((name) => {
    const rule = allocationRules[name] || { percentage: 5, classification: 'wants' };
    return {
      category_name: name,
      classification: rule.classification,
      percentage: rule.percentage,
      budget_amount: Math.round((rule.percentage / 100) * monthlyIncome),
    };
  });

  // Normalize to ensure total is 80%
  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  if (totalPercentage !== 80) {
    const scaleFactor = 80 / totalPercentage;
    allocations.forEach((a) => {
      a.percentage = Math.round(a.percentage * scaleFactor * 10) / 10;
      a.budget_amount = Math.round((a.percentage / 100) * monthlyIncome);
    });
  }

  const needsTotal = allocations
    .filter((a) => a.classification === 'needs')
    .reduce((sum, a) => sum + a.percentage, 0);
  const wantsTotal = allocations
    .filter((a) => a.classification === 'wants')
    .reduce((sum, a) => sum + a.percentage, 0);

  return {
    allocations,
    totalNeeds: needsTotal,
    totalWants: wantsTotal,
    savingsPercentage: 20,
    savingsAmount: Math.round(monthlyIncome * 0.2),
  };
}

export default function AIBudgetSetupScreen() {
  const { setOnboardingStep, setNewOnboardingData, newOnboardingData } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [budgetData, setBudgetData] = useState<any>(null);

  const selectedCategories = newOnboardingData.selectedCategories || [];
  const monthlyIncome = newOnboardingData.estimatedIncome || 0;

  useEffect(() => {
    setOnboardingStep(6);
    trackEvent("onboarding_ai_budget_setup_viewed");

    // Simulate AI processing (1 second delay for UX)
    setTimeout(() => {
      const result = generateSimpleBudgetAllocations(selectedCategories, monthlyIncome);
      setBudgetData(result);
      setIsLoading(false);
    }, 1000);
  }, [setOnboardingStep, trackEvent, selectedCategories, monthlyIncome]);

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    trackEvent("onboarding_ai_budget_applied", {
      step: 6,
      category_count: budgetData.allocations.length,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });

    // Save budget allocations to onboarding store
    setNewOnboardingData({
      budgetSetupChoice: 'smart',
      categoryBudgets: budgetData.allocations.map((a: any) => ({
        category_name: a.category_name,
        budget_percentage: a.percentage,
        budget_amount: a.budget_amount,
      })),
    });

    setOnboardingStep(8);
    router.push("/(onboarding)/why-manual");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(5);
    router.push("/(onboarding)/budget-setup-choice");
  };

  // Get category color
  const getCategoryColor = (name: string) => {
    return V3_DEFAULT_CATEGORIES.find((c) => c.name === name)?.color || '#6B7280';
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
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
          {isLoading ? (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 600 }}
              className="flex-1 items-center justify-center"
            >
              <Sparkles size={48} color="#3B7EFF" />
              <ActivityIndicator size="large" color="#3B7EFF" style={{ marginTop: 20 }} />
              <Text className="text-white text-xl font-semibold mt-4">
                Creating your smart budget...
              </Text>
              <Text className="text-secondaryDark text-sm mt-2">
                Using the 50/30/20 rule
              </Text>
            </MotiView>
          ) : (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 600 }}
              className="flex-1"
            >
              {/* Headline */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 100, duration: 600 }}
                className="mb-6"
              >
                <Text className="text-3xl text-white text-center leading-tight mb-2">
                  Your Smart Budget
                </Text>
                <Text className="text-secondaryDark text-sm text-center">
                  Based on your {currencySymbol}{monthlyIncome.toLocaleString()} monthly income
                </Text>
              </MotiView>

              {/* Summary Pills */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 200, duration: 600 }}
                className="flex-row justify-center gap-2 mb-6"
              >
                <View className="bg-green-500/20 border border-green-500 rounded-full px-4 py-2">
                  <Text className="text-green-400 text-xs font-semibold">
                    Needs {budgetData.totalNeeds}%
                  </Text>
                </View>
                <View className="bg-blue-500/20 border border-blue-500 rounded-full px-4 py-2">
                  <Text className="text-blue-400 text-xs font-semibold">
                    Wants {budgetData.totalWants}%
                  </Text>
                </View>
                <View className="bg-purple-500/20 border border-purple-500 rounded-full px-4 py-2">
                  <Text className="text-purple-400 text-xs font-semibold">
                    Savings 20%
                  </Text>
                </View>
              </MotiView>

              {/* Spending & Savings */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 300, duration: 600 }}
                className="mb-6"
              >
                <View className="bg-surfaceDark border border-borderDark rounded-xl p-4">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-white text-base font-semibold">Spending Budget</Text>
                    <Text className="text-white text-lg font-bold">
                      {currencySymbol}{Math.round(monthlyIncome * 0.8).toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <TrendingUp size={16} color="#22C55E" />
                      <Text className="text-secondaryDark text-base">Savings Goal</Text>
                    </View>
                    <Text className="text-accentGreen text-lg font-bold">
                      {currencySymbol}{budgetData.savingsAmount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </MotiView>

              {/* Category Allocations */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400, duration: 600 }}
                className="mb-6"
              >
                <Text className="text-white text-lg font-semibold mb-3">Category Budgets</Text>
                {budgetData.allocations.map((allocation: any, index: number) => (
                  <MotiView
                    key={allocation.category_name}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ delay: 500 + index * 100, duration: 500 }}
                    className="mb-3"
                  >
                    <View className="bg-surfaceDark border border-borderDark rounded-xl p-4">
                      <View className="flex-row justify-between items-center mb-2">
                        <View className="flex-row items-center gap-2">
                          <View
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(allocation.category_name) }}
                          />
                          <Text className="text-white text-base font-medium">
                            {allocation.category_name}
                          </Text>
                        </View>
                        <Text className="text-white text-lg font-bold">
                          {currencySymbol}{allocation.budget_amount.toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-secondaryDark text-xs capitalize">
                          {allocation.classification}
                        </Text>
                        <Text className="text-secondaryDark text-sm">
                          {allocation.percentage}% of income
                        </Text>
                      </View>
                    </View>
                  </MotiView>
                ))}
              </MotiView>

              {/* Apply Button */}
              <AnimatedGradientButton
                onPress={handleApply}
                text="Apply Smart Budget"
                delay={800}
                rounded="xl"
                gradientColors={["#1E40AF", "#3B7EFF", "#60A5FA"]}
              />
            </MotiView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
