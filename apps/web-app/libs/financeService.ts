import { FinancialStatus } from "@/types/finance";
import { z } from "zod";

// ============================================
// ALLOCATION VALIDATION & CALCULATION
// ============================================

/**
 * Validates allocation percentages ensuring:
 * - All percentages are non-negative
 * - Sum is approximately 100% (±0.1% tolerance for rounding)
 * - Total income is positive
 */
export const AllocationSchema = z
  .object({
    totalIncomeCents: z.number().positive("Total income must be positive"),
    fixedPercent: z
      .number()
      .min(0, "Fixed percent cannot be negative")
      .max(100, "Fixed percent cannot exceed 100%"),
    dailyPercent: z
      .number()
      .min(0, "Daily percent cannot be negative")
      .max(100, "Daily percent cannot exceed 100%"),
    reservePercent: z
      .number()
      .min(0, "Reserve percent cannot be negative")
      .max(100, "Reserve percent cannot exceed 100%"),
  })
  .refine(
    (data) => {
      const percentSum =
        data.fixedPercent + data.dailyPercent + data.reservePercent;
      const total = Math.round(percentSum * 10) / 10; // Round to 1 decimal place
      return total >= 99.9 && total <= 100.1;
    },
    {
      message:
        "Allocation percentages must sum to approximately 100% (±0.1% tolerance)",
    },
  );

export interface NormalizedAllocation {
  fixedPercent: number;
  dailyPercent: number;
  reservePercent: number;
}

/**
 * Normalizes allocation percentages to ensure they sum to exactly 100%.
 * Calculates the difference and adjusts the reserve percentage accordingly.
 *
 * Formula: adjustment = (1 - totalAllocated / 100) * 100
 * - If positive: add to reserve (surplus)
 * - If negative: subtract from reserve (deficit)
 *
 * @param fixedPercent - Fixed expenses percentage
 * @param dailyPercent - Daily spending percentage
 * @param reservePercent - Reserve/savings percentage
 * @returns Normalized allocation with percentages summing to 100%
 */
export const normalizeAllocation = (
  fixedPercent: number,
  dailyPercent: number,
  reservePercent: number,
): NormalizedAllocation => {
  const totalAllocated = fixedPercent + dailyPercent + reservePercent;
  const adjustment = (1 - totalAllocated / 100) * 100;

  const normalizedReservePercent = Math.max(
    0,
    Math.round((reservePercent + adjustment) * 100) / 100,
  );

  return {
    fixedPercent: Math.round(fixedPercent * 100) / 100,
    dailyPercent: Math.round(dailyPercent * 100) / 100,
    reservePercent: normalizedReservePercent,
  };
};

export interface AllocationValues {
  totalFixedCents: number;
  dailyBudgetCents: number;
  reserveAmountCents: number;
}

/**
 * Calculates monetary allocation values from percentages and total income.
 * All calculations use cents (integers) to avoid floating-point precision issues.
 * Automatically normalizes percentages to sum to 100% before calculation.
 *
 * @param totalIncomeCents - Total monthly income in cents
 * @param fixedPercent - Percentage allocated to fixed expenses (0-100)
 * @param dailyPercent - Percentage allocated to daily spending (0-100)
 * @param reservePercent - Percentage allocated to reserve/savings (0-100)
 * @returns Calculated allocation values in cents
 * @throws {ZodError} If validation fails
 */
export const calculateAllocationValues = (
  totalIncomeCents: number,
  fixedPercent: number,
  dailyPercent: number,
  reservePercent: number,
): AllocationValues => {
  // Validate inputs
  AllocationSchema.parse({
    totalIncomeCents,
    fixedPercent,
    dailyPercent,
    reservePercent,
  });

  // Normalize percentages to ensure they sum to 100%
  const normalized = normalizeAllocation(
    fixedPercent,
    dailyPercent,
    reservePercent,
  );

  // Calculate monetary values from percentages
  const totalFixedCents = Math.round(
    totalIncomeCents * (normalized.fixedPercent / 100),
  );
  const dailyBudgetCents = Math.round(
    totalIncomeCents * (normalized.dailyPercent / 100),
  );
  const reserveAmountCents = Math.round(
    totalIncomeCents * (normalized.reservePercent / 100),
  );

  return {
    totalFixedCents,
    dailyBudgetCents,
    reserveAmountCents,
  };
};

// ============================================
// STATUS & LEGACY FUNCTIONS
// ============================================

export const calculateStatus = (
  income: number,
  fixedExpenses: number,
): FinancialStatus => {
  const ratio = income > 0 ? fixedExpenses / income : 1;
  if (ratio > 0.7) return FinancialStatus.CRITICAL;
  if (ratio >= 0.5) return FinancialStatus.WARNING;
  return FinancialStatus.HEALTHY;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};
