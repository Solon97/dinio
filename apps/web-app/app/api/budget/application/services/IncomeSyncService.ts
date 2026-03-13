import { IIncomeRepository } from "../../domain/repositories/IBudgetRepository";
import { IncomeSource } from "@/types/finance";
import { isValidUUID } from "../../helpers";

/**
 * Service responsible for synchronizing income sources for a user's budget.
 * Handles create, update, and delete operations.
 */
export class IncomeSyncService {
  constructor(private incomeRepository: IIncomeRepository) {}

  /**
   * Synchronizes income sources by comparing submitted incomes with existing ones in the database.
   * - Updates existing incomes
   * - Creates new incomes
   * - Deletes removed incomes
   */
  async execute(
    userId: string,
    monthId: string,
    incomes: IncomeSource[],
  ): Promise<void> {
    const allDbIncomes = await this.incomeRepository.findByUserAndMonth(
      userId,
      monthId,
    );

    const existingIncomes = incomes.filter((i) => isValidUUID(i.id));
    const newIncomes = incomes.filter((i) => !isValidUUID(i.id));
    // Update existing incomes
    if (existingIncomes.length > 0) {
      await this.incomeRepository.bulkUpdate(
        userId,
        monthId,
        existingIncomes.map((income) => ({
          id: income.id!,
          name: income.name,
          amount: income.amount,
        })),
      );
    }

    // Create new incomes
    if (newIncomes.length > 0) {
      await this.incomeRepository.bulkCreate(
        newIncomes.map((income) => ({
          userId,
          monthId,
          name: income.name,
          amount: income.amount,
        })),
      );
    }

    // Delete removed incomes
    const submittedIncomeIds = new Set(
      incomes.filter((i) => isValidUUID(i.id)).map((i) => i.id!),
    );
    const incomesToDelete = (allDbIncomes || [])
      .map((i) => i.id!)
      .filter((id) => !submittedIncomeIds.has(id));

    if (incomesToDelete.length > 0) {
      await this.incomeRepository.delete(incomesToDelete, userId);
    }
  }
}
