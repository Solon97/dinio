import { BudgetConfigResponse, PaymentItem } from "@/types/budget";
import { ExpenseType } from "@/types/finance";
import { calculateAllocationValues } from "@/libs/financeService";
import {
  IBudgetRepository,
  ICreditCardInvoiceRepository,
  ICreditCardRepository,
  IDailyExpenseRepository,
  IFixedExpenseRepository,
  IIncomeRepository,
  IInstallmentExpenseRepository,
} from "../../domain/repositories/IBudgetRepository";
import {
  buildConfiguredWizardData,
  buildDateRange,
  buildPartialMonthInfo,
  buildWizardInitialData,
  calculateDailyHistory,
  calculateFinancialMetrics,
  computeMonthId,
  getCurrentDate,
  getDaysInMonth,
  isCurrentMonthCheck,
} from "../../helpers";

export interface GetBudgetRequest {
  userId: string;
  month: number;
  year: number;
}

export class GetBudgetUseCase {
  constructor(
    private budgetRepository: IBudgetRepository,
    private incomeRepository: IIncomeRepository,
    private expenseRepository: IFixedExpenseRepository,
    private creditCardRepository: ICreditCardRepository,
    private dailyExpenseRepository: IDailyExpenseRepository,
    private installmentExpenseRepository: IInstallmentExpenseRepository,
    private creditCardInvoiceRepository: ICreditCardInvoiceRepository,
  ) {}

