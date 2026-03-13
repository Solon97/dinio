import { calculateInstallmentValues } from "@/libs/currency";
import { computeMonthId } from "@/libs/monthId";
import {
  BudgetCreditCardRow,
  BudgetExpenseRow,
  BudgetIncomeRow,
  DailyExpenseRow,
  ExpenseResponse,
  PartialMonthInfo,
  WizardInitialData,
} from "@/types/budget";
import {
  CreditCard,
  ExpenseType,
  FixedExpense,
  IncomeSource,
} from "@/types/finance";
import { DailyHistoryRecord } from "@/types/budget";
import {
  IBudgetRepository,
  ICreditCardRepository,
  IFixedExpenseRepository,
  IIncomeRepository,
} from "../domain/repositories/IBudgetRepository";

// Re-export utilities used by other modules
export { calculateInstallmentValues, computeMonthId };

/**
 * Convert ExpenseType to boolean isMandatory
 */
export const expenseTypeToIsMandatory = (type: ExpenseType): boolean => {
  return type === ExpenseType.MANDATORY;
};

/**
 * Normalizes dueDay for expenses linked to credit cards.
 * Card expenses must use the card's dueDay, not a custom one.
 */
export const normalizeExpenseDueDays = (
  expenses: FixedExpense[],
  creditCards: CreditCard[],
): FixedExpense[] => {
  return expenses.map((expense) => {
    if (!expense.creditCardId) {
      return expense;
    }

    const card = creditCards.find((c) => c.id === expense.creditCardId);
    if (!card) {
      // Card not found - keep expense as is (will fail validation later if needed)
      return expense;
    }

    // Override dueDay with card's dueDay
    return {
      ...expense,
      currentInstallment:
        expense.currentInstallment || expense.startInstallment,
      dueDay: card.dueDay,
    };
  });
};

/**
 * Timezone to use for all budget date calculations
 */
export const TIME_ZONE = "America/Sao_Paulo";

/**
 * Helper to get year/month/day in the configured timezone
 */
export const getTZDateParts = (date: Date) => {
  const year = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
    }).format(date),
  );
  const month =
    Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        month: "numeric",
      }).format(date),
    ) - 1;
  const day = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      day: "numeric",
    }).format(date),
  );

  return { year, month, day };
};

/**
 * Get the number of days in a given month
 */
export const getDaysInMonth = (month: number, year: number): number =>
  new Date(year, month + 1, 0).getDate();

/**
 * Calculate current day for a given month/year
 * Returns the current day if it's the current month,
 * the last day if it's a past month, or 0 if it's a future month
 * All comparisons are done in the configured timezone (America/Sao_Paulo)
 */
export const getCurrentDate = (month?: number, year?: number): number => {
  const {
    year: tzYear,
    month: tzMonth,
    day: tzDay,
  } = getTZDateParts(new Date());
  if (month === undefined || year === undefined) {
    return tzDay;
  }
  const isCurrentMonth = month === tzMonth && year === tzYear;
  const isPastMonth = year < tzYear || (year === tzYear && month < tzMonth);
  const daysInMonth = getDaysInMonth(month, year);

  if (isCurrentMonth) return tzDay;
  if (isPastMonth) return daysInMonth;
  return 0;
};

/**
 * Calculate daily history with dynamic limit based on actual expenses
 * @param month - Month (0-indexed)
 * @param year - Full year
 * @param adjustedDailyBudgetCents - Total daily budget in cents (already adjusted for initial spent)
 * @param expenses - Array of daily expenses from database
 * @param startDay - First day to calculate (1-based). Budget calculations start from this day.
 * @param currentDay - Current day of month (1-based). Used to distinguish past/present vs future expenses.
 */
