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
}
export interface AccountOption {
  id: number;
  account_name: string;
  
  selected: boolean;
  type: string;
}

// Budget Types
// export interface Budget {
//   id: string;
//   name: string;
//   amount: number;
//   period: 'daily' | 'weekly' | 'monthly' | 'yearly';
//   startDate: Date;
//   endDate?: Date;
//   categoryBudgets: {
//     categoryId: string;
//     amount: number;
//     percentage?: number;
//   }[];
//   isActive: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   target: number;
//   spent: number;
//   projectedStatus: 'Under Budget' | 'Over Budget';
//   percentUsed: number;
// }

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