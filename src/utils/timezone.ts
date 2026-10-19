import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

const TIMEZONE = 'Asia/Manila';

/**
 * Get current time in Asia/Manila timezone
 */
export const getNowInManila = (): Date => {
  return toZonedTime(new Date(), TIMEZONE);
};

/**
 * Get start of day in Manila timezone (midnight)
 */
export const getStartOfDayManila = (date: Date = new Date()): Date => {
  const manilaTime = toZonedTime(date, TIMEZONE);
  const startOfDay = new Date(manilaTime);
  startOfDay.setHours(0, 0, 0, 0);
  return fromZonedTime(startOfDay, TIMEZONE);
};

/**
 * Get end of day in Manila timezone (23:59:59)
 */
export const getEndOfDayManila = (date: Date = new Date()): Date => {
  const manilaTime = toZonedTime(date, TIMEZONE);
  const endOfDay = new Date(manilaTime);
  endOfDay.setHours(23, 59, 59, 999);
  return fromZonedTime(endOfDay, TIMEZONE);
};

/**
 * Get start of month in Manila timezone
 */
export const getStartOfMonthManila = (date: Date = new Date()): Date => {
  const manilaTime = toZonedTime(date, TIMEZONE);
  const startOfMonth = new Date(manilaTime);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return fromZonedTime(startOfMonth, TIMEZONE);
};

/**
 * Get end of month in Manila timezone
 */
export const getEndOfMonthManila = (date: Date = new Date()): Date => {
  const manilaTime = toZonedTime(date, TIMEZONE);
  const endOfMonth = new Date(manilaTime);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);
  return fromZonedTime(endOfMonth, TIMEZONE);
};

/**
 * Format date in Manila timezone
 */
export const formatDateManila = (
  date: Date,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss'
): string => {
  return format(toZonedTime(date, TIMEZONE), formatStr, { timeZone: TIMEZONE });
};
