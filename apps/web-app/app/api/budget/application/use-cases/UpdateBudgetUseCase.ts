import { normalizeAllocation } from "@/libs/financeService";
import { BudgetConfigResponse } from "@/types/budget";
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
  getLastDayOfPreviousMonth,
  normalizeExpenseDueDays,
} from "../../helpers";
import {
  CreditCardSyncService,
  ExpenseSyncService,
  IncomeSyncService,
} from "../services";
import { GetBudgetUseCase } from "./GetBudgetUseCase";
import { SyncInvoicesUseCase } from "./SyncInvoicesUseCase";

export interface UpdateBudgetRequest {
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

export class UpdateBudgetUseCase {
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

  async execute(request: UpdateBudgetRequest): Promise<BudgetConfigResponse> {
    const { userId, month, year, incomes, creditCards, allocation } = request;

    // Normalize expense dueDays to match card dueDays
    const expenses = normalizeExpenseDueDays(request.expenses, creditCards);

    const monthId = computeMonthId(year, month);
    const monthIdStr = String(monthId);

    // Check if config exists
    const existingConfig = await this.budgetRepository.findByUserAndMonth(
      userId,
      monthIdStr,
    );

    if (!existingConfig) {
      throw new Error("Budget configuration not found");
    }

    // Process deletions
    await this.processDeletions(userId, monthIdStr, expenses);

    // Filter active expenses
    const activeExpenses = expenses.filter((e) => !e.markedForDeletion);

    // Calculate totals
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

    // Sync all related entities BEFORE updating budget
    const tempCardIdMap = await this.creditCardSyncService.execute(
      userId,
      creditCards,
    );

    // Sync opening balance daily expenses (undefined = don't touch; [] = clear all)
    if (request.invoiceOpeningBalances !== undefined) {
      await this.dailyExpenseRepository.deleteOpeningBalancesByDueMonth(
        userId,
        monthId,
      );
      if (request.invoiceOpeningBalances.length > 0) {
        const prevMonthDate = getLastDayOfPreviousMonth(year, month);
        for (const balance of request.invoiceOpeningBalances) {
          const realCardId =
            tempCardIdMap.get(balance.tempCreditCardId) ??
            balance.tempCreditCardId;
          await this.dailyExpenseRepository.createOpeningBalance({
            userId,
            date: prevMonthDate,
            creditCardId: realCardId,
            invoiceDueMonthId: monthId,
            amount: balance.amount,
            description: "Saldo da fatura",
          });
        }
      }
    }

    await this.incomeSyncService.execute(userId, monthIdStr, incomes);

    // Remap temp creditCardIds to real UUIDs after credit card sync
    const resolvedExpenses = activeExpenses.map((expense) => {
      if (expense.creditCardId && tempCardIdMap.has(expense.creditCardId)) {
        return {
          ...expense,
          creditCardId: tempCardIdMap.get(expense.creditCardId),
        };
      }
      return expense;
    });

    await this.expenseSyncService.execute(userId, monthIdStr, resolvedExpenses);

    // Sync invoices for all active credit cards in this month
    const activeCardIds = creditCards
      .map((card) => tempCardIdMap.get(card.id ?? "") ?? card.id)
      .filter((id): id is string => Boolean(id));
    await this.syncInvoicesUseCase.execute(userId, activeCardIds, monthId);

    // NOW update budget after all sync operations succeeded
    // initial_spent and start_day are preserved from existing config
    await this.budgetRepository.update(existingConfig.id, userId, {
      totalIncome: totalIncomeCents,
      fixedPercent: normalizedAllocation.fixedPercent,
      dailyPercent: normalizedAllocation.dailyPercent,
      reservePercent: normalizedAllocation.reservePercent,
    });

    return this.getBudgetUseCase.execute({
      userId,
      month,
      year,
    });
  }

  private async processDeletions(
    userId: string,
    monthId: string,
    expenses: FixedExpense[],
  ): Promise<void> {
    const expensesToDelete = expenses
      .filter((e) => e.id && !e.id.startsWith("temp-"))
      .filter((e) => e.markedForDeletion);

    for (const expense of expensesToDelete) {
      if (!expense.id) continue;
      await this.expenseRepository.softDelete([expense.id], userId);
      if (expense.deletionScope === "future" && expense.installmentExpenseId) {
        await this.expenseRepository.softDeleteFutureInstallments(
          expense.installmentExpenseId,
          monthId,
          userId,
        );
      }
    }
  }
}
