import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Sparkles, TrendingUp } from "lucide-react-native";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
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
      budget_amount: parseFloat(((rule.percentage / 100) * monthlyIncome).toFixed(2)),
    };
  });

  // Normalize to ensure total is 80%
  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  if (totalPercentage !== 80) {
    const scaleFactor = 80 / totalPercentage;
    allocations.forEach((a) => {
      a.percentage = Math.round(a.percentage * scaleFactor * 10) / 10;
      a.budget_amount = parseFloat(((a.percentage / 100) * monthlyIncome).toFixed(2));
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
    savingsAmount: parseFloat((monthlyIncome * 0.2).toFixed(2)),
  };
}

export default function AIBudgetSetupScreen() {
  const { setOnboardingStep, setNewOnboardingData, newOnboardingData } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [editingAllocation, setEditingAllocation] = useState<any | null>(null);
  const [editAmountText, setEditAmountText] = useState("");

  const selectedCategories = newOnboardingData.selectedCategories || [];
  const monthlyIncome = newOnboardingData.estimatedIncome || 0;

  const totalAllocated = budgetData?.allocations.reduce((sum: number, a: any) => sum + a.budget_amount, 0) ?? 0;
  const spendingBudget = monthlyIncome * 0.8;
  const isOverBudget = totalAllocated > spendingBudget;
  const budgetRemaining = spendingBudget - totalAllocated;

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
    router.back();
  };

  // Get category color
  const getCategoryColor = (name: string) => {
    return V3_DEFAULT_CATEGORIES.find((c) => c.name === name)?.color || '#6B7280';
  };

  const getCategoryIcon = (name: string) => {
    return V3_DEFAULT_CATEGORIES.find((c) => c.name === name)?.icon || 'apps-outline';
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
        {/* Progress Bar */}
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <OnboardingBackButton onPress={handleBack} />
            <OnboardingProgressDots currentStep={6} totalSteps={11} />
            <View style={{ width: 36 }} />
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
                  Based on your {currencySymbol}{monthlyIncome.toFixed(2)} monthly income
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
                    Needs {budgetData.totalNeeds.toFixed(2)}%
                  </Text>
                </View>
                <View className="bg-blue-500/20 border border-blue-500 rounded-full px-4 py-2">
                  <Text className="text-blue-400 text-xs font-semibold">
                    Wants {budgetData.totalWants.toFixed(2)}%
                  </Text>
                </View>
                <View className={`border rounded-full px-4 py-2 ${isOverBudget ? 'bg-red-500/20 border-red-500' : 'bg-purple-500/20 border-purple-500'}`}>
                  <Text className={`text-xs font-semibold ${isOverBudget ? 'text-red-400' : 'text-purple-400'}`}>
                    Savings {(budgetData.savingsPercentage ?? 20).toFixed(1)}%
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
                <View className="bg-surfaceDark border border-borderDark rounded-3xl p-4">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-white text-base font-semibold">Spending Budget</Text>
                    <Text className="text-white text-lg font-bold">
                      {currencySymbol}{(monthlyIncome * 0.8).toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <TrendingUp size={16} color="#22C55E" />
                      <Text className="text-secondaryDark text-base">Savings Goal</Text>
                    </View>
                    <Text className={`text-lg font-bold ${isOverBudget ? 'text-red-400' : 'text-accentGreen'}`}>
                      {currencySymbol}{budgetData.savingsAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-borderDark">
                    <Text className="text-secondaryDark text-sm">
                      {isOverBudget ? 'Over spending budget' : 'Remaining'}
                    </Text>
                    <Text className={`text-sm font-semibold ${isOverBudget ? 'text-red-400' : 'text-accentGreen'}`}>
                      {isOverBudget ? '-' : ''}{currencySymbol}{Math.abs(budgetRemaining).toFixed(2)}
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
                    <Pressable
                      onPress={() => {
                        setEditingAllocation(allocation);
                        setEditAmountText(allocation.budget_amount.toFixed(2));
                      }}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View className="rounded-3xl overflow-hidden border bg-surfaceDark" style={{ borderColor: '#2A3250' }}>
                        <View className="p-4 flex-row items-center">
                          <View
                            className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: getCategoryColor(allocation.category_name) }}
                          >
                            <Ionicons name={getCategoryIcon(allocation.category_name) as any} size={22} color="#fff" />
                          </View>
                          <Text className="text-slate50 text-[15px] font-semibold flex-1">
                            {allocation.category_name}
                          </Text>
                          <View className="items-end">
                            <Text className="text-slate50 text-base font-bold">
                              {currencySymbol}{allocation.budget_amount.toFixed(2)}
                            </Text>
                            <Text className="text-slateMuted text-xs mt-0.5">
                              {allocation.percentage.toFixed(2)}% of income
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </MotiView>
                ))}
              </MotiView>

              {/* Apply Button */}
              {isOverBudget && (
                <Text className="text-red-400 text-xs text-center mb-3">
                  Categories exceed spending budget by {currencySymbol}{Math.abs(budgetRemaining).toFixed(2)}. Reduce a category to continue.
                </Text>
              )}
              <AnimatedGradientButton
                onPress={handleApply}
                text="Apply Smart Budget"
                rounded="3xl"
                disabled={isOverBudget}
              />
            </MotiView>
          )}
        </View>
      </ScrollView>

      {/* Edit allocation bottom sheet */}
      <Modal
        visible={editingAllocation !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingAllocation(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <Pressable className="flex-1" onPress={() => setEditingAllocation(null)} />
          <View className="bg-surfaceDark rounded-t-3xl p-6 border-t border-borderDark">
            {/* Header */}
            <View className="flex-row items-center gap-3 mb-6">
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center"
                style={{ backgroundColor: getCategoryColor(editingAllocation?.category_name) }}
              >
                <Ionicons
                  name={getCategoryIcon(editingAllocation?.category_name) as any}
                  size={24}
                  color="white"
                />
              </View>
              <View>
                <Text className="text-white text-lg font-semibold">
                  {editingAllocation?.category_name}
                </Text>
                <Text className="text-secondaryDark text-sm">Adjust budget amount</Text>
              </View>
            </View>

            {/* Amount input */}
            <View className="flex-row items-center px-4 py-3 rounded-xl bg-backgroundDark border border-borderDark mb-6">
              <Text className="text-white/70 text-xl mr-2">{currencySymbol}</Text>
              <TextInput
                value={editAmountText}
                onChangeText={setEditAmountText}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="decimal-pad"
                className="flex-1 py-4 text-xl text-white"
                style={{ lineHeight: 24 }}
                autoFocus
              />
            </View>

            {/* Save button */}
            <TouchableOpacity
              onPress={() => {
                const newAmount = parseFloat(editAmountText);
                if (isNaN(newAmount) || newAmount <= 0) return;
                const newPercentage = monthlyIncome > 0 ? (newAmount / monthlyIncome) * 100 : 0;
                setBudgetData((prev: any) => {
                  const updatedAllocations = prev.allocations.map((a: any) =>
                    a.category_name === editingAllocation.category_name
                      ? { ...a, budget_amount: newAmount, percentage: parseFloat(newPercentage.toFixed(2)) }
                      : a
                  );
                  const needsTotal = updatedAllocations
                    .filter((a: any) => a.classification === 'needs')
                    .reduce((sum: number, a: any) => sum + a.percentage, 0);
                  const wantsTotal = updatedAllocations
                    .filter((a: any) => a.classification === 'wants')
                    .reduce((sum: number, a: any) => sum + a.percentage, 0);
                  const newTotalAllocated = updatedAllocations.reduce((sum: number, a: any) => sum + a.budget_amount, 0);
                  const newSavings = parseFloat((monthlyIncome - newTotalAllocated).toFixed(2));
                  return {
                    ...prev,
                    allocations: updatedAllocations,
                    totalNeeds: parseFloat(needsTotal.toFixed(2)),
                    totalWants: parseFloat(wantsTotal.toFixed(2)),
                    savingsAmount: newSavings,
                    savingsPercentage: monthlyIncome > 0 ? parseFloat(((newSavings / monthlyIncome) * 100).toFixed(2)) : 0,
                  };
                });
                setEditingAllocation(null);
              }}
              className="py-3 rounded-xl items-center bg-accentBlue"
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold text-base">Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