  async execute(request: GetBudgetRequest): Promise<BudgetConfigResponse> {
    const { userId, month, year } = request;

    const monthId = computeMonthId(year, month);
    const monthIdStr = String(monthId);
    const daysInMonth = getDaysInMonth(month, year);
    const currentDay = getCurrentDate(month, year);
    const isCurrentMonth = isCurrentMonthCheck(month, year);
    const partialMonthInfo = buildPartialMonthInfo(month, year);

    // Fetch main config
    const config = await this.budgetRepository.findByUserAndMonth(
      userId,
      monthIdStr,
    );

    const isConfigured = !!config;

    // Check if previous month is configured
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthId = computeMonthId(prevYear, prevMonth);
    const prevMonthIdStr = String(prevMonthId);

    const [prevConfig, creditCardsData] = await Promise.all([
      this.budgetRepository.findByUserAndMonth(userId, prevMonthIdStr),
      this.creditCardRepository.findActiveByUser(userId),
    ]);
    const isPreviousMonthConfigured = !!prevConfig;

    // Fetch credit cards (global per user)
    const creditCards = creditCardsData.map((card) => ({
      id: card.id,
      name: card.name,
      dueDay: card.dueDay,
      ...(card.closingDay !== undefined ? { closingDay: card.closingDay } : {}),
      limit: card.limit,
      color: card.color,
    }));

    if (!isConfigured) {
      // Build wizard initial data for unconfigured month
      const wizardInitialData = await buildWizardInitialData(
        this.budgetRepository,
        this.incomeRepository,
        this.expenseRepository,
        this.creditCardRepository,
        userId,
        monthId,
        prevMonthId,
        isPreviousMonthConfigured,
        prevConfig,
        creditCards,
      );

      const isPartialMonth = isCurrentMonth && currentDay > 1 && !isConfigured;

      const response: BudgetConfigResponse = {
        __type: "BudgetConfigResponse",
        id: "",
        month,
        year,
        totalIncome: 0,
        incomes: [],
        totalFixed: 0,
        fixedPercent: 0,
        expenses: [],
        dailyBudget: 0,
        dailyPercent: 0,
        reserveAmount: 0,
        reservePercent: 0,
        creditCards,
        dailyHistory: [],
        currentDay,
        isConfigured: false,
        isPreviousMonthConfigured,
        wizardInitialData,
        isPartialMonth,
        partialMonthInfo,
        initialAvailable: 0,
        initialLimit: 0,
        totalSpent: 0,
        remainingBalance: 0,
        balanceProgress: 0,
        payments: [],
      };
      return response;
    }

    const { startDate, endDate } = buildDateRange(month, year);

    // Fetch related data for configured month
    const [incomes, expenses, dailyExpenses, openingBalances, invoices] =
      await Promise.all([
        this.incomeRepository.findByUserAndMonth(userId, monthIdStr),
        this.expenseRepository.findByUserAndMonth(userId, monthIdStr),
        this.dailyExpenseRepository.findByUserAndDateRange(
          userId,
          startDate,
          endDate,
        ),
        this.dailyExpenseRepository.findOpeningBalancesByDueMonth(
          userId,
          monthId,
        ),
        this.creditCardInvoiceRepository.findByUserAndMonth(userId, monthId),
      ]);

    const transformedIncomes = incomes.map((income) => ({
      id: income.id,
      name: income.name!,
      amount: income.amount,
    }));

    const transformedExpenses = expenses.map((expense) => ({
      id: expense.id,
      name: expense.name!,
      amount: expense.amount,
      dueDay: expense.dueDay,
      type: expense.isMandatory
        ? ExpenseType.MANDATORY
        : ExpenseType.DISCRETIONARY,
      paid: expense.paid ?? false,
      creditCardId: expense.creditCardId || undefined,
      isInstallment: expense.isInstallment || false,
      totalInstallments: expense.totalInstallments || undefined,
      currentInstallment: expense.currentInstallment || undefined,
      installmentExpenseId: expense.installmentExpenseId || undefined,
      isRefundable: expense.isRefundable ?? false,
      refundIncomeId: expense.refundIncomeId ?? null,
    }));

    // Calculate financial metrics
    const totalIncomeCents = config.totalIncome;

    // Calculate allocation values dynamically from percentages
    const { totalFixedCents, dailyBudgetCents, reserveAmountCents } =
      calculateAllocationValues(
        totalIncomeCents,
        config.fixedPercent,
        config.dailyPercent,
        config.reservePercent,
      );

    const remainingDailyBudgetCents = config.remainingDailyBudget;
    const startDay = remainingDailyBudgetCents > 0 ? config.startDay : 1;
    // Calculate adjusted daily budget:
    // - If remainingDailyBudget is set (mid-month), use it directly
    // - Otherwise, use the percentage-based dailyBudget (full-month)
    const adjustedDailyBudgetCents =
      remainingDailyBudgetCents > 0
        ? remainingDailyBudgetCents
        : dailyBudgetCents;

    // Calculate daily history
    const dailyHistory = calculateDailyHistory(
      month,
      year,
      adjustedDailyBudgetCents,
      dailyExpenses.map((de) => ({
        id: de.id,
        user_id: de.userId,
        date: de.date,
        amount: de.amount,
        description: de.description || "",
        category: de.category,
        created_at: new Date().toISOString(),
        month_id: monthId,
        time: de.time,
        updated_at: new Date().toISOString(),
      })),
      startDay,
      currentDay,
    );

    // Reconstruct gross invoice total per card: net stored + fixed expenses for that card
    let invoiceOpeningBalances: Record<string, number> | undefined;
    if (openingBalances.length > 0) {
      invoiceOpeningBalances = {};
      for (const ob of openingBalances) {
        const fixedSum = transformedExpenses
          .filter((e) => e.creditCardId === ob.creditCardId)
          .reduce((acc, e) => acc + e.amount, 0);
        invoiceOpeningBalances[ob.creditCardId] = ob.amount + fixedSum;
      }
    }

    // Build wizard initial data for configured month
    const wizardInitialData = buildConfiguredWizardData(
      transformedIncomes,
      transformedExpenses,
      creditCards,
      {
        fixedPercent: config.fixedPercent,
        dailyPercent: config.dailyPercent,
        reservePercent: config.reservePercent,
      },
      invoiceOpeningBalances,
    );

    const payments: PaymentItem[] = [
      ...invoices.map((inv) => ({ kind: "invoice" as const, data: inv })),
      ...transformedExpenses
        .filter((e) => !e.creditCardId)
        .map((e) => ({ kind: "fixed" as const, data: e })),
      // Receivable: refundable expenses that have been paid but not yet reimbursed
      ...transformedExpenses
        .filter((e) => e.isRefundable)
        .map((e) => ({ kind: "refund" as const, data: e })),
    ];

    const metrics = calculateFinancialMetrics({
      dailyBudgetCents,
      adjustedDailyBudgetCents,
      remainingDailyBudgetCents,
      dailyHistory,
      daysInMonth,
      budgetStartDay: startDay,
      currentDay,
    });

    const response: BudgetConfigResponse = {
      __type: "BudgetConfigResponse",
      id: config.id,
      month: config.month,
      year: config.year,
      totalIncome: totalIncomeCents,
      incomes: transformedIncomes,
      totalFixed: totalFixedCents,
      fixedPercent: config.fixedPercent,
      expenses: transformedExpenses,
      dailyBudget: dailyBudgetCents,
      dailyPercent: config.dailyPercent,
      reserveAmount: reserveAmountCents,
      reservePercent: config.reservePercent,
      creditCards,
      dailyHistory,
      currentDay,
      remainingDailyBudget: remainingDailyBudgetCents,
      isConfigured: true,
      isPreviousMonthConfigured,
      wizardInitialData,
      isPartialMonth: false,
      partialMonthInfo,
      initialAvailable: metrics.initialAvailableCents,
      initialLimit: metrics.initialLimitCents,
      totalSpent: metrics.totalSpentCents,
      remainingBalance: metrics.remainingBalanceCents,
      balanceProgress: metrics.balanceProgress,
      idealDailyAverage: metrics.idealDailyAverageCents,
      recommendedDailyAverage: metrics.recommendedDailyAverageCents,
      currentDailyAverage: metrics.currentDailyAverageCents,
      projectedMonthEndBalance: metrics.projectedMonthEndBalanceCents,
      projectedBudgetDurationDays: metrics.projectedBudgetDurationDays,
      payments,
    };

    return response;
  }
}
