import {
  BudgetConfig,
  CreditCard,
  CreditCardInvoice,
  DailyExpense,
  FixedExpense,
  Income,
  InstallmentExpense,
} from "../entities/BudgetConfig";
import { InvoiceExpenseItem, InvoiceWithDetails } from "@/types/budget";

export interface IBudgetRepository {
  findByUserAndMonth(
    userId: string,
    monthId: string,
  ): Promise<BudgetConfig | null>;
  create(config: Omit<BudgetConfig, "id">): Promise<BudgetConfig>;
  update(
    id: string,
    userId: string,
    config: Partial<BudgetConfig>,
  ): Promise<void>;
}

export interface IIncomeRepository {
  findByUserAndMonth(userId: string, monthId: string): Promise<Income[]>;
  deleteByUserAndMonth(userId: string, monthId: string): Promise<void>;
  bulkCreate(incomes: Income[]): Promise<void>;
  bulkUpdate(
    userId: string,
    monthId: string,
    incomes: { id: string; name: string; amount: number }[],
  ): Promise<void>;
  create(income: Omit<Income, "id">): Promise<Income>;
  update(id: string, userId: string, income: Partial<Income>): Promise<void>;
  delete(ids: string[], userId: string): Promise<void>;
}

export interface IFixedExpenseRepository {
  findByUserAndMonth(userId: string, monthId: string): Promise<FixedExpense[]>;
  findById(id: string, userId: string): Promise<FixedExpense | null>;
  deleteByUserAndMonth(userId: string, monthId: string): Promise<void>;
  bulkCreate(expenses: FixedExpense[]): Promise<void>;
  bulkUpdate(
    userId: string,
    monthId: string,
    expenses: {
      id: string;
      name: string;
      amount: number;
      dueDay: number;
      isMandatory: boolean;
      creditCardId?: string;
      isRefundable: boolean;
    }[],
  ): Promise<void>;
  update(
    id: string,
    userId: string,
    expense: Partial<FixedExpense>,
  ): Promise<void>;
  setRefundIncomeId(
    id: string,
    userId: string,
    incomeId: string,
  ): Promise<void>;
  softDelete(ids: string[], userId: string): Promise<void>;
  softDeleteFutureInstallments(
    installmentExpenseId: string,
    currentMonthId: string,
    userId: string,
  ): Promise<void>;
}

export interface IInstallmentExpenseRepository {
  findById(id: string, userId: string): Promise<InstallmentExpense | null>;
  findByUserId(userId: string): Promise<InstallmentExpense[]>;
  create(
    installmentExpense: Omit<InstallmentExpense, "id">,
  ): Promise<InstallmentExpense>;
  update(
    id: string,
    userId: string,
    data: Partial<InstallmentExpense>,
  ): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
}

export interface ICreditCardRepository {
  findActiveByUser(userId: string): Promise<CreditCard[]>;
  findById(id: string, userId: string): Promise<CreditCard | null>;
  create(card: Omit<CreditCard, "id">): Promise<CreditCard>;
  bulkUpdate(
    userId: string,
    cards: {
      id: string;
      name: string;
      dueDay: number;
      closingDay?: number;
      limit: number;
      color: string;
    }[],
  ): Promise<void>;
  update(id: string, userId: string, card: Partial<CreditCard>): Promise<void>;
  softDelete(ids: string[], userId: string): Promise<void>;
  hardDelete(ids: string[], userId: string): Promise<void>;
  checkHasExpenses(cardIds: string[]): Promise<Set<string>>;
}

export interface IDailyExpenseRepository {
  findByUserAndDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<DailyExpense[]>;
  createOpeningBalance(params: {
    userId: string;
    date: string;
    creditCardId: string;
    invoiceDueMonthId: number;
    amount: number;
    description: string;
  }): Promise<void>;
  createOpeningBalances(
    paramsList: {
      userId: string;
      date: string;
      creditCardId: string;
      invoiceDueMonthId: number;
      amount: number;
      description: string;
    }[],
  ): Promise<void>;
  findOpeningBalancesByDueMonth(
    userId: string,
    invoiceDueMonthId: number,
  ): Promise<{ creditCardId: string; amount: number }[]>;
  deleteOpeningBalancesByDueMonth(
    userId: string,
    invoiceDueMonthId: number,
  ): Promise<void>;
}

export interface ICreditCardInvoiceRepository {
  upsertForMonth(
    userId: string,
    creditCardIds: string[],
    dueMonthId: number,
  ): Promise<void>;
  findByUserAndMonth(
    userId: string,
    dueMonthId: number,
  ): Promise<InvoiceWithDetails[]>;
  findExpensesByCardAndMonth(
    userId: string,
    creditCardId: string,
    dueMonthId: number,
  ): Promise<InvoiceExpenseItem[]>;
  markAsPaid(
    id: string,
    userId: string,
    isPaid: boolean,
  ): Promise<CreditCardInvoice>;
}