export const calculateDailyHistory = (
  month: number,
  year: number,
  adjustedDailyBudgetCents: number,
  expenses: DailyExpenseRow[],
  startDay: number = 1,
  currentDay: number,
): DailyHistoryRecord[] => {
  const daysInMonth = getDaysInMonth(month, year);
  let categoriesSet = new Set<string>();
  // Group expenses by day (use Sao Paulo timezone to extract day)
  const expensesByDay: Map<number, DailyExpenseRow[]> = new Map();
  expenses.forEach((expense) => {
    // Extract day in configured timezone to prevent day-shift bugs
    const expenseDate = new Date(expense.date + "T12:00:00");
    const day = getTZDateParts(expenseDate).day;
    const dayExpenses = expensesByDay.get(day) || [];
    dayExpenses.push(expense);
    expensesByDay.set(day, dayExpenses);
    // Collect categories for breakdown
    if (expense.category) {
      categoriesSet.add(expense.category);
    }
  });

  // Calculate total future expenses (committed but not yet occurred)
  // These reduce available budget from day 1 but don't appear in "spent" until their date
  let futureExpensesCents = 0;
  expenses.forEach((expense) => {
    const expenseDate = new Date(expense.date + "T12:00:00");
    const day = getTZDateParts(expenseDate).day;
    if (day > currentDay) {
      futureExpensesCents += Number(expense.amount);
    }
  });

  const dailyHistory: DailyHistoryRecord[] = [];

  // Work in cents for precision
  // Subtract future expenses upfront - they commit budget even though not yet spent
  let remainingBudgetCents = adjustedDailyBudgetCents - futureExpensesCents;
  let cumulativeSpentCents = 0;

  const monthStr = String(month + 1).padStart(2, "0");

  // Start from the day the budget was configured (startDay)
  for (let day = startDay; day <= daysInMonth; day++) {
    const remainingDays = daysInMonth - day + 1;
    const limitCents =
      remainingDays > 0
        ? Math.max(0, Math.floor(remainingBudgetCents / remainingDays))
        : 0;

    // Calculate spent and breakdown for this day (in cents)
    const dayExpenses = expensesByDay.get(day) || [];

    // Only count expenses as "spent" if they're not in the future
    const spentCents =
      day <= currentDay
        ? dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
        : 0;

    const breakdown: Record<string, number> = {};
    categoriesSet.forEach((cat) => (breakdown[cat] = 0));
    dayExpenses.forEach((expense) => {
      const category = expense.category || "Outros";
      breakdown[category] = (breakdown[category] || 0) + Number(expense.amount);
    });

    remainingBudgetCents -= spentCents;
    cumulativeSpentCents += spentCents;

    // Map expense rows to API response format (include all, even future)
    const transactions: ExpenseResponse[] = dayExpenses.map((e) => ({
      __type: "ExpenseResponse" as const,
      id: e.id,
      date: e.date,
      amount: Number(e.amount),
      description: e.description,
      category: e.category,
      time: e.time || undefined,
      createdAt: e.created_at,
    }));

    const dayStr = String(day).padStart(2, "0");

    dailyHistory.push({
      day,
      date: `${year}-${monthStr}-${dayStr}`,
      limit: limitCents,
      spent: spentCents,
      cumulativeSpent: cumulativeSpentCents,
      breakdown,
      transactions,
    });
  }

  return dailyHistory;
};

/**
 * Transform database income rows to API response format
 */
export const transformIncomes = (rows: BudgetIncomeRow[]): IncomeSource[] =>
  rows.map((row) => ({
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
  }));

/**
 * Transform database expense rows to API response format
 */
export const transformExpenses = (rows: BudgetExpenseRow[]): FixedExpense[] =>
  rows.map((row) => ({
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    dueDay: row.due_day || 1,
    type: row.is_mandatory ? ExpenseType.MANDATORY : ExpenseType.DISCRETIONARY,
    paid: row.is_paid,
    creditCardId: row.credit_card_id || undefined,
    installmentExpenseId: row.installment_expense_id || undefined,
    isInstallment: row.is_installment || false,
    currentInstallment: row.current_installment || undefined,
    totalInstallments: row.total_installments || undefined,
    isRefundable: row.is_refundable ?? false,
    refundIncomeId: row.refund_income_id ?? null,
  }));

/**
 * Transform database credit card rows to API response format
 */
export const transformCreditCards = (
  rows: BudgetCreditCardRow[],
): CreditCard[] =>
  rows.map((row) => ({
    id: row.id,
    name: row.name,
    dueDay: row.due_day,
    closingDay: row.closing_day,
    limit: Number(row.credit_limit),
    color: row.color || "#6366f1",
  }));

/**
 * Build wizard initial data for unconfigured month
 * - If previous month is configured, copy incomes, expenses (without installments), and allocation
 * - Merge with any existing installments already created for this month
 * - Always use active credit cards from credit_cards table
 */
