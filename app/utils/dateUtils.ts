// utils/dateUtils.ts
import { TimeFrame } from '../types/types'; // Assuming TimeFrame type is in your types file

export const getDateRange = (period: TimeFrame): { startDate: Date, endDate: Date } => {
  const now = new Date();
  let startDate: Date;

  if (period === 'week') {
    const day = now.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    startDate = new Date(now);
    startDate.setDate(now.getDate() - diff);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  return { startDate, endDate: now };
};