import { bulkCreateCategories, createGoal, ensureUserProfile } from './backendService';
import { V3_DEFAULT_CATEGORIES } from '../constants/onboardingCategories';
import { supabase } from '../utils/supabase';

const NOTIFICATION_FREQUENCY_MAP: Record<string, number> = {
  once: 1,
  three: 3,
  five: 5,
};

/**
 * Persist onboarding data to Supabase after sign-up.
 * Creates categories with budgets, saves income and notification frequency to profile.
 */
export async function persistOnboardingData(userId: string, onboardingData: any) {

  const { selectedCategories, categoryBudgets, estimatedIncome, notificationFrequency, selectedCurrency, pendingSavingsGoal } = onboardingData;

  // Step 1: Create categories (errors are logged but don't block profile update)
  try {
    const categoriesToCreate: any[] = [];

    // Always add the Income category first (sort_order 0)
    categoriesToCreate.push({
      category_name: 'Income',
      icon: 'cash-outline',
      color: '#00C853',
      sort_order: 0,
      budget_amount: null,
      budget_percentage: 0,
      show_on_dashboard: false,
    });

    if (selectedCategories && selectedCategories.length > 0) {
      selectedCategories.forEach((categoryName: string, index: number) => {
        const categoryDef = V3_DEFAULT_CATEGORIES.find((cat) => cat.name === categoryName);
        if (!categoryDef) {
          console.warn(`[persistOnboardingData] Category not found in V3_DEFAULT_CATEGORIES: ${categoryName}`);
          return;
        }
        const budget = categoryBudgets?.find((b: any) => b.category_name === categoryName);
        categoriesToCreate.push({
          category_name: categoryDef.name,
          icon: categoryDef.icon,
          color: categoryDef.color,
          sort_order: index + 1,
          budget_amount: budget?.budget_amount ?? null,
          budget_percentage: budget?.budget_percentage ?? null,
        });
      });
    }

    await bulkCreateCategories(userId, categoriesToCreate);
  } catch (catError: any) {
    console.error('[persistOnboardingData] Error creating categories:', catError.message);
  }

  // Step 2: Update income — kept separate from notification frequency so one
  // cannot block the other (e.g. if daily_notification_frequency column is missing).
  if (estimatedIncome && estimatedIncome > 0) {
    try {
      const { error: incomeError } = await supabase
        .from('Profiles')
        .update({
          manual_income: estimatedIncome,
          use_dynamic_income: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (incomeError) {
        console.error('[persistOnboardingData] Error updating income:', incomeError.message);
      }
    } catch (incomeError: any) {
      console.error('[persistOnboardingData] Error updating income:', incomeError.message);
    }
  }

  // Step 3: Update notification frequency (separate so a missing column doesn't block income)
  try {
    const frequencyValue = notificationFrequency ? (NOTIFICATION_FREQUENCY_MAP[notificationFrequency] ?? 0) : 0;
    if (frequencyValue > 0) {
      const { error: freqError } = await supabase
        .from('Profiles')
        .update({
          daily_notification_frequency: frequencyValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (freqError) {
        console.error('[persistOnboardingData] Error updating notification frequency:', freqError.message);
      }
    }
  } catch (freqError: any) {
    console.error('[persistOnboardingData] Error updating notification frequency:', freqError.message);
  }

  // Step 4: Update currency selection
  if (selectedCurrency) {
    try {
      const { error: currencyError } = await supabase
        .from('Profiles')
        .update({
          currency: selectedCurrency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (currencyError) {
        console.error('[persistOnboardingData] Error updating currency:', currencyError.message);
      }
    } catch (currencyError: any) {
      console.error('[persistOnboardingData] Error updating currency:', currencyError.message);
    }
  }

  // Step 5: Create savings goal collected during onboarding (optional)
  if (pendingSavingsGoal?.name && pendingSavingsGoal?.targetAmount > 0) {
    try {
      await createGoal({
        user_id: userId,
        name: pendingSavingsGoal.name,
        target_amount: pendingSavingsGoal.targetAmount,
        icon: pendingSavingsGoal.icon,
        color: pendingSavingsGoal.color,
        monthly_contribution: pendingSavingsGoal.monthlyContribution ?? null,
      });
    } catch (goalError: any) {
      console.error('[persistOnboardingData] Error creating savings goal:', goalError.message);
    }
  }

}
