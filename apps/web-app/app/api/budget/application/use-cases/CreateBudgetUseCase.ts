import { normalizeAllocation } from "@/libs/financeService";
import { BudgetConfigResponse, BudgetSaveResponse } from "@/types/budget";
import { CreditCard, FixedExpense, IncomeSource } from "@/types/finance";
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
  computeMonthId,
  getCurrentDate,
  getLastDayOfPreviousMonth,
  isCurrentMonthCheck,
  normalizeExpenseDueDays,
} from "../../helpers";
import {
  CreditCardSyncService,
  ExpenseSyncService,
  IncomeSyncService,
} from "../services";
import { GetBudgetUseCase } from "./GetBudgetUseCase";
import { SyncInvoicesUseCase } from "./SyncInvoicesUseCase";

export interface CreateBudgetRequest {
  userId: string;
  month: number;
  year: number;
  incomes: IncomeSource[];
  expenses: FixedExpense[];
  creditCards: CreditCard[];
  allocation: {
    fixedPercent: number;
    dailyPercent: number;
    reservePercent: number;
  };
  targetRemaining?: number;
  invoiceOpeningBalances?: { tempCreditCardId: string; amount: number }[];
}

export interface CreateBudgetOptions {
  responseMode?: "full" | "lean";
}

export interface CreateBudgetResult {
  created: boolean;
  response: BudgetConfigResponse | BudgetSaveResponse;
}

export class CreateBudgetUseCase {
  private creditCardSyncService: CreditCardSyncService;
  private incomeSyncService: IncomeSyncService;
  private expenseSyncService: ExpenseSyncService;
  private syncInvoicesUseCase: SyncInvoicesUseCase;
  private getBudgetUseCase: GetBudgetUseCase;

  constructor(
    private budgetRepository: IBudgetRepository,
    private incomeRepository: IIncomeRepository,
    private expenseRepository: IFixedExpenseRepository,
    private creditCardRepository: ICreditCardRepository,
    private dailyExpenseRepository: IDailyExpenseRepository,
    private installmentExpenseRepository: IInstallmentExpenseRepository,
    private creditCardInvoiceRepository: ICreditCardInvoiceRepository,
  ) {
    this.creditCardSyncService = new CreditCardSyncService(
      creditCardRepository,
    );
    this.incomeSyncService = new IncomeSyncService(incomeRepository);
    this.expenseSyncService = new ExpenseSyncService(
      expenseRepository,
      installmentExpenseRepository,
    );
    this.syncInvoicesUseCase = new SyncInvoicesUseCase(
      creditCardInvoiceRepository,
    );
    this.getBudgetUseCase = new GetBudgetUseCase(
      budgetRepository,
      incomeRepository,
      expenseRepository,
      creditCardRepository,
      dailyExpenseRepository,
      installmentExpenseRepository,
      creditCardInvoiceRepository,
    );
  }

  async execute(request: CreateBudgetRequest): Promise<BudgetConfigResponse>;
  async execute(
    request: CreateBudgetRequest,
    options: CreateBudgetOptions,
  ): Promise<CreateBudgetResult>;
  async execute(
    request: CreateBudgetRequest,
    options?: CreateBudgetOptions,
  ): Promise<BudgetConfigResponse | CreateBudgetResult> {
    const start = performance.now();
    const {
      userId,
      month,
      year,
      incomes,
      creditCards,
      allocation,
      targetRemaining,
    } = request;

    // Normalize expense dueDays to match card dueDays
    const expenses = normalizeExpenseDueDays(request.expenses, creditCards);

    const monthId = computeMonthId(year, month);
    const monthIdStr = String(monthId);

    // Calculate total income in cents
    const totalIncomeCents = incomes.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );

    // Normalize allocation percentages to sum to 100%
    const normalizedAllocation = normalizeAllocation(
      allocation.fixedPercent,
      allocation.dailyPercent,
      allocation.reservePercent,
    );

    // Check if config exists
    const checkExistingStart = performance.now();
    const existing = await this.budgetRepository.findByUserAndMonth(
      userId,
      monthIdStr,
    );
    const created = !existing;

