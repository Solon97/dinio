/**
 * Invoice cycle calculation logic
 *
 * Computes which invoice month an expense belongs to, handling:
 * - Closing days in the same month as due date
 * - Closing days in the month prior to due date (e.g., due 7 with closing 28)
 * - Year rollovers
 * - Month boundaries for short months (28/29/30/31 days)
 */

import { addMonths, computeMonthIdFromDate, parseMonthId } from './month-id';
import {
  normalizeDayOfMonth,
  getDaysInMonth,
  getDateOnly,
} from './normalize';

interface CardDayInput {
  dueDay?: number;
  closingDay?: number;
}

/**
 * Calculate the effective closing day for a card, with fallback logic.
 * If no closing day is provided, defaults to (dueDay - 7), clamped to [1, 31].
 */
export function getEffectiveClosingDay({
  dueDay,
  closingDay,
}: CardDayInput): number {
  if (closingDay !== undefined && closingDay !== null) {
    return normalizeDayOfMonth(
      closingDay,
      getFallbackClosingDay(dueDay),
    );
  }

  return getFallbackClosingDay(dueDay);
}

/**
 * Default closing day calculation: dueDay - 7 days
 */
function getFallbackClosingDay(dueDay?: number): number {
  const normalizedDueDay = normalizeDayOfMonth(dueDay, 10);
  return normalizeDayOfMonth(normalizedDueDay - 7, 1);
}

/**
 * Build the absolute closing date for a given due month.
 * Handles closing days that fall in the previous month.
 */
function buildClosingDateForDueMonthId({
  dueMonthId,
  dueDay,
  closingDay,
}: {
  dueMonthId: number;
  dueDay?: number;
  closingDay?: number;
}): Date {
  const { year, month } = parseMonthId(dueMonthId);
  const normalizedDueDay = normalizeDayOfMonth(dueDay, 10);
  const effectiveClosingDay = getEffectiveClosingDay({ dueDay, closingDay });
  const closesInPreviousMonth = effectiveClosingDay > normalizedDueDay;

  const closingMonthDate = closesInPreviousMonth
    ? new Date(year, month - 1, 1)
    : new Date(year, month, 1);

  const closingYear = closingMonthDate.getFullYear();
  const closingMonth = closingMonthDate.getMonth();
  const clampedClosingDay = Math.min(
    effectiveClosingDay,
    getDaysInMonth(closingYear, closingMonth),
  );

  return new Date(closingYear, closingMonth, clampedClosingDay);
}

/**
 * Compute the invoice due month ID for a given expense date.
 * Searches forward up to 3 months to find the first invoice cycle that hasn't closed yet.
 *
 * @param expenseDate - Date object for the expense
 * @param dueDay - Day of month when invoice is due (e.g., 7 for the 7th)
 * @param closingDay - Day of month when invoice closes (e.g., 28 for the 28th, can be in previous month)
 * @returns month_id in YYYYMM format
 *
 * @example
 * // Card with due day 7, closing day 28 (previous month)
 * // Purchase on March 5 → belongs to April (202604)
 * computeInvoiceDueMonthIdForDate({
 *   expenseDate: new Date(2026, 2, 5),
 *   dueDay: 7,
 *   closingDay: 28,
 * }) // 202604
 *
 * @example
 * // Purchase after April closing (Mar 29 after Mar 28) → May (202605)
 * computeInvoiceDueMonthIdForDate({
 *   expenseDate: new Date(2026, 2, 29),
 *   dueDay: 7,
 *   closingDay: 28,
 * }) // 202605
 */
export function computeInvoiceDueMonthIdForDate({
  expenseDate,
  dueDay,
  closingDay,
}: {
  expenseDate: Date;
  dueDay?: number;
  closingDay?: number;
}): number {
  const normalizedExpenseDate = getDateOnly(expenseDate);
  const baseMonthId = computeMonthIdFromDate(normalizedExpenseDate);

  // Find the first due month whose closing date has not passed yet
  for (let monthOffset = 0; monthOffset <= 3; monthOffset += 1) {
    const candidateDueMonthId = addMonths(baseMonthId, monthOffset);
    const closingDate = buildClosingDateForDueMonthId({
      dueMonthId: candidateDueMonthId,
      dueDay,
      closingDay,
    });

    if (normalizedExpenseDate <= closingDate) {
      return candidateDueMonthId;
    }
  }

  // Fallback (should rarely be reached)
  return addMonths(baseMonthId, 1);
}

/**
 * Format a YYYYMM month_id as display string
 */
export function formatMonthIdLabel(monthId: number): string {
  const year = Math.floor(monthId / 100);
  const month = monthId % 100;
  const date = new Date(year, month - 1, 1);
  const label = date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}
