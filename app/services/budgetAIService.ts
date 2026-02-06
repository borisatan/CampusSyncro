/**
 * Budget AI Service
 *
 * Handles AI-powered budget allocation using Google Gemini Flash via Supabase Edge Function.
 * Implements 24-hour caching to minimize API costs.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from '../utils/supabase';

// ============= TYPES =============

export interface CategoryForAI {
  id: number;
  category_name: string;
}

export type BudgetClassification = 'needs' | 'wants';

export interface BudgetAllocation {
  categoryId: number;
  categoryName: string;
  classification: BudgetClassification;
  percentage: number;
  amount: number;
}

export interface AIBudgetResult {
  success: true;
  allocations: BudgetAllocation[];
  totalNeeds: number;
  totalWants: number;
  savingsAmount: number; // Fixed 20% of total income allocated to savings/goals
  spendingBudget: number; // 80% of income that was distributed by AI
  fromCache: boolean;
}

export interface AIBudgetError {
  success: false;
  error: string;
  code: 'NETWORK_ERROR' | 'AI_ERROR' | 'VALIDATION_ERROR' | 'AUTH_ERROR' | 'RATE_LIMITED';
}

export type AIBudgetResponse = AIBudgetResult | AIBudgetError;

// ============= CACHE CONFIGURATION =============

// Increment this when the AI prompt or allocation logic changes significantly
// This ensures old cached responses are invalidated
const CACHE_VERSION = 4; // v4: Fixed prompt to ensure 100% allocation (5/8 needs, 3/8 wants of 80% spending budget)

const CACHE_KEY_PREFIX = `budget_ai_v${CACHE_VERSION}_`;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  allocations: Array<{
    categoryName: string;
    classification: BudgetClassification;
    percentage: number;
  }>;
  totalNeeds: number;
  totalWants: number;
  timestamp: number;
}

// ============= CACHE FUNCTIONS =============

/**
 * Generates a deterministic cache key based on category names and income.
 * Uses SHA256 hash to create a unique key for each unique input combination.
 */
