// Category Types
export type CategoryName = string;
export type TimeFrame = 'week' | 'month' | 'year';

export type ChartDataPoint = {
  label: string;
  amount: number;
  x: number;
};

export type SupportedCurrency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'CNY'
  | 'INR'
  | 'MXN'
  | 'BRL'
  | 'ZAR'
  | 'SEK'
  | 'NZD';

export const isValidCurrency = (currency: string): currency is SupportedCurrency => {
  return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL', 'ZAR', 'SEK', 'NZD'].includes(currency);
};

export const getCurrencySymbol = (currency: SupportedCurrency | '?' | string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
    MXN: '$',
    BRL: 'R$',
    ZAR: 'R',
    SEK: 'kr',
    NZD: 'NZ$',
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
  budget_percentage?: number | null;
}

export interface Profile {
  id: string;
  currency: string;
  updated_at: string;
  // Income & savings settings
  use_dynamic_income?: boolean;
  manual_income?: number;
  monthly_savings_target?: number;
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
  transfer_id?: string | null;
}

// Account Types 

export interface Account {
  id: number;
  account_name: string;
  balance: number;
  type: string;
  sort_order?: number;
  monthly_savings_goal?: number | null;
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

// AI Budget Allocation Types
export type BudgetClassification = 'needs' | 'wants' | 'savings';

export interface AIBudgetAllocation {
  categoryId: number;
  categoryName: string;
  classification: BudgetClassification;
  percentage: number;
  amount: number;
}

// Savings Goals Types
export interface Goal {
  id: number;
  user_id: string;
  account_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  id: number;
  goal_id: number;
  user_id: string;
  amount: number;
  source_account_id: number | null;
  created_at: string;
}

// Notification Types
export interface NotificationMessage {
  id: number;
  user_id: string;
  message_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: number;
  user_id: string;
  notification_message_id: number | null;
  message_text: string;
  scheduled_time: string;
  sent_time: string;
  was_dismissed: boolean;
  had_transaction_today: boolean;
  created_at: string;
}

export interface NotificationSettings {
  frequency: number;
  isEnabled: boolean;
  hasPermission: boolean;
}

export type NotificationFrequency = 0 | 1 | 2 | 3 | 5 | 8 | 10;