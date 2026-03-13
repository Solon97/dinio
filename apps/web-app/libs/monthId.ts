/**
 * Month ID utilities for canonical YYYYMM format
 *
 * month_id format: YYYYMM (e.g., 202601 for January 2026)
 * This decouples financial events from monthly_budgets existence
 */

/**
 * Compute month_id from year and 0-based month
 * @param year - Full year (e.g., 2026)
 * @param month - 0-based month (0 = January, 11 = December)
 * @returns month_id in YYYYMM format
 * @example computeMonthId(2026, 0) // 202601 (January 2026)
 */
export const computeMonthId = (year: number, month: number): number => {
  return year * 100 + (month + 1);
};

/**
 * Compute month_id from a Date object
 * @param date - Date object
 * @returns month_id in YYYYMM format
 * @example computeMonthIdFromDate(new Date('2026-01-15')) // 202601
 */
export const computeMonthIdFromDate = (date: Date): number => {
  return computeMonthId(date.getFullYear(), date.getMonth());
};

/**
 * Compute month_id from a date string (YYYY-MM-DD)
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns month_id in YYYYMM format
 * @example computeMonthIdFromString('2026-01-15') // 202601
 */
export const computeMonthIdFromString = (dateString: string): number => {
  const date = new Date(dateString);
  return computeMonthIdFromDate(date);
};

/**
 * Extract year and 0-based month from month_id
 * @param monthId - month_id in YYYYMM format
 * @returns Object with year and 0-based month
 * @example parseMonthId(202601) // { year: 2026, month: 0 }
 */
export const parseMonthId = (
  monthId: number,
): { year: number; month: number } => {
  const year = Math.floor(monthId / 100);
  const month = (monthId % 100) - 1; // Convert to 0-based
  return { year, month };
};

/**
 * Format month_id for display
 * @param monthId - month_id in YYYYMM format
 * @param locale - Locale for month name (default: 'pt-BR')
 * @returns Formatted string (e.g., "Janeiro 2026")
 */
export const formatMonthId = (
  monthId: number,
  locale: string = "pt-BR",
): string => {
  const { year, month } = parseMonthId(monthId);
  const date = new Date(year, month, 1);
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
};

/**
 * Get current month_id
 * @returns Current month_id in YYYYMM format
 * @example getCurrentMonthId() // 202601 (if current month is January 2026)
 */
export const getCurrentMonthId = (): number => {
  return computeMonthIdFromDate(new Date());
};

/**
 * Add months to a month_id
 * @param monthId - Starting month_id
 * @param months - Number of months to add (can be negative)
 * @returns New month_id
 * @example addMonths(202601, 1) // 202602
 * @example addMonths(202612, 1) // 202701
 */
export const addMonths = (monthId: number, months: number): number => {
  const { year, month } = parseMonthId(monthId);
  const date = new Date(year, month + months, 1);
  return computeMonthIdFromDate(date);
};

/**
 * Get previous month_id
 * @param monthId - Current month_id
 * @returns Previous month_id
 * @example getPreviousMonthId(202601) // 202512
 */
export const getPreviousMonthId = (monthId: number): number => {
  return addMonths(monthId, -1);
};

/**
 * Get next month_id
 * @param monthId - Current month_id
 * @returns Next month_id
 * @example getNextMonthId(202601) // 202602
 */
export const getNextMonthId = (monthId: number): number => {
  return addMonths(monthId, 1);
};

/**
 * Check if a month_id is in the past
 * @param monthId - month_id to check
 * @returns true if the month is in the past
 */
export const isMonthInPast = (monthId: number): boolean => {
  return monthId < getCurrentMonthId();
};

/**
 * Check if a month_id is the current month
 * @param monthId - month_id to check
 * @returns true if the month is the current month
 */
export const isCurrentMonth = (monthId: number): boolean => {
  return monthId === getCurrentMonthId();
};

/**
 * Check if a month_id is in the future
 * @param monthId - month_id to check
 * @returns true if the month is in the future
 */
export const isMonthInFuture = (monthId: number): boolean => {
  return monthId > getCurrentMonthId();
};

/**
 * Validate month_id format
 * @param monthId - month_id to validate
 * @returns true if valid YYYYMM format
 */
export const isValidMonthId = (monthId: number): boolean => {
  const { year, month } = parseMonthId(monthId);
  return year >= 2020 && year <= 2100 && month >= 0 && month <= 11;
};
