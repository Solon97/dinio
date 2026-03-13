import { calculateAllocationValues } from "@/libs/financeService";
import {
  buildDateRange,
  calculateDailyHistory,
  calculateFinancialMetrics,
  getDaysInMonth,
  getTZDateParts,
} from "@/app/api/budget/helpers";
import {
  IBudgetRepository,
  IDailyExpenseRepository,
} from "@/app/api/budget/domain/repositories/IBudgetRepository";
import { DailyExpenseRow } from "@/types/budget";
import { computeMonthId } from "@/libs/monthId";

export interface BotFinancialStatus {
  isConfigured: boolean;
  recommendedTodayCents: number;
  recommendedForFuture: number;
  todaySpentCents: number;
  monthBalanceCents: number;
  daysLeft: number;
  monthProjectionCents: number;
}

/**
 * Computes the bot-relevant financial status for the current month.
 *
 * @param userId - Supabase user UUID
 * @param budgetRepository - Budget config repository
 * @param dailyExpenseRepository - Daily expense repository
 * @param extraExpenseCents - Hypothetical additional expense (for simulation only, not saved)
 * @param simulationDate - Reference date for the simulation; defaults to now
 */
export async function getBotFinancialStatus(
  userId: string,
  budgetRepository: IBudgetRepository,
  dailyExpenseRepository: IDailyExpenseRepository,
  extraExpenseCents = 0,
): Promise<BotFinancialStatus> {
  const referenceDate = new Date();
  const { year, month } = getTZDateParts(referenceDate);
  const currentDay = getTZDateParts(referenceDate).day;
  const daysInMonth = getDaysInMonth(month, year);
  const monthId = computeMonthId(year, month);

  const config = await budgetRepository.findByUserAndMonth(
    userId,
    String(monthId),
  );

  if (!config) {
    return {
      isConfigured: false,
      recommendedTodayCents: 0,
      recommendedForFuture: 0,
      todaySpentCents: 0,
      monthBalanceCents: 0,
      daysLeft: daysInMonth - currentDay,
      monthProjectionCents: 0,
    };
  }

  const { dailyBudgetCents } = calculateAllocationValues(
    config.totalIncome,
    config.fixedPercent,
    config.dailyPercent,
    config.reservePercent,
  );

  const remainingDailyBudgetCents = config.remainingDailyBudget;
  const startDay = remainingDailyBudgetCents > 0 ? config.startDay : 1;
  const adjustedDailyBudgetCents =
    remainingDailyBudgetCents > 0
      ? remainingDailyBudgetCents
      : dailyBudgetCents;

  const { startDate, endDate } = buildDateRange(month, year);
  const dailyExpenses = await dailyExpenseRepository.findByUserAndDateRange(
    userId,
    startDate,
    endDate,
  );

  const expenseRows: DailyExpenseRow[] = dailyExpenses.map((de) => ({
    id: de.id,
    user_id: de.userId,
    date: de.date,
    amount: de.amount,
    description: de.description || "",
    category: de.category || "Outros",
    time: de.time || null,
    month_id: monthId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  if (extraExpenseCents > 0) {
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(currentDay).padStart(2, "0");
    expenseRows.push({
      id: "simulated",
      user_id: userId,
      date: `${year}-${monthStr}-${dayStr}`,
      amount: extraExpenseCents,
      description: "simulated",
      category: "Outros",
      time: null,
      month_id: monthId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const dailyHistory = calculateDailyHistory(
    month,
    year,
    adjustedDailyBudgetCents,
    expenseRows,
    startDay,
    currentDay,
  );

  const metrics = calculateFinancialMetrics({
    dailyBudgetCents,
    adjustedDailyBudgetCents,
    remainingDailyBudgetCents,
    dailyHistory,
    daysInMonth,
    budgetStartDay: startDay,
    currentDay,
  });

  const todaySpentCents =
    dailyHistory.find((d) => d.day === currentDay)?.spent ?? 0;

  const remainingDaysExcludingToday = Math.max(0, daysInMonth - currentDay);
  const recommendedForFuture =
    remainingDaysExcludingToday > 0
      ? Math.max(
          0,
          Math.floor(
            metrics.remainingBalanceCents / remainingDaysExcludingToday,
          ),
        )
      : 0;

  return {
    isConfigured: true,
    recommendedTodayCents: metrics.recommendedDailyAverageCents,
    recommendedForFuture,
    todaySpentCents,
    monthBalanceCents: metrics.remainingBalanceCents,
    daysLeft: daysInMonth - currentDay,
    monthProjectionCents: metrics.projectedMonthEndBalanceCents,
  };
}
