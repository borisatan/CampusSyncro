import { Account, Budget, Category, Transaction } from '../types/types';

export const mockCategories: Category[] = [
  {
    id: 'cat1',
    name: 'Food',
    icon: '🍔',
    color: '#FF6B6B',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'cat2',
    name: 'Transport',
    icon: '🚗',
    color: '#4ECDC4',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'cat3',
    name: 'Education',
    icon: '📚',
    color: '#45B7D1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'cat4',
    name: 'Savings',
    icon: '💰',
    color: '#96CEB4',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

export const mockAccounts: Account[] = [
  {
    id: 'acc1',
    name: 'Main Checking',
    type: 'checking',
    balance: 2500.00,
    currency: 'USD',
    isArchived: false,
    color: '#4A90E2',
    icon: '🏦',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'acc2',
    name: 'Savings Account',
    type: 'savings',
    balance: 10000.00,
    currency: 'USD',
    isArchived: false,
    color: '#50E3C2',
    icon: '💰',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'acc3',
    name: 'Credit Card',
    type: 'credit',
    balance: -500.00,
    currency: 'USD',
    isArchived: false,
    color: '#F5A623',
    icon: '💳',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 'trans1',
    type: 'expense',
    amount: 45.50,
    description: 'Grocery Shopping',
    categoryId: 'cat1',
    accountId: 'acc1',
    date: new Date('2025-02-15'),
    status: 'completed',
    isRecurring: false,
    createdAt: new Date('2025-02-15'),
    updatedAt: new Date('2025-02-15')
  },
  {
    id: 'trans2',
    type: 'income',
    amount: 2000.00,
    description: 'Salary Deposit',
    categoryId: 'cat4',
    accountId: 'acc1',
    date: new Date('2025-02-01'),
    status: 'completed',
    isRecurring: true,
    recurringDetails: {
      frequency: 'monthly',
      endDate: new Date('2025-12-31')
    },
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01')
  },
  {
    id: 'trans3',
    type: 'expense',
    amount: 35.00,
    description: 'Uber Ride',
    categoryId: 'cat2',
    accountId: 'acc3',
    date: new Date('2025-02-14'),
    status: 'completed',
    isRecurring: false,
    createdAt: new Date('2025-02-14'),
    updatedAt: new Date('2025-02-14')
  },
  {
    id: 'trans4',
    type: 'expense',
    amount: 120.00,
    description: 'Monthly Bus Pass',
    categoryId: 'cat2',
    accountId: 'acc1',
    date: new Date('2025-02-01'),
    status: 'completed',
    isRecurring: true,
    recurringDetails: {
      frequency: 'monthly',
      endDate: new Date('2025-12-31')
    },
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01')
  },
  {
    id: 'trans5',
    type: 'expense',
    amount: 85.00,
    description: 'Restaurant Dinner',
    categoryId: 'cat1',
    accountId: 'acc3',
    date: new Date('2025-02-16'),
    status: 'completed',
    isRecurring: false,
    createdAt: new Date('2025-02-16'),
    updatedAt: new Date('2025-02-16')
  },
  {
    id: 'trans6',
    type: 'expense',
    amount: 250.00,
    description: 'Online Course',
    categoryId: 'cat3',
    accountId: 'acc1',
    date: new Date('2025-02-10'),
    status: 'completed',
    isRecurring: false,
    createdAt: new Date('2025-02-10'),
    updatedAt: new Date('2025-02-10')
  },
  {
    id: 'trans7',
    type: 'expense',
    amount: 65.00,
    description: 'Weekly Groceries',
    categoryId: 'cat1',
    accountId: 'acc1',
    date: new Date('2025-02-17'),
    status: 'completed',
    isRecurring: false,
    createdAt: new Date('2025-02-17'),
    updatedAt: new Date('2025-02-17')
  },
  {
    id: 'trans8',
    type: 'expense',
    amount: 40.00,
    description: 'Taxi to Airport',
    categoryId: 'cat2',
    accountId: 'acc3',
    date: new Date('2025-02-18'),
    status: 'completed',
    isRecurring: false,
    createdAt: new Date('2025-02-18'),
    updatedAt: new Date('2025-02-18')
  },
  {
    id: 'trans9',
    type: 'expense',
    amount: 150.00,
    description: 'Textbooks',
    categoryId: 'cat3',
    accountId: 'acc1',
    date: new Date('2025-02-05'),
    status: 'completed',
    isRecurring: false,
    createdAt: new Date('2025-02-05'),
    updatedAt: new Date('2025-02-05')
  },
  {
    id: 'trans10',
    type: 'expense',
    amount: 30.00,
    description: 'Coffee Shop',
    categoryId: 'cat1',
    accountId: 'acc3',
    date: new Date('2025-02-19'),
    status: 'completed',
    isRecurring: false,
    createdAt: new Date('2025-02-19'),
    updatedAt: new Date('2025-02-19')
  },
  {
    id: 'trans11',
    type: 'expense',
    amount: 75.00,
    description: 'Train Ticket',
    categoryId: 'cat2',
    accountId: 'acc1',
    date: new Date('2025-02-20'),
    status: 'completed',
    isRecurring: false,
    createdAt: new Date('2025-02-20'),
    updatedAt: new Date('2025-02-20')
  },
  {
    id: 'trans12',
    type: 'expense',
    amount: 200.00,
    description: 'Workshop Registration',
    categoryId: 'cat3',
    accountId: 'acc1',
    date: new Date('2025-02-12'),
    status: 'completed',
    isRecurring: false,
    createdAt: new Date('2025-02-12'),
    updatedAt: new Date('2025-02-12')
  },
  {
    id: 'trans13',
    type: 'expense',
    amount: 55.00,
    description: 'Lunch Meeting',
    categoryId: 'cat1',
    accountId: 'acc3',
    date: new Date('2025-02-21'),
    status: 'completed',
    isRecurring: false,
    createdAt: new Date('2025-02-21'),
    updatedAt: new Date('2025-02-21')
  }
];

export const mockBudgets: Budget[] = [
  {
    id: 'bud1',
    name: 'Monthly Budget',
    amount: 2000.00,
    period: 'monthly',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-12-31'),
    categoryBudgets: [
      {
        categoryId: 'cat1',
        amount: 500.00,
        percentage: 25
      },
      {
        categoryId: 'cat2',
        amount: 300.00,
        percentage: 15
      },
      {
        categoryId: 'cat3',
        amount: 800.00,
        percentage: 40
      },
      {
        categoryId: 'cat4',
        amount: 400.00,
        percentage: 20
      }
    ],
    isActive: true,
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01')
  }
]; 