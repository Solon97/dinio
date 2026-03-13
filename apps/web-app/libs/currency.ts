/**
 * Currency conversion utilities
 * Stores monetary values as integers (cents) in the database
 * Displays as decimal (currency) in the application
 */

/**
 * Convert decimal currency to integer cents
 * @param currency - Value in currency (e.g., 100.50)
 * @returns Value in cents (e.g., 10050)
 */
export const toCents = (currency: number): number => {
  return Math.round(currency * 100);
};

/**
 * Convert integer cents to decimal currency
 * @param cents - Value in cents (e.g., 10050)
 * @returns Value in currency with 2 decimal places (e.g., 100.50)
 */
export const toCurrency = (cents: number): number => {
  return Math.round(cents) / 100;
};

/**
 * Format a value in currency to a string with 2 decimal places
 * @param value - Value in currency
 * @returns Formatted string with 2 decimal places (e.g., "100.50")
 */
export const formatCurrency = (value: number): string => {
  return value.toFixed(2);
};

/**
 * Format a value in currency to Brazilian currency format
 * @param value - Value in currency
 * @returns Formatted string (e.g., "R$ 100,50")
 */
export const formatBRL = (value: number): string | null => {
  if (isNaN(value)) {
    return null;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

/**
 * Calculate installment values ensuring penny-perfect distribution
 * @param totalAmountCents - Total amount in cents
 * @param totalInstallments - Number of installments
 * @returns Object containing base amount, remainder, and specific amounts for first vs regular installments
 */
export const calculateInstallmentValues = (
  totalAmountCents: number,
  totalInstallments: number,
) => {
  if (!totalInstallments || totalInstallments <= 0) {
    return {
      baseAmount: 0,
      remainder: 0,
      firstInstallmentAmount: 0,
      regularInstallmentAmount: 0,
    };
  }

  const baseAmount = Math.floor(totalAmountCents / totalInstallments);
  const remainder = totalAmountCents - baseAmount * totalInstallments;

  return {
    baseAmount,
    remainder,
    firstInstallmentAmount: baseAmount + remainder,
    regularInstallmentAmount: baseAmount,
  };
};
