import { Account, Category, CategoryAggregation, CategoryBudgetStatus, ChartDataPoint, Goal, Transaction } from '../types/types';

const DEMO_USER_ID = 'demo-user';

export const DEMO_CATEGORIES: Category[] = [
  { id: 'demo-cat-1', category_name: 'Food & Dining', icon: 'restaurant-outline', color: '#EF4444', user_id: DEMO_USER_ID, budget_amount: 600, show_on_dashboard: true, sort_order: 1 },
  { id: 'demo-cat-2', category_name: 'Transport', icon: 'car-outline', color: '#3B82F6', user_id: DEMO_USER_ID, budget_amount: 200, show_on_dashboard: true, sort_order: 2 },
  { id: 'demo-cat-3', category_name: 'Entertainment', icon: 'film-outline', color: '#8B5CF6', user_id: DEMO_USER_ID, budget_amount: 150, show_on_dashboard: true, sort_order: 3 },
  { id: 'demo-cat-4', category_name: 'Groceries', icon: 'cart-outline', color: '#10B981', user_id: DEMO_USER_ID, budget_amount: 400, show_on_dashboard: true, sort_order: 4 },
  { id: 'demo-cat-5', category_name: 'Health', icon: 'medkit-outline', color: '#EC4899', user_id: DEMO_USER_ID, budget_amount: 100, show_on_dashboard: true, sort_order: 5 },
  { id: 'demo-cat-6', category_name: 'Shopping', icon: 'bag-outline', color: '#F59E0B', user_id: DEMO_USER_ID, budget_amount: 300, show_on_dashboard: false, sort_order: 6 },
  { id: 'demo-cat-7', category_name: 'Bills', icon: 'receipt-outline', color: '#6366F1', user_id: DEMO_USER_ID, budget_amount: 250, show_on_dashboard: false, sort_order: 7 },
  { id: 'demo-cat-8', category_name: 'Coffee', icon: 'cafe-outline', color: '#D97706', user_id: DEMO_USER_ID, budget_amount: 80, show_on_dashboard: false, sort_order: 8 },
];

export const DEMO_ACCOUNTS: Account[] = [
  { id: 'demo-acc-1', account_name: 'Checking', balance: 2847.50, type: 'checking', sort_order: 1, color: '#3B82F6' },
  { id: 'demo-acc-2', account_name: 'Savings', balance: 8200.00, type: 'savings', sort_order: 2, color: '#10B981' },
  { id: 'demo-acc-3', account_name: 'Credit Card', balance: -634.20, type: 'credit', sort_order: 3, color: '#EF4444' },
];

export const DEMO_GOALS: Goal[] = [
  {
    id: 1,
    user_id: DEMO_USER_ID,
    account_id: 'demo-acc-2',
    name: 'Emergency Fund',
    target_amount: 10000,
    current_amount: 8200,
    color: '#10B981',
    icon: 'shield-checkmark-outline',
    monthly_contribution: 1000,
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  },
];

// Generate dates relative to today
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

