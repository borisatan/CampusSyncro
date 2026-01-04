// utils/chartUtils.ts
import { ChartDataPoint, Transaction } from '../types/types';

export const aggregateTransactionsByDay = (transactions: Transaction[]): ChartDataPoint[] => {
  const now = new Date();
  const currentDay = now.getDay();
  const diff = (currentDay === 0 ? 6 : currentDay - 1);
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);

  const dailyTotals: Record<string, number> = {};
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const key = date.toISOString().split('T')[0];
    dailyTotals[key] = 0;
  }

  transactions.forEach(t => {
    const date = new Date(t.created_at);
    const key = date.toISOString().split('T')[0];
    if (key in dailyTotals) {
      dailyTotals[key] += Math.abs(t.amount);
    }
  });

  return Object.keys(dailyTotals).map((key, index) => {
    const date = new Date(key);
    const dayIndex = (date.getDay() + 6) % 7;
    return {
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex],
      amount: dailyTotals[key],
      x: index
    };
  });
};

export const aggregateTransactionsByWeek = (transactions: Transaction[]): ChartDataPoint[] => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const weeklyTotals: number[] = [0, 0, 0, 0, 0];
  
  transactions.forEach(t => {
    const date = new Date(t.created_at);
    const dayOfMonth = date.getDate();
    const weekIndex = Math.floor((dayOfMonth - 1) / 7);
    if (weekIndex < 5) {
      weeklyTotals[weekIndex] += Math.abs(t.amount);
    }
  });

  const weeks = weeklyTotals.filter((_, i) => {
    const weekStart = new Date(firstDay);
    weekStart.setDate(1 + (i * 7));
    return weekStart <= now;
  });

  return weeks.map((total, index) => ({
    label: `W${index + 1}`,
    amount: total,
    x: index
  }));
};

export const aggregateTransactionsByMonth = (transactions: Transaction[]): ChartDataPoint[] => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentYear = now.getFullYear();
  const monthlyTotals: Record<number, number> = {};
  
  for (let i = 0; i <= now.getMonth(); i++) {
    monthlyTotals[i] = 0;
  }

  transactions.forEach(t => {
    const date = new Date(t.created_at);
    if (date.getFullYear() === currentYear) {
      const month = date.getMonth();
      monthlyTotals[month] += Math.abs(t.amount);
    }
  });

  return Object.keys(monthlyTotals).map((month, index) => ({
    label: monthNames[parseInt(month)],
    amount: monthlyTotals[parseInt(month)],
    x: index
  }));
};