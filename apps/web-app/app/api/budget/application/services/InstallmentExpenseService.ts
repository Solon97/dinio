import { FixedExpense } from "@/types/finance";
import {
  IFixedExpenseRepository,
  IInstallmentExpenseRepository,
} from "../../domain/repositories/IBudgetRepository";
import {
  calculateInstallmentValues,
  computeMonthId,
  expenseTypeToIsMandatory,
} from "../../helpers";

/**
 * Service responsible for managing installment expenses lifecycle.
 * Isolates common logic used by both CreateBudgetUseCase and UpdateBudgetUseCase.
 */
export class InstallmentExpenseService {
  constructor(
    private installmentExpenseRepository: IInstallmentExpenseRepository,
    private fixedExpenseRepository: IFixedExpenseRepository,
  ) {}

  /**
   * Processes installment expenses: creates parent record and generates
   * fixed_expenses for each month/installment.
   */
  async processInstallmentExpenses(
    userId: string,
    currentMonthId: string,
    installmentExpenses: FixedExpense[],
  ): Promise<void> {
    for (const expense of installmentExpenses) {
      if (!expense.isInstallment || !expense.totalInstallments) {
        continue;
      }

      // If it already has an installmentExpenseId, it's an existing one - skip creation
      if (expense.installmentExpenseId) {
        continue;
      }

      // Create new installment expense
      await this.createInstallmentExpense(
        userId,
        parseInt(currentMonthId),
        expense,
      );
    }
  }

  /**
   * Creates a new installment expense and all its monthly installments.
   */
  private async createInstallmentExpense(
    userId: string,
    startsAtMonthId: number,
    expense: FixedExpense,
  ): Promise<void> {
    const totalAmountCents = expense.amount;
    const totalInstallments = expense.totalInstallments!;
    const startInstallment = expense.startInstallment || 1;

    // Calculate end month based on remaining installments
    const remainingInstallments = totalInstallments - startInstallment + 1;
    const endsAtMonthId = this.calculateEndMonthId(
      startsAtMonthId,
      remainingInstallments - 1,
    );

    // Create parent installment_expenses record
    const installmentExpense = await this.installmentExpenseRepository.create({
      userId,
      name: expense.name,
      creditCardId: expense.creditCardId,
      totalAmount: totalAmountCents,
      totalInstallments,
      startInstallment,
      startsAtMonthId,
      endsAtMonthId,
    });

    // Calculate installment values
    const { firstInstallmentAmount, regularInstallmentAmount } =
      calculateInstallmentValues(totalAmountCents, totalInstallments);

    // Generate fixed_expenses for each month/installment
    const fixedExpensesToCreate = [];
    let currentMonthId = startsAtMonthId;
    let currentInstallment = startInstallment;

    for (let i = 0; i < remainingInstallments; i++) {
      const installmentAmount =
        currentInstallment === 1
          ? firstInstallmentAmount
          : regularInstallmentAmount;

      fixedExpensesToCreate.push({
        userId,
        monthId: String(currentMonthId),
        name: expense.name,
        amount: installmentAmount,
        dueDay: expense.dueDay,
        isMandatory: expenseTypeToIsMandatory(expense.type),
        creditCardId: expense.creditCardId,
        installmentExpenseId: installmentExpense.id!,
        isInstallment: true,
        currentInstallment,
        totalInstallments,
        isRefundable: expense.isRefundable ?? false,
      });

      currentMonthId = this.calculateNextMonthId(currentMonthId);
      currentInstallment++;
    }

    if (fixedExpensesToCreate.length > 0) {
      await this.fixedExpenseRepository.bulkCreate(fixedExpensesToCreate);
    }
  }

  /**
   * Calculates the next month ID.
   * Example: 202601 -> 202602, 202612 -> 202701
   */
  private calculateNextMonthId(monthId: number): number {
    const year = Math.floor(monthId / 100);
    const month = monthId % 100;

    if (month === 12) {
      return (year + 1) * 100 + 1;
    }

    return monthId + 1;
  }

  /**
   * Calculates the end month ID based on start month and number of months ahead.
   */
  private calculateEndMonthId(
    startMonthId: number,
    monthsAhead: number,
  ): number {
    let currentMonthId = startMonthId;

    for (let i = 0; i < monthsAhead; i++) {
      currentMonthId = this.calculateNextMonthId(currentMonthId);
    }

    return currentMonthId;
  }
}
