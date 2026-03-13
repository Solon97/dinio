/**
 * Utility functions for card day normalization and date handling.
 */

/**
 * Normalize a day-of-month value to a valid range (1-31)
 * @param value - The day value to normalize
 * @param fallback - Fallback value if input is not finite
 * @returns Normalized day in range [1, 31]
 */
export function normalizeDayOfMonth(
  value: number | undefined,
  fallback: number = 1,
): number {
  if (!Number.isFinite(value)) {
    return Math.min(31, Math.max(1, fallback));
  }

  return Math.min(31, Math.max(1, Math.trunc(value as number)));
}

/**
 * Get the number of days in a given month
 * @param year - Full year (e.g., 2026)
 * @param zeroBasedMonth - 0-based month (0 = January, 11 = December)
 * @returns Number of days in the month
 */
export function getDaysInMonth(
  year: number,
  zeroBasedMonth: number,
): number {
  return new Date(year, zeroBasedMonth + 1, 0).getDate();
}

/**
 * Extract date-only portion of a Date (strips time)
 * @param value - The Date object
 * @returns New Date with same date but time normalized to midnight UTC
 */
export function getDateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