export async function buildWizardInitialData(
  budgetRepository: IBudgetRepository,
  incomeRepository: IIncomeRepository,
  expenseRepository: IFixedExpenseRepository,
  creditCardRepository: ICreditCardRepository,
  userId: string,
  monthId: number,
  prevMonthId: number,
  isPreviousMonthConfigured: boolean,
  prevConfig: {
    fixedPercent: number;
    dailyPercent: number;
    reservePercent: number;
  } | null,
  creditCards: CreditCard[],
): Promise<WizardInitialData> {
  let incomes: IncomeSource[] = [];
  let expenses: FixedExpense[] = [];
  let allocation = {
    fixedPercent: 0,
    dailyPercent: 0,
    reservePercent: 0,
  };

  if (isPreviousMonthConfigured && prevConfig) {
    // Fetch previous month incomes
    const prevIncomes = await incomeRepository.findByUserAndMonth(
      userId,
      String(prevMonthId),
    );

    // Fetch previous month expenses (non-installments)
    const prevExpenses = await expenseRepository.findByUserAndMonth(
      userId,
      String(prevMonthId),
    );

    // Fetch current month expenses (all types)
    const currentExpenses = await expenseRepository.findByUserAndMonth(
      userId,
      String(monthId),
    );

    // Transform incomes
    incomes = prevIncomes.map((row) => ({
      name: row.name!,
      amount: row.amount,
    }));

    // Transform previous month expenses (non-installments)
    const prevExpensesTransformed = prevExpenses
      .filter((row) => !row.installmentExpenseId)
      .map((row) => ({
        id: `temp-${row.id!}`,
        name: row.name!,
        amount: row.amount,
        dueDay: 1,
        type: ExpenseType.DISCRETIONARY,
        paid: false,
        creditCardId: row.creditCardId || undefined,
        isInstallment: row.isInstallment || false,
        currentInstallment: row.currentInstallment
          ? row.currentInstallment + 1
          : undefined,
        totalInstallments: row.totalInstallments || undefined,
        startInstallment: row.currentInstallment
          ? row.currentInstallment + 1
          : undefined,
      }));

    // Transform current month expenses (all types)
    const currentMonthExpensesTransformed = transformExpenses(
      currentExpenses.map((e) => ({
        id: e.id!,
        user_id: e.userId!,
        month_id: Number(e.monthId!),
        name: e.name!,
        amount: e.amount,
        credit_card_id: e.creditCardId || null,
        installment_expense_id: e.installmentExpenseId || null,
        total_installments: e.totalInstallments || null,
        current_installment: e.currentInstallment || null,
        is_mandatory: false,
        is_paid: false,
        is_installment: e.isInstallment || false,
        due_day: null as number | null,
        created_at: new Date().toISOString(),
      })),
    ).map((e) => ({ ...e, paid: false }));

    // Merge current month expenses with previous month expenses
    expenses = [...currentMonthExpensesTransformed, ...prevExpensesTransformed];

    // Copy allocation percentages from previous month
    allocation = {
      fixedPercent: prevConfig.fixedPercent,
      dailyPercent: prevConfig.dailyPercent,
      reservePercent: prevConfig.reservePercent,
    };
  } else {
    // No previous month configured, fetch all existing expenses for current month
    const existingExpenses = await expenseRepository.findByUserAndMonth(
      userId,
      String(monthId),
    );

    expenses = transformExpenses(
      existingExpenses.map((e) => ({
        id: e.id!,
        user_id: e.userId!,
        month_id: Number(e.monthId!),
        name: e.name!,
        amount: e.amount,
        credit_card_id: e.creditCardId || null,
        installment_expense_id: e.installmentExpenseId || null,
        total_installments: e.totalInstallments || null,
        current_installment: e.currentInstallment || null,
        is_mandatory: false,
        is_paid: false,
        is_installment: e.isInstallment || false,
        due_day: null as number | null,
        created_at: new Date().toISOString(),
      })),
    ).map((e) => ({
      ...e,
      paid: false,
    }));
  }

  return {
    incomes,
    expenses,
    creditCards,
    allocation,
  };
}

/**
 * Check if the given month/year is the current month
 */
export const isCurrentMonthCheck = (month: number, year: number): boolean => {
  const { year: tzYear, month: tzMonth } = getTZDateParts(new Date());
  return month === tzMonth && year === tzYear;
};

/**
 * Build date range for querying daily expenses
 */
