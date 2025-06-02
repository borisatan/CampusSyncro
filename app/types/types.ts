// Category Types
export type CategoryName = 'Transport' | 'Food' | 'Education' | 'Savings' | 'Travel' | 
  'Health' | 'Care' | 'Home' | 'Personal' | 'Clothes' | 'Medical';

export interface Category {
  id: string;
  name: CategoryName;
  icon: string;
  color: string;
  isCustom?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Types
export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;
  accountId: string;
  date: Date;
  status: TransactionStatus;
  isRecurring: boolean;
  recurringDetails?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
  };
  attachments?: string[]; // URLs to attached files/images
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Account Types
export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment';

export type Currency = 'USD' | 'EUR' | 'GBP'; // Add more as needed

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  isArchived: boolean;
  color: string;
  icon: string;
  lastSyncDate?: Date;
  institution?: string;
  accountNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Budget Types
export interface Budget {
  id: string;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  categoryBudgets: {
    categoryId: string;
    amount: number;
    percentage?: number;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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