export const DEMO_TRANSACTIONS: Transaction[] = [
  // This month
  { id: 'demo-tx-1',  amount: -62.40,  category_name: 'Food & Dining',  account_name: 'Checking',    description: 'Dinner at Osteria',       created_at: daysAgo(1) },
  { id: 'demo-tx-2',  amount: -5.80,   category_name: 'Coffee',          account_name: 'Checking',    description: 'Morning latte',           created_at: daysAgo(2) },
  { id: 'demo-tx-3',  amount: -89.30,  category_name: 'Groceries',       account_name: 'Checking',    description: 'Weekly grocery run',      created_at: daysAgo(3) },
  { id: 'demo-tx-4',  amount: -38.00,  category_name: 'Transport',       account_name: 'Checking',    description: 'Uber rides',              created_at: daysAgo(4) },
  { id: 'demo-tx-5',  amount: -14.99,  category_name: 'Entertainment',   account_name: 'Credit Card', description: 'Spotify Premium',         created_at: daysAgo(5) },
  { id: 'demo-tx-6',  amount: 5200.00, category_name: 'Food & Dining',   account_name: 'Checking',    description: 'Monthly salary',          created_at: daysAgo(6) },
  { id: 'demo-tx-7',  amount: -45.20,  category_name: 'Food & Dining',   account_name: 'Checking',    description: 'Lunch with team',         created_at: daysAgo(7) },
  { id: 'demo-tx-8',  amount: -120.00, category_name: 'Shopping',        account_name: 'Credit Card', description: 'New sneakers',            created_at: daysAgo(8) },
  { id: 'demo-tx-9',  amount: -6.50,   category_name: 'Coffee',          account_name: 'Checking',    description: 'Flat white',              created_at: daysAgo(9) },
  { id: 'demo-tx-10', amount: -230.00, category_name: 'Bills',           account_name: 'Checking',    description: 'Electricity & internet',  created_at: daysAgo(10) },
  { id: 'demo-tx-11', amount: -55.00,  category_name: 'Health',          account_name: 'Checking',    description: 'Gym membership',          created_at: daysAgo(11) },
  { id: 'demo-tx-12', amount: -22.00,  category_name: 'Entertainment',   account_name: 'Credit Card', description: 'Cinema tickets',          created_at: daysAgo(12) },
  { id: 'demo-tx-13', amount: -72.10,  category_name: 'Groceries',       account_name: 'Checking',    description: 'Whole Foods run',         created_at: daysAgo(14) },
  { id: 'demo-tx-14', amount: -18.50,  category_name: 'Transport',       account_name: 'Checking',    description: 'Gas station',             created_at: daysAgo(15) },
  { id: 'demo-tx-15', amount: -88.00,  category_name: 'Food & Dining',   account_name: 'Credit Card', description: 'Birthday dinner',         created_at: daysAgo(16) },
  // Previous month
  { id: 'demo-tx-16', amount: -95.40,  category_name: 'Groceries',       account_name: 'Checking',    description: 'Costco run',              created_at: daysAgo(35) },
  { id: 'demo-tx-17', amount: -65.00,  category_name: 'Shopping',        account_name: 'Credit Card', description: 'Amazon order',            created_at: daysAgo(38) },
  { id: 'demo-tx-18', amount: -12.00,  category_name: 'Coffee',          account_name: 'Checking',    description: 'Coffee & pastry',         created_at: daysAgo(40) },
  { id: 'demo-tx-19', amount: 5200.00, category_name: 'Food & Dining',   account_name: 'Checking',    description: 'Monthly salary',          created_at: daysAgo(37) },
  { id: 'demo-tx-20', amount: -44.90,  category_name: 'Food & Dining',   account_name: 'Checking',    description: 'Thai takeout',            created_at: daysAgo(42) },
  { id: 'demo-tx-21', amount: -230.00, category_name: 'Bills',           account_name: 'Checking',    description: 'Electricity & internet',  created_at: daysAgo(41) },
  { id: 'demo-tx-22', amount: -30.00,  category_name: 'Transport',       account_name: 'Checking',    description: 'Monthly transit pass',    created_at: daysAgo(43) },
  { id: 'demo-tx-23', amount: -108.00, category_name: 'Entertainment',   account_name: 'Credit Card', description: 'Concert tickets',         created_at: daysAgo(45) },
  // Two months ago
  { id: 'demo-tx-24', amount: 5200.00, category_name: 'Food & Dining',   account_name: 'Checking',    description: 'Monthly salary',          created_at: daysAgo(67) },
  { id: 'demo-tx-25', amount: -78.20,  category_name: 'Groceries',       account_name: 'Checking',    description: 'Trader Joe\'s',           created_at: daysAgo(68) },
  { id: 'demo-tx-26', amount: -230.00, category_name: 'Bills',           account_name: 'Checking',    description: 'Electricity & internet',  created_at: daysAgo(70) },
  { id: 'demo-tx-27', amount: -55.00,  category_name: 'Health',          account_name: 'Checking',    description: 'Gym membership',          created_at: daysAgo(72) },
  { id: 'demo-tx-28', amount: -34.50,  category_name: 'Food & Dining',   account_name: 'Checking',    description: 'Brunch',                  created_at: daysAgo(74) },
  { id: 'demo-tx-29', amount: -195.00, category_name: 'Shopping',        account_name: 'Credit Card', description: 'Clothing haul',           created_at: daysAgo(76) },
  { id: 'demo-tx-30', amount: -8.50,   category_name: 'Coffee',          account_name: 'Checking',    description: 'Iced americano',          created_at: daysAgo(78) },
];

