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
  budget_amount?: number | null;
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



export interface CategoryBudgetStatus {
  category: Category;
  budget_amount: number;
  spent: number;
  percentage_used: number;
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