export const buildDateRange = (
  month: number,
  year: number,
): { startDate: string; endDate: string } => {
  const daysInMonth = getDaysInMonth(month, year);
  const monthStr = String(month + 1).padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`;
  return { startDate, endDate };
};

/**
 * Build partial month info object
 */
export const buildPartialMonthInfo = (
  month: number,
  year: number,
): PartialMonthInfo => {
  const daysInMonth = getDaysInMonth(month, year);
  const currentDay = getCurrentDate(month, year);
  const remainingDays = daysInMonth - currentDay + 1;

  return {
    currentDay,
    remainingDays,
    daysInMonth,
  };
};

/**
 * Financial metrics calculation result
 */
export interface FinancialMetrics {
  initialAvailableCents: number;
  initialLimitCents: number;
  totalSpentCents: number;
  remainingBalanceCents: number;
  balanceProgress: number;
  /** Fixed ideal daily pace: adjustedDailyBudget / daysInMonth. Constant throughout the month. Used in the Dashboard card for a stable spending reference. */
  idealDailyAverageCents: number;
  /**
   * Dynamic recommended average for operational guidance (WhatsApp).
   * Formula: (remainingBalance + todaySpent) / remainingDaysIncludingToday
   */
  recommendedDailyAverageCents: number;
  currentDailyAverageCents: number;
  projectedMonthEndBalanceCents: number;
  projectedBudgetDurationDays: number;
}

/**
 * Calculate financial metrics from budget data
 *
 * Key concepts:
 * - initialAvailable: The FULL daily budget allocation from percentages (before any adjustments)
 *   → Always uses dailyBudgetCents regardless of mid-month setup
 * - initialLimit: The initial daily spending ceiling (considers mid-month adjustments)
 *   → Uses adjustedDailyBudgetCents / daysToConsider
 * - remainingBalance: What's left after all committed month expenses
 *   → Uses adjustedDailyBudgetCents - totalMonthCommittedExpenses
 * - balanceProgress: Progress bar percentage relative to FULL allocation
 *   → Uses dailyBudgetCents as denominator to show % of total allocation
 * - idealDailyAverage: Fixed monthly pace reference for the Dashboard card
 *   → Formula: adjustedDailyBudgetCents / daysInMonth
 *   → Remains constant throughout the month; gives users a stable spending rhythm
 *   → Distinct from recommendedDailyAverage (dynamic, used by WhatsApp assistant)
 * - recommendedDailyAverage: Dynamic operational guidance (WhatsApp assistant)
 *   → Formula: (remainingBalance + todaySpent) / remainingDaysIncludingToday
 *   → Changes daily as spending occurs; used for "how much can I spend today?" queries
 *
 * Example (mid-month with remainingDailyBudget = 60000, dailyBudget = 100000):
 * - initialAvailable = 100000 (full allocation)
 * - initialLimit = 60000 / 17 days = 3529
 * - After spending 20000: remainingBalance = 60000 - 20000 = 40000
 * - balanceProgress = 40000 / 100000 = 40% (shows used 60% of full allocation)
 * - idealDailyAverage = 60000 / 31 = 1935 (fixed pace, constant all month)
 * - recommendedDailyAverage = (40000 + todaySpent) / remainingDays (dynamic)
 */
export const calculateFinancialMetrics = ({
  dailyBudgetCents,
  adjustedDailyBudgetCents,
  remainingDailyBudgetCents,
  dailyHistory,
  daysInMonth,
  budgetStartDay,
  currentDay,
}: {
  dailyBudgetCents: number;
  adjustedDailyBudgetCents: number;
  remainingDailyBudgetCents: number;
  dailyHistory: DailyHistoryRecord[];
  daysInMonth: number;
  budgetStartDay: number;
  currentDay: number;
}): FinancialMetrics => {
  //? Determine days to consider for initial limit calculation
  const daysToConsider =
    remainingDailyBudgetCents > 0
      ? daysInMonth - budgetStartDay + 1
      : daysInMonth;

  //? initialAvailable = FULL daily budget allocation (percentage-based)
  //? This represents the total amount allocated, NOT what's actually available
  const initialAvailableCents = dailyBudgetCents;

  //? Calculate initial daily limit using the ADJUSTED budget
  //? For mid-month: uses remainingDailyBudget / days
  //? For full-month: uses dailyBudget / days
  const initialLimitCents =
    daysToConsider > 0
      ? Math.floor(adjustedDailyBudgetCents / daysToConsider)
      : 0;

  const totalSpentCents = dailyHistory.reduce((acc, d) => acc + d.spent, 0);

  // Includes committed month expenses from past, today and future transactions.
  // Fallback to `spent` keeps compatibility with records that don't include
  // expanded transaction lists.
  const totalMonthCommittedCents = dailyHistory.reduce((acc, dayRecord) => {
    const transactionTotal = dayRecord.transactions.reduce(
      (transactionAcc, transaction) => transactionAcc + transaction.amount,
      0,
    );

    return (
      acc +
      (dayRecord.transactions.length > 0 ? transactionTotal : dayRecord.spent)
    );
  }, 0);

  //? remainingBalance = adjusted budget minus all month committed expenses
  const remainingBalanceCents =
    adjustedDailyBudgetCents - totalMonthCommittedCents;

  //? Progress bar: percentage relative to FULL daily budget allocation
  //? Shows how much of the original allocation is still available
  //? For mid-month: can start negative (e.g., if 40% already "spent" before setup)
  const balanceProgress =
    dailyBudgetCents > 0 ? (remainingBalanceCents / dailyBudgetCents) * 100 : 0;

  // Use calendar days for pace analysis (day 1..today), clamped to valid month range.
  const effectiveCurrentDay = Math.max(1, Math.min(daysInMonth, currentDay));
  const remainingDaysIncludingToday = Math.max(
    1,
    daysInMonth - effectiveCurrentDay + 1,
  );
  const remainingDaysExcludingToday = Math.max(
    0,
    daysInMonth - effectiveCurrentDay,
  );

  const totalSpentToDateCents = dailyHistory
    .filter((dayRecord) => dayRecord.day <= effectiveCurrentDay)
    .reduce((acc, dayRecord) => acc + dayRecord.spent, 0);

  const todaySpentCents =
    dailyHistory.find((dayRecord) => dayRecord.day === effectiveCurrentDay)
      ?.spent ?? 0;

  //? idealDailyAverage = fixed monthly pace (Dashboard reference — stays constant all month)
  const idealDailyAverageCents =
    daysInMonth > 0 ? Math.floor(adjustedDailyBudgetCents / daysInMonth) : 0;

  //? recommendedDailyAverage = dynamic operational guidance (WhatsApp assistant)
  const recommendedDailyAverageCents = Math.max(
    0,
    Math.floor(
      (remainingBalanceCents + todaySpentCents) / remainingDaysIncludingToday,
    ),
  );
  const currentDailyAverageCents =
    effectiveCurrentDay > 0
      ? Math.floor(totalSpentToDateCents / effectiveCurrentDay)
      : 0;
  const projectedMonthEndBalanceCents =
    remainingBalanceCents -
    currentDailyAverageCents * remainingDaysExcludingToday;
  const projectedBudgetDurationDays =
    currentDailyAverageCents > 0
      ? Math.max(
          0,
          Math.floor(remainingBalanceCents / currentDailyAverageCents),
        )
      : remainingDaysIncludingToday;

  return {
    initialAvailableCents,
    initialLimitCents,
    totalSpentCents,
    remainingBalanceCents,
    balanceProgress,
    idealDailyAverageCents,
    recommendedDailyAverageCents,
    currentDailyAverageCents,
    projectedMonthEndBalanceCents,
    projectedBudgetDurationDays,
  };
};

/**
 * Build wizard initial data for a configured month
 */
export const buildConfiguredWizardData = (
  incomes: IncomeSource[],
  expenses: FixedExpense[],
  creditCards: CreditCard[],
  allocation: {
    fixedPercent: number;
    dailyPercent: number;
    reservePercent: number;
  },
  invoiceOpeningBalances?: Record<string, number>,
): WizardInitialData => ({
  incomes,
  expenses,
  creditCards,
  allocation,
  ...(invoiceOpeningBalances !== undefined && { invoiceOpeningBalances }),
});

/**
 * Returns the last day of the previous month as a YYYY-MM-DD string.
 * month is 0-indexed (0 = January).
 */
export function getLastDayOfPreviousMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0); // day=0 rolls back to last day of prev month
  const y = lastDay.getFullYear();
  const m = String(lastDay.getMonth() + 1).padStart(2, "0");
  const d = String(lastDay.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Validates if a string is a valid UUID format.
 */
export function isValidUUID(id: string | undefined): boolean {
  if (!id) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
