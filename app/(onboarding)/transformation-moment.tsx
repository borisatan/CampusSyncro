import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InsightBanner } from '../components/OnboardingPage/InsightBanner';
import { DashboardSkeleton } from '../components/HomePage/DashboardSkeleton';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useAuth } from '../context/AuthContext';
import { useDataRefresh } from '../context/DataRefreshContext';
import {
  updateIncomeSettings,
  createAccount,
  bulkCreateCategories,
  createTransaction,
} from '../services/backendService';
import { V3_DEFAULT_CATEGORIES } from '../constants/onboardingCategories';

export default function TransformationMomentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { refreshAll } = useDataRefresh();
  const { currencySymbol } = useCurrencyStore();
  const {
    pendingMonthlyTarget,
    pendingCategoryNames,
    pendingAccountName,
    pendingTransactions,
    completeOnboarding,
    setOnboardingStep,
  } = useOnboardingStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setOnboardingStep(6);
  }, []);

  const remainingBudget =
    pendingMonthlyTarget -
    pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const handleCompleteSetup = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Update Profile with monthly income
      await updateIncomeSettings({
        manual_income: pendingMonthlyTarget,
        use_dynamic_income: false,
        monthly_savings_target: 0,
      });

      // Step 2: Create default account
      await createAccount(
        pendingAccountName || 'Main Account',
        0,
        'checking',
        user.id,
        1
      );

      // Step 3: Bulk create categories
      const categoriesPayload = V3_DEFAULT_CATEGORIES.filter((cat) =>
        pendingCategoryNames.includes(cat.name)
      ).map((cat) => ({
        category_name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget_amount: null,
      }));

      if (categoriesPayload.length > 0) {
        await bulkCreateCategories(user.id, categoriesPayload);
      }

      // Step 4: Create logged transactions
      for (const tx of pendingTransactions) {
        await createTransaction({
          amount: -Math.abs(tx.amount),
          category_name: tx.category,
          account_name: pendingAccountName || 'Main Account',
          description: tx.label,
          created_at: new Date().toISOString(),
          user_id: user.id,
        });
      }

      // Step 5: Mark complete
      completeOnboarding();

      // Step 6: Navigate to dashboard
      router.replace('/(tabs)/dashboard');

      // Step 7: Refresh data
      setTimeout(() => {
        refreshAll();
      }, 300);
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      Alert.alert(
        'Setup Error',
        'Failed to complete setup. Please try again.',
        [{ text: 'Retry', onPress: () => handleCompleteSetup() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-backgroundDark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 16,
        }}
      >
        {/* Insight Banner */}
        <InsightBanner
          message="At this pace, you'll stay under budget."
          submessage={`You have ${currencySymbol}${remainingBudget.toLocaleString()} left this month.`}
        />

        {/* Dashboard Preview */}
        <DashboardSkeleton isDarkMode={true} />
      </ScrollView>

      {/* Complete Button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <TouchableOpacity
          onPress={handleCompleteSetup}
          disabled={isLoading}
          className="rounded-xl py-4 px-6 items-center"
          style={{
            backgroundColor: isLoading ? '#374151' : '#22C55E',
          }}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-lg font-semibold">
              Complete Setup
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
