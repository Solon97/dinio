import {
  IFixedExpenseRepository,
  IInstallmentExpenseRepository,
} from "../../domain/repositories/IBudgetRepository";
import { FixedExpense } from "@/types/finance";
import { InstallmentExpenseService } from "./InstallmentExpenseService";
import { DatabaseFixedExpense } from "../../domain/entities/BudgetConfig";
import { expenseTypeToIsMandatory, isValidUUID } from "../../helpers";

/**
 * Service responsible for synchronizing fixed expenses for a user's budget.
 * Handles regular expenses and installment expenses separately.
 */
export class ExpenseSyncService {
  private installmentExpenseService: InstallmentExpenseService;

  constructor(
    private expenseRepository: IFixedExpenseRepository,
    installmentExpenseRepository: IInstallmentExpenseRepository,
  ) {
    this.installmentExpenseService = new InstallmentExpenseService(
      installmentExpenseRepository,
      expenseRepository,
    );
  }

  /**
   * Synchronizes expenses by comparing submitted expenses with existing ones in the database.
   * - Updates existing regular expenses
   * - Creates new regular expenses
   * - Processes new installment expenses
   * - Soft deletes removed expenses
   */
  async execute(
    userId: string,
    monthId: string,
    expenses: FixedExpense[],
  ): Promise<void> {
    const monthExistingExpenses =
      await this.expenseRepository.findByUserAndMonth(userId, monthId);

    const regularExpenses = expenses.filter((e) => !e.isInstallment);
    const installmentExpenses = expenses.filter((e) => e.isInstallment);

    // Handle regular expenses (update/create/delete)
    await this.syncRegularExpenses(
      userId,
      monthId,
      regularExpenses,
      monthExistingExpenses,
    );

    // Handle new installment expenses
    const newInstallmentExpenses = installmentExpenses.filter(
      (e) => !e.installmentExpenseId,
    );

    if (newInstallmentExpenses.length > 0) {
      await this.installmentExpenseService.processInstallmentExpenses(
        userId,
        monthId,
        newInstallmentExpenses,
      );
    }
  }

  /**
   * Synchronizes regular expenses only (no installments).
   */
  private async syncRegularExpenses(
    userId: string,
    monthId: string,
    expenses: FixedExpense[],
    monthExistingExpenses: Array<DatabaseFixedExpense>,
  ): Promise<void> {
    // Filter existing vs new regular expenses (only valid UUIDs are treated as existing)
    const existingRegularExpenses = expenses.filter((e) => isValidUUID(e.id));
    const newRegularExpenses: DatabaseFixedExpense[] = expenses
      .filter((e) => !isValidUUID(e.id))
      .map((expense) => ({
        userId,
        monthId,
        name: expense.name,
        amount: expense.amount,
        dueDay: expense.dueDay,
        isMandatory: expenseTypeToIsMandatory(expense.type),
        creditCardId: expense.creditCardId,
        isRefundable: expense.isRefundable ?? false,
      }));

    // Update existing regular expenses
    if (existingRegularExpenses.length > 0) {
      await this.expenseRepository.bulkUpdate(
        userId,
        monthId,
        existingRegularExpenses.map((expense) => ({
          id: expense.id!,
          name: expense.name,
          amount: expense.amount,
          dueDay: expense.dueDay,
          isMandatory: expenseTypeToIsMandatory(expense.type),
          creditCardId: expense.creditCardId,
          isRefundable: expense.isRefundable ?? false,
        })),
      );
    }

    // Create new regular expenses
    if (newRegularExpenses.length > 0) {
      await this.expenseRepository.bulkCreate(newRegularExpenses);
    }

    // Soft delete removed regular expenses (exclude installments)
    const submittedExpenseIds = new Set(
      expenses.filter((e) => e.id).map((e) => e.id!),
    );
    const expensesToSoftDelete = (monthExistingExpenses || [])
      .filter((e) => !e.installmentExpenseId)
      .map((e) => e.id!)
      .filter((id) => !submittedExpenseIds.has(id));

    if (expensesToSoftDelete.length > 0) {
      await this.expenseRepository.softDelete(expensesToSoftDelete, userId);
    }
  }
}
