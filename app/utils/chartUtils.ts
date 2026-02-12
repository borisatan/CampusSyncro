// utils/chartUtils.ts
import { ChartDataPoint, Transaction } from '../types/types';

export const aggregateTransactionsByDay = (transactions: Transaction[], startDate?: Date): ChartDataPoint[] => {
  let monday: Date;
  if (startDate) {
    monday = new Date(startDate);
    monday.setHours(0, 0, 0, 0);
  } else {
    const now = new Date();
    const currentDay = now.getDay();
    const diff = (currentDay === 0 ? 6 : currentDay - 1);
    monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
  }

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

export const aggregateTransactionsByDayOfMonth = (transactions: Transaction[], startDate?: Date): ChartDataPoint[] => {
  const refDate = startDate ?? new Date();
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyTotals: Record<number, number> = {};

  // Initialize all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    dailyTotals[i] = 0;
  }

  transactions.forEach(t => {
    const date = new Date(t.created_at);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const dayOfMonth = date.getDate();
      dailyTotals[dayOfMonth] += Math.abs(t.amount);
    }
  });

  return Object.keys(dailyTotals).map((day, index) => ({
    label: day,
    amount: dailyTotals[parseInt(day)],
    x: index
  }));
};

export const aggregateTransactionsByMonth = (transactions: Transaction[], startDate?: Date): ChartDataPoint[] => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const refDate = startDate ?? new Date();
  const targetYear = refDate.getFullYear();
  const isCurrentYear = targetYear === new Date().getFullYear();
  const maxMonth = isCurrentYear ? new Date().getMonth() : 11;
  const monthlyTotals: Record<number, number> = {};

  for (let i = 0; i <= maxMonth; i++) {
    monthlyTotals[i] = 0;
  }

  transactions.forEach(t => {
    const date = new Date(t.created_at);
    if (date.getFullYear() === targetYear) {
      const month = date.getMonth();
      if (month in monthlyTotals) {
        monthlyTotals[month] += Math.abs(t.amount);
      }
    }
  });

  return Object.keys(monthlyTotals).map((month, index) => ({
    label: monthNames[parseInt(month)],
    amount: monthlyTotals[parseInt(month)],
    x: index
  }));
};