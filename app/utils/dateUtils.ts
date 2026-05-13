// utils/dateUtils.ts
import { RecurringInterval, TimeFrame } from '../types/types';

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

// Advance a date string ("YYYY-MM-DD") by one recurrence interval.
// Monthly: same day next month, clamped to last day if original day doesn't exist (e.g. Jan 31 → Feb 28).
// Biweekly: +14 days.
// Advance next_run_date forward by the interval until it's >= today. Client-side only, no DB write.
export function getEffectiveNextRunDate(dateStr: string, interval: RecurringInterval): string {
  const today = new Date().toISOString().split('T')[0];
  let current = dateStr;
  while (current < today) {
    current = computeNextRunDate(current, interval);
  }
  return current;
}

export function computeNextRunDate(dateStr: string, interval: RecurringInterval): string {
  const [year, month, day] = dateStr.split('-').map(Number);

  if (interval === 'biweekly') {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + 14);
    return d.toISOString().split('T')[0];
  }

  // monthly: advance month, clamp day to last day of target month
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const lastDayOfNextMonth = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfNextMonth);
  const mm = String(nextMonth).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return `${nextYear}-${mm}-${dd}`;
}