    // Calculate remainingDailyBudget from targetRemaining (for mid-month setup)
    // If targetRemaining is provided, save it directly as the fixed remaining budget
    // This ensures allocation changes won't affect the daily ceiling after mid-month setup
    let remainingDailyBudgetCents = existing
      ? existing.remainingDailyBudget
      : 0;
    if (
      !existing &&
      targetRemaining !== undefined &&
      targetRemaining !== null
    ) {
      remainingDailyBudgetCents = targetRemaining;
    }

    // Calculate start_day
    const currentDay = getCurrentDate(month, year);
    const isCurrentMonth = isCurrentMonthCheck(month, year);
    const startDay = existing
      ? existing.startDay
      : isCurrentMonth && remainingDailyBudgetCents > 0
        ? currentDay
        : 1;

    // Sync all related entities BEFORE persisting budget
    const syncCardsStart = performance.now();
    const tempCardIdMap = await this.creditCardSyncService.execute(
      userId,
      creditCards,
    );

    // Sync opening balance daily expenses (new and existing budgets)
    // invoiceOpeningBalances === undefined means "don't touch"; [] means "clear all"
    if (request.invoiceOpeningBalances !== undefined) {
      const openingBalancesStart = performance.now();
      await this.dailyExpenseRepository.deleteOpeningBalancesByDueMonth(
        userId,
        monthId,
      );
      if (request.invoiceOpeningBalances.length > 0) {
        const prevMonthDate = getLastDayOfPreviousMonth(year, month);
        await this.dailyExpenseRepository.createOpeningBalances(
          request.invoiceOpeningBalances.map((balance) => {
            const realCardId =
              tempCardIdMap.get(balance.tempCreditCardId) ??
              balance.tempCreditCardId;

            return {
              userId,
              date: prevMonthDate,
              creditCardId: realCardId,
              invoiceDueMonthId: monthId,
              amount: balance.amount,
              description: "Saldo da fatura",
            };
          }),
        );
      }
    }

    // Remap temp creditCardIds to real UUIDs after credit card sync
    const resolvedExpenses = expenses.map((expense) => {
      if (expense.creditCardId && tempCardIdMap.has(expense.creditCardId)) {
        return {
          ...expense,
          creditCardId: tempCardIdMap.get(expense.creditCardId),
        };
      }
      return expense;
    });

    await Promise.all([
      (async () => {
        const syncIncomesStart = performance.now();
        await this.incomeSyncService.execute(userId, monthIdStr, incomes);
      })(),
      (async () => {
        const syncExpensesStart = performance.now();
        await this.expenseSyncService.execute(
          userId,
          monthIdStr,
          resolvedExpenses,
        );
      })(),
    ]);

    // Sync invoices for all active credit cards in this month
    const activeCardIds = creditCards
      .map((card) => tempCardIdMap.get(card.id ?? "") ?? card.id)
      .filter((id): id is string => Boolean(id));
    const syncInvoicesStart = performance.now();
    await this.syncInvoicesUseCase.execute(userId, activeCardIds, monthId);

    // NOW persist the budget after all operations succeeded
    const persistStart = performance.now();
    if (existing) {
      await this.budgetRepository.update(existing.id, userId, {
        totalIncome: totalIncomeCents,
        fixedPercent: normalizedAllocation.fixedPercent,
        dailyPercent: normalizedAllocation.dailyPercent,
        reservePercent: normalizedAllocation.reservePercent,
      });
    } else {
      await this.budgetRepository.create({
        userId,
        month,
        year,
        monthId: monthIdStr,
        totalIncome: totalIncomeCents,
        fixedPercent: normalizedAllocation.fixedPercent,
        dailyPercent: normalizedAllocation.dailyPercent,
        reservePercent: normalizedAllocation.reservePercent,
        remainingDailyBudget: remainingDailyBudgetCents,
        startDay,
      });
    }

    const responseMode = options?.responseMode ?? "full";
    if (responseMode === "lean") {
      const response: BudgetSaveResponse = {
        __type: "BudgetSaveResponse",
        created,
        month,
        year,
        isConfigured: true,
      };

      return {
        created,
        response,
      };
    }

    const buildResponseStart = performance.now();
    const response = await this.getBudgetUseCase.execute({
      userId,
      month,
      year,
    });

    if (options) {
      return {
        created,
        response,
      };
    }

    return response;
  }
}