async function generateCacheKey(categories: CategoryForAI[], income: number): Promise<string> {
  const sortedNames = categories
    .map((c) => c.category_name)
    .sort()
    .join('|');
  const inputString = `${sortedNames}:${Math.round(income)}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    inputString
  );
  return `${CACHE_KEY_PREFIX}${hash.substring(0, 16)}`;
}

/**
 * Attempts to retrieve a cached AI response.
 * Returns null if cache is expired or doesn't exist.
 */
async function getCachedResult(
  categories: CategoryForAI[],
  income: number
): Promise<AIBudgetResult | null> {
  try {
    const cacheKey = await generateCacheKey(categories, income);
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();

    // Check TTL expiration
    if (now - entry.timestamp > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    // Calculate spending budget (80% of income) and savings (20%)
    const spendingBudget = Math.round(income * 0.8);
    const savingsAmount = Math.round(income * 0.2);

    // Reconstruct full allocations with IDs and amounts based on 80% spending budget
    const allocations: BudgetAllocation[] = entry.allocations.map((a) => {
      const category = categories.find(
        (c) => c.category_name.toLowerCase() === a.categoryName.toLowerCase()
      );
      return {
        categoryId: category?.id ?? 0,
        categoryName: a.categoryName,
        classification: a.classification,
        percentage: a.percentage,
        amount: Math.round((a.percentage / 100) * spendingBudget),
      };
    });

    return {
      success: true,
      allocations,
      totalNeeds: entry.totalNeeds,
      totalWants: entry.totalWants,
      savingsAmount,
      spendingBudget,
      fromCache: true,
    };
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

/**
 * Stores a successful AI response in the cache.
 */
async function setCachedResult(
  categories: CategoryForAI[],
  income: number,
  result: AIBudgetResult
): Promise<void> {
  try {
    const cacheKey = await generateCacheKey(categories, income);
    const entry: CacheEntry = {
      allocations: result.allocations.map((a) => ({
        categoryName: a.categoryName,
        classification: a.classification,
        percentage: a.percentage,
      })),
      totalNeeds: result.totalNeeds,
      totalWants: result.totalWants,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

// ============= VALIDATION =============

interface ValidationResult {
  valid: boolean;
  error: string;
}

/**
 * Validates that the AI response is complete and consistent.
 */
function validateAllocations(
  allocations: BudgetAllocation[],
  inputCategories: CategoryForAI[]
): ValidationResult {
  // Check all input categories have allocations
  const allocatedNames = new Set(allocations.map((a) => a.categoryName.toLowerCase()));
  const missingCategories = inputCategories.filter(
    (c) => !allocatedNames.has(c.category_name.toLowerCase())
  );

  if (missingCategories.length > 0) {
    return {
      valid: false,
      error: `Missing categories: ${missingCategories.map((c) => c.category_name).join(', ')}`,
    };
  }

  // Check percentages sum to approximately 100%
  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 2) {
    return {
      valid: false,
      error: `Percentages sum to ${totalPercentage}%, expected 100%`,
    };
  }

  // Check no negative percentages
  if (allocations.some((a) => a.percentage < 0)) {
    return { valid: false, error: 'Negative percentage detected' };
  }

  // Check all classifications are valid (only needs/wants, savings handled separately)
  const validClassifications: BudgetClassification[] = ['needs', 'wants'];
  if (allocations.some((a) => !validClassifications.includes(a.classification))) {
    return { valid: false, error: 'Invalid classification detected' };
  }

  return { valid: true, error: '' };
}

// ============= MAIN API =============

/**
 * Gets AI-generated budget allocations for the given categories and income.
 * Uses 80/20 split: 80% for spending (needs + wants), 20% for savings/goals.
 * The AI distributes the 80% spending budget: 5/8 to needs (62.5%), 3/8 to wants (37.5%).
 *
 * Results are cached for 24 hours based on category names and income.
 */
export async function getBudgetAllocations(
  categories: CategoryForAI[],
  monthlyIncome: number
): Promise<AIBudgetResponse> {
  // Validate inputs
  if (!categories || categories.length === 0) {
    return { success: false, error: 'No categories provided', code: 'VALIDATION_ERROR' };
  }

  if (!monthlyIncome || monthlyIncome <= 0) {
    return { success: false, error: 'Invalid monthly income', code: 'VALIDATION_ERROR' };
  }

  // Calculate spending budget (80%) and savings (20%)
  const spendingBudget = Math.round(monthlyIncome * 0.8);
  const savingsAmount = Math.round(monthlyIncome * 0.2);

  // Check cache first
  const cached = await getCachedResult(categories, monthlyIncome);
  if (cached) {
    console.log('Budget AI: Using cached response');
    return cached;
  }

  console.log('Budget AI: Calling edge function');

  // Get auth session
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session) {
    return { success: false, error: 'Not authenticated', code: 'AUTH_ERROR' };
  }

  // Call edge function
  try {
    const { data, error } = await supabase.functions.invoke('budget-ai', {
      body: {
        categories: categories.map((c) => ({
          id: c.id,
          category_name: c.category_name,
        })),
        monthlyIncome,
      },
    });

    if (error) {
      console.error('Budget AI edge function error:', error.name, error.message);

      // FunctionsHttpError has context as a Response object - read the body for logging
      if (error.context && typeof error.context.json === 'function') {
        try {
          const errorBody = await error.context.json();
          console.error('Edge function error details:', errorBody);
        } catch (parseErr) {
          console.error('Could not parse error body:', parseErr);
        }
      }

      return {
        success: false,
        error: 'Unable to generate budget suggestions. Please try again later.',
        code: 'AI_ERROR',
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'AI service returned an error',
        code: data.code || 'AI_ERROR',
      };
    }

    // Map response with amounts calculated from 80% spending budget
    const allocations: BudgetAllocation[] = data.allocations.map((a: {
      categoryId: number;
      categoryName: string;
      classification: BudgetClassification;
      percentage: number;
    }) => ({
      categoryId: a.categoryId,
      categoryName: a.categoryName,
      classification: a.classification,
      percentage: a.percentage,
      amount: Math.round((a.percentage / 100) * spendingBudget),
    }));

    // Validate response
    const validation = validateAllocations(allocations, categories);
    if (!validation.valid) {
      console.error('Budget AI validation failed:', validation.error);
      return {
        success: false,
        error: validation.error,
        code: 'VALIDATION_ERROR',
      };
    }

    const result: AIBudgetResult = {
      success: true,
      allocations,
      totalNeeds: data.totalNeeds,
      totalWants: data.totalWants,
      savingsAmount,
      spendingBudget,
      fromCache: false,
    };

    // Cache the successful result
    await setCachedResult(categories, monthlyIncome, result);

    return result;
  } catch (error) {
    console.error('Budget AI network error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}

// ============= CACHE MANAGEMENT =============

/**
 * Clears all cached budget AI responses.
 * Useful for debugging or forcing fresh AI calls.
 */
export async function clearBudgetAICache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_KEY_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Budget AI: Cleared ${cacheKeys.length} cached responses`);
    }
  } catch (error) {
    console.warn('Failed to clear budget AI cache:', error);
  }
}
