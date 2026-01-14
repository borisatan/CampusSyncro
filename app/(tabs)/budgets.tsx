import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetAllocationBar } from '../components/BudgetsPage/BudgetAllocationBar';
import { BudgetCard } from '../components/BudgetsPage/BudgetCard';
import { BudgetSpendingSummary } from '../components/BudgetsPage/BudgetSpendingSummary';
import { IncomeCard } from '../components/BudgetsPage/IncomeCard';
import { useTheme } from '../context/ThemeContext';
import { useBudgetsData } from '../hooks/useBudgetsData';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useIncomeStore } from '../store/useIncomeStore';

export default function BudgetsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { budgetsWithSpent, monthlyIncome, dynamicIncome, allocatedPercentage, isLoading, refresh } = useBudgetsData();
  const { currencySymbol } = useCurrencyStore();
  const { useDynamicIncome, manualIncome, saveIncomeSettings } = useIncomeStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const textPrimary = isDarkMode ? 'text-white' : 'text-black';
  const textSecondary = isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight';
  const screenBg = isDarkMode ? 'bg-backgroundDark' : 'bg-background';

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const handleAddBudget = () => {
    router.push('/budget-edit');
  };

  const handleEditBudget = (budgetId: number) => {
    router.push(`/budget-edit?id=${budgetId}`);
  };

  const handleSaveIncome = async (useDynamic: boolean, income: number) => {
    await saveIncomeSettings(useDynamic, income);
    await refresh();
  };

  return (
    <SafeAreaView className={`flex-1 ${screenBg}`} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-2 py-2">
        <View className="flex-col">
          <Text className={`text-2xl font-semibold ${textPrimary}`}>
            Budgets
          </Text>
          <Text className={`text-md mt-1 mb-3 ${textSecondary}`}>
            Set spending limits
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAddBudget}
          className="bg-accentBlue rounded-full p-2"
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isLoading && !isRefreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-2"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#2563EB"
            />
          }
        >
          {/* Income Card */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            <IncomeCard
              income={monthlyIncome}
              allocatedPercentage={allocatedPercentage}
              currencySymbol={currencySymbol}
              useDynamicIncome={useDynamicIncome}
              manualIncome={manualIncome}
              dynamicIncome={dynamicIncome}
              isDarkMode={isDarkMode}
              onSave={handleSaveIncome}
            />
          </MotiView>

          {/* Budget Spending Summary */}
          {budgetsWithSpent.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 100 }}
            >
              <BudgetSpendingSummary
                budgets={budgetsWithSpent}
                currencySymbol={currencySymbol}
                isDarkMode={isDarkMode}
              />
            </MotiView>
          )}

          {/* Budget Allocation Bar Chart */}
          {budgetsWithSpent.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 200 }}
            >
              <BudgetAllocationBar
                budgets={budgetsWithSpent}
                totalIncome={monthlyIncome}
                currencySymbol={currencySymbol}
                isDarkMode={isDarkMode}
              />
            </MotiView>
          )}

          {/* Budgets List */}
          {budgetsWithSpent.length === 0 ? (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 400, delay: 200 }}
              className="items-center justify-center py-12"
            >
              <Text className={`text-lg ${textSecondary}`}>
                No budgets yet
              </Text>
              <Text className={`text-sm ${textSecondary} mt-2 text-center`}>
                Tap the + button to create your first budget
              </Text>
            </MotiView>
          ) : (
            <View className="gap-4">
              {budgetsWithSpent.map((budget, index) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  currencySymbol={currencySymbol}
                  onPress={() => handleEditBudget(budget.id)}
                  index={index}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
