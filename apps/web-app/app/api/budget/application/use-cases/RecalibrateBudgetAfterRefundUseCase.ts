import { normalizeAllocation } from "@/libs/financeService";
import { IBudgetRepository } from "../../domain/repositories/IBudgetRepository";

export interface RecalibrationInput {
  totalIncomeCents: number;
  fixedPercent: number;
  dailyPercent: number;
  reservePercent: number;
  refundAmountCents: number;
}

export interface RecalibrationResult {
  newTotalIncomeCents: number;
  newFixedPercent: number;
  newDailyPercent: number;
  newReservePercent: number;
}

export interface RecalibrateBudgetAfterRefundRequest {
  userId: string;
  monthId: string;
  refundAmountCents: number;
}

export class RecalibrateBudgetAfterRefundUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute(request: RecalibrateBudgetAfterRefundRequest): Promise<void> {
    const { userId, monthId, refundAmountCents } = request;

    const budget = await this.budgetRepository.findByUserAndMonth(
      userId,
      monthId,
    );

    if (!budget) {
      return;
    }

    const recalibrated = this.recalibrateAfterRefund({
      totalIncomeCents: budget.totalIncome,
      fixedPercent: budget.fixedPercent,
      dailyPercent: budget.dailyPercent,
      reservePercent: budget.reservePercent,
      refundAmountCents,
    });

    await this.budgetRepository.update(budget.id, userId, {
      totalIncome: recalibrated.newTotalIncomeCents,
      fixedPercent: recalibrated.newFixedPercent,
      dailyPercent: recalibrated.newDailyPercent,
      reservePercent: recalibrated.newReservePercent,
    });
  }

  /**
   * Recalibrates budget allocation percentages after a refund income is added.
   *
   * Business rules:
   * 1. new_total_income = total_income + refund_amount
   * 2. The absolute fixed amount stays the same:
   *      fixed_amount = total_income * (fixed_percent / 100)
   * 3. new_fixed_percent = (fixed_amount / new_total_income) * 100
   * 4. The internal ratio between daily and reserve is preserved.
   * 5. new_variable_percent = 100 - new_fixed_percent
   * 6. Redistribute variable maintaining original ratio.
   * 7. normalizeAllocation() ensures the sum is exactly 100%.
   */
  private recalibrateAfterRefund(
    input: RecalibrationInput,
  ): RecalibrationResult {
    const {
      totalIncomeCents,
      fixedPercent,
      dailyPercent,
      reservePercent,
      refundAmountCents,
    } = input;

    const variableOriginal = dailyPercent + reservePercent;
    const newTotalIncomeCents = totalIncomeCents + refundAmountCents;

    const fixedAmountCents = totalIncomeCents * (fixedPercent / 100);
    const newFixedPercent = (fixedAmountCents / newTotalIncomeCents) * 100;

    const dailyRatio = dailyPercent / variableOriginal;
    const reserveRatio = reservePercent / variableOriginal;

    const newVariablePercent = 100 - newFixedPercent;
    const newDailyPercent = newVariablePercent * dailyRatio;
    const newReservePercent = newVariablePercent * reserveRatio;

    const normalized = normalizeAllocation(
      newFixedPercent,
      newDailyPercent,
      newReservePercent,
    );

    return {
      newTotalIncomeCents,
      newFixedPercent: normalized.fixedPercent,
      newDailyPercent: normalized.dailyPercent,
      newReservePercent: normalized.reservePercent,
    };
  }
}
