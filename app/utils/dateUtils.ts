// utils/dateUtils.ts
import { TimeFrame } from '../types/types'; // Assuming TimeFrame type is in your types file

export const getDateRange = (period: TimeFrame, offset: number = 0): { startDate: Date, endDate: Date } => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (period === 'week') {
    const day = now.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);

    startDate = new Date(monday);
    startDate.setDate(monday.getDate() + offset * 7);

    if (offset === 0) {
      endDate = now;
    } else {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);

    if (offset === 0) {
      endDate = now;
    } else {
      endDate = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
    }
  } else {
    startDate = new Date(now.getFullYear() + offset, 0, 1);

    if (offset === 0) {
      endDate = now;
    } else {
      endDate = new Date(now.getFullYear() + offset, 11, 31, 23, 59, 59, 999);
    }
  }

  return { startDate, endDate };
};