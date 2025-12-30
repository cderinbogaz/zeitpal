import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isWeekend,
  parseISO,
} from 'date-fns';

import type { HalfDayType, LeaveBalance } from '~/lib/types';

/**
 * Leave Calculation Utilities
 *
 * German-compliant calculations for work days, pro-rata entitlements,
 * and carryover rules.
 */

/**
 * Calculate the number of working days between two dates.
 * Excludes weekends and public holidays.
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param holidays - Array of holiday dates in YYYY-MM-DD format
 * @param startHalfDay - Half day for start date (morning/afternoon/null)
 * @param endHalfDay - Half day for end date (morning/afternoon/null)
 * @returns Number of working days (can be decimal for half-days)
 *
 * @example
 * calculateWorkDays('2024-01-01', '2024-01-07', ['2024-01-01'])
 * // Returns 4 (excludes weekend + New Year)
 */
export function calculateWorkDays(
  startDate: string,
  endDate: string,
  holidays: string[],
  startHalfDay: HalfDayType = null,
  endHalfDay: HalfDayType = null,
): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (isAfter(start, end)) {
    return 0;
  }

  const holidaySet = new Set(holidays);
  const days = eachDayOfInterval({ start, end });

  let workDays = 0;

  for (let i = 0; i < days.length; i++) {
    const day = days[i]!;
    const dateStr = format(day, 'yyyy-MM-dd');

    // Skip weekends
    if (isWeekend(day)) {
      continue;
    }

    // Skip holidays
    if (holidaySet.has(dateStr)) {
      continue;
    }

    // Check for half days
    const isFirstDay = i === 0;
    const isLastDay = i === days.length - 1;
    const isSingleDay = days.length === 1;

    if (isSingleDay) {
      // Single day request
      if (startHalfDay || endHalfDay) {
        workDays += 0.5;
      } else {
        workDays += 1;
      }
    } else if (isFirstDay && startHalfDay) {
      // First day is half day
      workDays += 0.5;
    } else if (isLastDay && endHalfDay) {
      // Last day is half day
      workDays += 0.5;
    } else {
      workDays += 1;
    }
  }

  return workDays;
}

/**
 * Calculate pro-rata entitlement for employees who started mid-year.
 * German law requires proportional leave calculation based on months worked.
 *
 * @param startDate - Employment start date
 * @param annualDays - Full annual entitlement
 * @param year - Year to calculate for
 * @returns Pro-rata entitlement (rounded to nearest 0.5)
 */
export function calculateProRataEntitlement(
  startDate: string,
  annualDays: number,
  year: number,
): number {
  const empStart = parseISO(startDate);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  // If employment started before this year, full entitlement
  if (isBefore(empStart, yearStart)) {
    return annualDays;
  }

  // If employment started after this year, no entitlement
  if (isAfter(empStart, yearEnd)) {
    return 0;
  }

  // Calculate months worked this year
  const startMonth = empStart.getMonth();
  const monthsWorked = 12 - startMonth;

  // Pro-rata calculation
  const proRata = (annualDays / 12) * monthsWorked;

  // Round to nearest 0.5
  return Math.round(proRata * 2) / 2;
}

/**
 * Calculate part-time pro-rata adjustment.
 * Adjusts entitlement based on weekly hours compared to full-time.
 *
 * @param weeklyHours - Employee's weekly hours
 * @param fullTimeHours - Full-time hours (default 40)
 * @param fullTimeDays - Full-time entitlement
 * @returns Adjusted entitlement
 */
export function calculatePartTimeProRata(
  weeklyHours: number,
  fullTimeDays: number,
  fullTimeHours = 40,
): number {
  const ratio = weeklyHours / fullTimeHours;
  const adjusted = fullTimeDays * ratio;

  // Round to nearest 0.5
  return Math.round(adjusted * 2) / 2;
}

/**
 * Calculate carryover based on organization policy.
 *
 * @param currentBalance - Current leave balance
 * @param maxCarryoverDays - Maximum days that can be carried over
 * @param expiryDate - Carryover expiry date (MM-DD format)
 * @param currentDate - Current date for comparison
 * @returns Object with carryover amount and days until expiry
 */
