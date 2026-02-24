import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingHeader from '../components/OnboardingPage/OnboardingHeader';
import { bulkCreateCategories } from '../services/backendService';
import { useAuth } from '../context/AuthContext';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useOnboardingStore } from '../store/useOnboardingStore';

export default function IntentionalityMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { currencySymbol } = useCurrencyStore();
  const {
    setOnboardingStep,
    pendingCategories,
    pendingBudgets,
    pendingIncome,
    completeOnboarding,
  } = useOnboardingStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setOnboardingStep(6);
  }, []);

  // Find top category by budget
  const topCategory = useMemo(() => {
    let maxAmount = 0;
    let topName = '';
    pendingCategories.forEach((cat) => {
      const amount = pendingBudgets[cat.name] || 0;
      if (amount > maxAmount) {
        maxAmount = amount;
        topName = cat.name;
      }
    });
    return topName || pendingCategories[0]?.name || 'your goals';
  }, [pendingCategories, pendingBudgets]);

  // Calculate total budget
  const totalBudget = useMemo(() => {
    return Object.values(pendingBudgets).reduce((sum, val) => sum + (val || 0), 0);
  }, [pendingBudgets]);

  const handleComplete = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not authenticated. Please sign in again.');
      return;
    }

    setIsLoading(true);

    try {
      // Create categories in database
      const categoriesPayload = pendingCategories.map((cat) => ({
        category_name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget_amount: pendingBudgets[cat.name] || null,
      }));

      await bulkCreateCategories(userId, categoriesPayload);

      // Mark onboarding as complete
      completeOnboarding();

      // Navigate to main app
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        'Error',
        'Failed to save your preferences. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View className="flex-1 bg-backgroundDark">
      <OnboardingHeader
        currentStep={5}
        title="Your path to clarity is set."
        subtitle="Here is how your money will support your life."
        onSkip={handleSkip}
      />

      {/* Visualization Placeholder */}
      <View className="flex-1 px-2 mt-8 items-center justify-center">
        {/* Placeholder circle */}
        <View className="w-48 h-48 rounded-full border-4 border-dashed border-borderDark items-center justify-center mb-8">
          <Ionicons name="pie-chart-outline" size={64} color="#4B5563" />
          <Text className="text-secondaryDark text-sm mt-2">Coming Soon</Text>
        </View>

        {/* Summary Card */}
        <View className="w-full bg-surfaceDark rounded-2xl p-6 border border-borderDark">
          <Text className="text-textDark text-lg font-semibold text-center mb-4">
            You are prioritizing {topCategory} this month.
          </Text>

          <View className="flex-row justify-between py-3 px-4 border border-borderDark rounded-xl mb-2">
            <Text className="text-secondaryDark">Categories</Text>
            <Text className="text-textDark font-medium">{pendingCategories.length}</Text>
          </View>

          <View className="flex-row justify-between py-3 px-4 border border-borderDark rounded-xl mb-2">
            <Text className="text-secondaryDark">Monthly Income</Text>
            <Text className="text-textDark font-medium">
              {currencySymbol || '$'}{pendingIncome.toLocaleString()}
            </Text>
          </View>

          <View className="flex-row justify-between py-3 px-4 border border-borderDark rounded-xl">
            <Text className="text-secondaryDark">Total Budgeted</Text>
            <Text className="text-accentTeal font-medium">
              {currencySymbol || '$'}{totalBudget.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-2">
        <TouchableOpacity
          onPress={handleComplete}
          disabled={isLoading}
          activeOpacity={0.8}
          className="w-full py-4 rounded-xl items-center bg-accentBlue border border-accentBlue"
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Looks Perfect
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