export const DEMO_BUDGET_STATUSES: CategoryBudgetStatus[] = [
  { category: DEMO_CATEGORIES[0], budget_amount: 600, spent: 624, percentage_used: 104 },
  { category: DEMO_CATEGORIES[1], budget_amount: 200, spent: 142, percentage_used: 71 },
  { category: DEMO_CATEGORIES[2], budget_amount: 150, spent: 143, percentage_used: 95.3 },
  { category: DEMO_CATEGORIES[3], budget_amount: 400, spent: 318, percentage_used: 79.5 },
  { category: DEMO_CATEGORIES[4], budget_amount: 100, spent: 45, percentage_used: 45 },
  { category: DEMO_CATEGORIES[5], budget_amount: 300, spent: 187, percentage_used: 62.3 },
  { category: DEMO_CATEGORIES[6], budget_amount: 250, spent: 230, percentage_used: 92 },
  { category: DEMO_CATEGORIES[7], budget_amount: 80, spent: 52, percentage_used: 65 },
];

export const DEMO_CATEGORIES_AGGREGATED: CategoryAggregation[] = [
  { category_name: 'Food & Dining', total_amount: 624, percent: 30.4 },
  { category_name: 'Groceries', total_amount: 318, percent: 15.5 },
  { category_name: 'Transport', total_amount: 142, percent: 6.9 },
  { category_name: 'Shopping', total_amount: 187, percent: 9.1 },
  { category_name: 'Bills', total_amount: 230, percent: 11.2 },
  { category_name: 'Entertainment', total_amount: 143, percent: 7.0 },
  { category_name: 'Coffee', total_amount: 52, percent: 2.5 },
  { category_name: 'Health', total_amount: 45, percent: 2.2 },
];

// Category icon map for the transaction list (icon name + color keyed by category name)
export const DEMO_CATEGORY_ICONS: Record<string, { icon: string; color: string }> = Object.fromEntries(
  DEMO_CATEGORIES.map(c => [c.category_name, { icon: c.icon, color: c.color }])
);

const TOTAL_BALANCE = 10413.30;
const MONTHLY_INCOME = 5200;
const MONTHLY_EXPENSES = 2741;

function makeMonthChart(baseSpend: number, seed: number): ChartDataPoint[] {
  return Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`,
    amount: i % 7 === 0 ? baseSpend * (0.3 + (seed % 3) * 0.1) :
            i % 3 === 0 ? baseSpend * (0.15 + (seed % 5) * 0.05) :
            baseSpend * (0.05 + (i % 4) * 0.03),
    x: i,
  }));
}

function makeWeekChart(baseSpend: number): ChartDataPoint[] {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const multipliers = [0.8, 0.6, 1.2, 0.7, 1.5, 2.1, 1.1];
  return labels.map((label, i) => ({ label, amount: baseSpend * multipliers[i], x: i }));
}

function makeYearChart(baseMonthly: number): ChartDataPoint[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const multipliers = [0.85, 0.78, 0.92, 1.05, 1.12, 0.95, 0.88, 1.02, 1.08, 1.15, 1.3, 1.45];
  return months.map((label, i) => ({ label, amount: baseMonthly * multipliers[i], x: i }));
}

const DEMO_CHART_DATA: Record<string, Record<number, ChartDataPoint[]>> = {
  month: {
    0: makeMonthChart(95, 1),
    [-1]: makeMonthChart(88, 2),
    [-2]: makeMonthChart(102, 3),
  },
  week: {
    0: makeWeekChart(42),
    [-1]: makeWeekChart(38),
    [-2]: makeWeekChart(51),
  },
  year: {
    0: makeYearChart(MONTHLY_EXPENSES),
    [-1]: makeYearChart(MONTHLY_EXPENSES * 0.9),
    [-2]: makeYearChart(MONTHLY_EXPENSES * 0.85),
  },
};

export const DEMO_DASHBOARD = {
  totalBalance: TOTAL_BALANCE,
  totalIncome: MONTHLY_INCOME,
  totalExpenses: MONTHLY_EXPENSES,
  categories: DEMO_CATEGORIES,
  categoriesAggregated: DEMO_CATEGORIES_AGGREGATED,
  chartData: DEMO_CHART_DATA.month[0],
  chartDataByOffset: DEMO_CHART_DATA.month as Record<number, ChartDataPoint[]>,
  chartByTimeFrame: DEMO_CHART_DATA as Record<string, Record<number, ChartDataPoint[]>>,
};

export const DEMO_SAVINGS_PROGRESS = {
  target: 500,
  saved: 420,
  percentage: 84,
};

export const DEMO_INCOME = {
  manualIncome: MONTHLY_INCOME,
  monthlySavingsTarget: 500,
  useDynamicIncome: false,
};