export function calculateCarryover(
  remainingDays: number,
  maxCarryoverDays: number,
  expiryDate: string,
  currentDate: Date = new Date(),
): {
  carryoverAmount: number;
  daysUntilExpiry: number;
  isExpired: boolean;
} {
  // Calculate carryover amount (capped at max)
  const carryoverAmount = Math.min(remainingDays, maxCarryoverDays);

  // Calculate expiry date for current year
  const parts = expiryDate.split('-').map(Number);
  const month = parts[0] ?? 3; // Default to March
  const day = parts[1] ?? 31;  // Default to 31st
  const expiryYear = currentDate.getMonth() < month - 1
    ? currentDate.getFullYear()
    : currentDate.getFullYear() + 1;
  const expiry = new Date(expiryYear, month - 1, day);

  // Calculate days until expiry
  const daysUntilExpiry = differenceInDays(expiry, currentDate);
  const isExpired = daysUntilExpiry < 0;

  return {
    carryoverAmount: isExpired ? 0 : carryoverAmount,
    daysUntilExpiry: Math.max(0, daysUntilExpiry),
    isExpired,
  };
}

/**
 * Calculate remaining balance from a leave balance record.
 *
 * @param balance - Leave balance record
 * @returns Remaining days
 */
export function calculateRemainingBalance(balance: LeaveBalance): number {
  return balance.entitled + balance.carriedOver + balance.adjustment - balance.used - balance.pending;
}

/**
 * Check if a date is a working day.
 *
 * @param date - Date to check
 * @param holidays - Array of holiday dates
 * @returns true if it's a working day
 */
export function isWorkingDay(date: Date, holidays: string[]): boolean {
  if (isWeekend(date)) {
    return false;
  }

  const dateStr = format(date, 'yyyy-MM-dd');
  return !holidays.includes(dateStr);
}

/**
 * Get the next working day from a given date.
 *
 * @param date - Starting date
 * @param holidays - Array of holiday dates
 * @returns Next working day
 */
export function getNextWorkingDay(date: Date, holidays: string[]): Date {
  let current = addDays(date, 1);

  while (!isWorkingDay(current, holidays)) {
    current = addDays(current, 1);
  }

  return current;
}

/**
 * Check if two date ranges overlap.
 *
 * @param start1 - Start of first range
 * @param end1 - End of first range
 * @param start2 - Start of second range
 * @param end2 - End of second range
 * @returns true if ranges overlap
 */
export function dateRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  const s1 = parseISO(start1);
  const e1 = parseISO(end1);
  const s2 = parseISO(start2);
  const e2 = parseISO(end2);

  return (
    (isBefore(s1, e2) || isSameDay(s1, e2)) &&
    (isAfter(e1, s2) || isSameDay(e1, s2))
  );
}

/**
 * Format work days for display (handles half days).
 *
 * @param days - Number of work days
 * @param locale - Locale for formatting ('en' or 'de')
 * @returns Formatted string
 */
export function formatWorkDays(days: number, locale: 'en' | 'de' = 'en'): string {
  const isHalf = days % 1 !== 0;
  const fullDays = Math.floor(days);

  if (locale === 'de') {
    if (days === 0.5) return '0,5 Tage';
    if (days === 1) return '1 Tag';
    if (isHalf) return `${days.toString().replace('.', ',')} Tage`;
    return `${fullDays} Tage`;
  }

  if (days === 0.5) return '0.5 days';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * German minimum leave calculation.
 * German law: 20 days for 5-day week, 24 days for 6-day week.
 *
 * @param workDaysPerWeek - Number of work days per week
 * @returns Minimum legal annual leave
 */
export function getGermanMinimumLeave(workDaysPerWeek: number): number {
  // BUrlG (Bundesurlaubsgesetz) minimum: 24 work days for 6-day week
  // For 5-day week: (24 / 6) * 5 = 20 days
  return Math.round((24 / 6) * workDaysPerWeek);
}

/**
 * Check if sick leave requires a medical certificate (AU).
 *
 * @param sickDays - Number of consecutive sick days
 * @param threshold - Days before AU is required (default 3)
 * @returns true if AU is required
 */
export function requiresMedicalCertificate(
  sickDays: number,
  threshold = 3,
): boolean {
  return sickDays > threshold;
}
