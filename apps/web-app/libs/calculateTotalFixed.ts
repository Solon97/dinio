import { FixedExpense } from "@/types/finance";
import { calculateInstallmentValues } from "@/libs/currency";

/**
 * Calculates the total amount of fixed expenses in cents.
 *
 * For non-installment expenses, the full amount is added.
 * For installment expenses, only the current installment value is added.
 *
 * @param expenses - Array of fixed expenses
 * @returns Total amount in cents
 */
export function calculateTotalFixedExpenses(expenses: FixedExpense[]): number {
  return expenses.reduce((acc, curr) => {
    if (curr.markedForDeletion) {
      return acc;
    }

    const amountInCents = Math.round(curr.amount * 100);

    if (
      !curr.isInstallment ||
      (curr.isInstallment && curr.id && !curr.id?.startsWith("temp-"))
    ) {
      return acc + (amountInCents || 0);
    }
    //? New Installment Expense
    const totalAmountCents = amountInCents;
    const { firstInstallmentAmount, regularInstallmentAmount } =
      calculateInstallmentValues(totalAmountCents, curr.totalInstallments);

    const currentInstallment = curr.startInstallment || 1;
    const installmentValue =
      currentInstallment === 1
        ? firstInstallmentAmount
        : regularInstallmentAmount;

    return acc + installmentValue;
  }, 0);
}
