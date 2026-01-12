// Category Types
export type CategoryName = string;
export type TimeFrame = 'week' | 'month' | 'year';

export type ChartDataPoint = {
  label: string;
  amount: number;
  x: number;
};

export type SupportedCurrency = 'USD' | 'EUR' | 'JPY' | 'GBP';

export const isValidCurrency = (currency: string): currency is SupportedCurrency => {
  return ['USD', 'EUR', 'JPY', 'GBP'].includes(currency);
};

export const getCurrencySymbol = (currency: SupportedCurrency | '?' | string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    JPY: '¥',
    GBP: '£',
  };

  return symbols[currency] ?? ' ';
};

export interface Category {
  id: number;
  category_name: CategoryName;
  icon: string;
  color: string;
  user_id: string;
  sort_order?: number;
  budget_id?: number | null;
}

export interface Profile {
  id: string;
  currency: string;
  updated_at: string;
}

export interface CategoryAggregation {
  category_name: CategoryName;
  total_amount: number;
  percent: number;
}


export interface Transaction {
  id: number;
  amount: number;
  category_name: string;
  account_name: string;
  description: string;
  created_at: Date;
}

// Account Types 

export interface Account {
  id: number;
  account_name: string;
  balance: number;
  type: string;
  sort_order?: number;
}
export interface AccountOption {
  id: number;
  account_name: string;
  
  selected: boolean;
  type: string;
}

// Budget Types
export type BudgetAmountType = 'money_amount' | 'percentage';
export type BudgetPeriodType = 'weekly' | 'monthly' | 'custom';

export interface Budget {
  id: number;
  user_id: string;
  name: string;
  color: string;
  amount_type: BudgetAmountType;
  amount: number;
  period_type: BudgetPeriodType;
  custom_start_date?: string;
  custom_end_date?: string;
  manual_income?: number;
  use_dynamic_income: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithSpent extends Budget {
  spent: number;
  limit: number;
  percentage_used: number;
  categories: Category[];
}

export type TransactionSection = {
  title: string;          
  data: Transaction[];     
};



// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  AddEvent: { date: string };
  AddTransaction: undefined;
  TransactionDetails: { transactionId: string };
  AccountDetails: { accountId: string };
  BudgetDetails: { budgetId: string };
  CategoryDetails: { categoryId: string };
};

// Dashboard Types
export interface ChartSegment {
  key: string;
  value: number;
  color: string;
}

export type CategoryIconInfo = {
  icon: string;
  color: string;
};