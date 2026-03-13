import { IncomeSource, FixedExpense, CreditCard, ExpenseType } from "./finance";
import { BrandedApiResponse } from "./monetary";

/**
 * Wizard initial data - pre-populated form data for budget setup
 * Backend calculates this based on configuration state
 */
export interface WizardInitialData {
  incomes: IncomeSource[];
  expenses: FixedExpense[];
  creditCards: CreditCard[];
  allocation: {
    fixedPercent: number;
    dailyPercent: number;
    reservePercent: number;
  };
  /** cardId → gross invoice total (centavos no backend, reais no frontend via interceptor) */
  invoiceOpeningBalances?: Record<string, number>;
}

/**
 * Partial month info for mid-month budget setup
 */
export interface PartialMonthInfo {
  currentDay: number;
  remainingDays: number;
  daysInMonth: number;
}

/**
 * Database row types (matching table columns)
 */
export interface BudgetConfigRow {
  id: string;
  user_id: string;
  month: number; // DEPRECATED: use month_id
  year: number; // DEPRECATED: use month_id
  month_id: number; // Canonical YYYYMM format
  total_income: number;
  fixed_percent: number;
  daily_percent: number;
  reserve_percent: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetIncomeRow {
  id: string;
  user_id: string;
  month_id: number; // Canonical YYYYMM format
  name: string;
  amount: number;
  created_at: string;
}

export interface BudgetExpenseRow {
  id: string;
  user_id: string;
  month_id: number; // Canonical YYYYMM format
  name: string;
  amount: number;
  due_day: number | null;
  is_mandatory: boolean;
  is_paid: boolean;
  credit_card_id: string | null;
  invoice_due_month_id?: number | null;
  installment_expense_id: string | null;
  is_installment: boolean;
  current_installment: number | null;
  total_installments: number | null;
  is_refundable?: boolean;
  refund_income_id?: string | null;
  created_at: string;
}

export interface CreditCardInvoiceRow {
  id: string;
  user_id: string;
  credit_card_id: string;
  due_month_id: number; // YYYYMM format
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithDetails {
  id: string;
  isPaid: boolean;
  dueMonthId: number;
  creditCard: {
    id: string;
    name: string;
    color: string;
    closingDay: number;
    dueDay: number;
  };
  totalAmount: number;
}

export interface InvoiceExpenseItem {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string | null; // daily_expenses only
  dueDay: number | null; // fixed_expenses only
  type: "daily" | "fixed";
}

export type PaymentItem =
  | { kind: "invoice"; data: InvoiceWithDetails }
  | { kind: "fixed"; data: FixedExpense }
  | { kind: "refund"; data: FixedExpense };

export interface CreditCardInvoicesResponse extends BrandedApiResponse<"CreditCardInvoicesResponse"> {
  invoices: InvoiceWithDetails[];
}

export interface CreditCardInvoiceExpensesResponse extends BrandedApiResponse<"CreditCardInvoiceExpensesResponse"> {
  creditCardId: string;
  dueMonthId: number;
  expenses: InvoiceExpenseItem[];
  totalAmount: number;
}

export interface BudgetCreditCardRow {
  id: string;
  user_id: string;
  name: string;
  closing_day: number;
  due_day: number;
  credit_limit: number;
  color: string;
  deleted_at: string | null;
  created_at: string;
}

export interface InstallmentExpenseRow {
  id: string;
  user_id: string;
  name: string;
  credit_card_id: string | null;
  total_amount: number;
  total_installments: number;
  start_installment: number;
  starts_at_month_id: number;
  ends_at_month_id: number;
  created_at: string;
}

/**
 * Budget configuration with related data (joined query result)
 */
export interface BudgetConfigDB extends BudgetConfigRow {
  incomes: BudgetIncomeRow[];
  expenses: BudgetExpenseRow[];
  credit_cards: BudgetCreditCardRow[];
}

/**
 * Budget summary returned by API
 */
export interface BudgetSummary extends BrandedApiResponse<"BudgetSummary"> {
  month: number;
  year: number;

  totalIncome: number;

  fixed: {
    amount: number;
    percent: number;
  };

  daily: {
    amount: number;
    percent: number;
  };

  reserve: {
    amount: number;
    percent: number;
  };

  isConfigured: boolean;
}

/**
 * Payload for creating/updating budget config
 */
export interface BudgetConfigPayload {
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
  /** First-month onboarding: previously accumulated invoice balances per card */
  invoiceOpeningBalances?: { tempCreditCardId: string; amount: number }[];
}

/**
 * Full budget config returned by API
 */
export interface BudgetConfigResponse extends BrandedApiResponse<"BudgetConfigResponse"> {
  id: string;
  month: number;
  year: number;

  totalIncome: number;
  incomes: IncomeSource[];

  totalFixed: number;
  fixedPercent: number;
  expenses: FixedExpense[];

  dailyBudget: number;
  dailyPercent: number;

  reserveAmount: number;
  reservePercent: number;

  creditCards: CreditCard[];

  dailyHistory: DailyHistoryRecord[];
  currentDay: number;

  remainingDailyBudget?: number;

  isConfigured: boolean;
  isPreviousMonthConfigured: boolean;

  /** Pre-populated data for the budget wizard */
  wizardInitialData: WizardInitialData;

  /** Whether this is a mid-month setup (current month, day > 10, not configured) */
  isPartialMonth: boolean;

  /** Partial month info for mid-month setup calculations */
  partialMonthInfo: PartialMonthInfo;

  /** Calculated fields for frontend */
  initialAvailable: number;
  initialLimit: number;
  totalSpent: number;
  remainingBalance: number;
  balanceProgress: number;
  /** Fixed ideal daily pace for the Dashboard card: adjustedDailyBudget / daysInMonth. Constant throughout the month. */
  idealDailyAverage?: number;
  recommendedDailyAverage?: number;
  currentDailyAverage?: number;
  projectedMonthEndBalance?: number;
  projectedBudgetDurationDays?: number;

  /** Payments for the month: invoices + non-card fixed expenses */
  payments: PaymentItem[];
}

/**
 * Lightweight response for budget creation (POST /api/budget)
 * The full dashboard payload is fetched via GET right after save.
 */
export interface BudgetSaveResponse extends BrandedApiResponse<"BudgetSaveResponse"> {
  created: boolean;
  month: number;
  year: number;
  isConfigured: true;
}

/**
 * Monthly record for yearly summary
 */
export interface YearlyMonthRecord {
  month: number;
  monthName: string;
  income: number;
  fixedMandatory: number;
  fixedDiscretionary: number;
  dailySpent: number;
  plannedSavings: number;
  realSavings: number;
  isConfigured: boolean;
}

/**
 * Yearly summary returned by API
 */
export interface YearlySummaryResponse extends BrandedApiResponse<"YearlySummaryResponse"> {
  year: number;
  months: YearlyMonthRecord[];
  totals: {
    income: number;
    fixedMandatory: number;
    fixedDiscretionary: number;
    dailySpent: number;
    plannedSavings: number;
    realSavings: number;
  };
  configuredMonths: number;
  hasData: boolean;
  hasPreviousYearData: boolean;
}

/**
 * Daily expense database row type
 */
export interface DailyExpenseRow {
  id: string;
  user_id: string;
  month_id: number; // Canonical YYYYMM format
  date: string;
  amount: number;
  description: string;
  category: string;
  time: string | null;
  credit_card_id?: string | null;
  invoice_due_month_id?: number | null;
  created_at: string;
  updated_at: string;
  // Supabase join — present when selected with credit_cards(id, name, color)
  credit_cards?: { id: string; name: string; color: string } | null;
}

/**
 * Payload for creating a new expense
 */
export interface CreateExpensePayload {
  date: string;
  amount: number;
  description: string;
  category: string;
  time?: string;
  creditCardId?: string | null;
  invoiceDueMonthId?: number | null;
}

/**
 * Payload for updating an existing expense
 */
export interface UpdateExpensePayload {
  date?: string;
  amount?: number;
  description?: string;
  category?: string;
  time?: string | null;
  creditCardId?: string | null;
  invoiceDueMonthId?: number | null;
}

/**
 * Expense response from API
 */
export interface ExpenseResponse extends BrandedApiResponse<"ExpenseResponse"> {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  time?: string;
  createdAt: string;
  creditCard?: { id: string; name: string; color: string } | null;
  invoiceDueMonthId?: number | null;
}

/**
 * Daily record with limit calculation (returned by budget API)
 */
export interface DailyHistoryRecord {
  day: number;
  date: string;
  limit: number;
  spent: number;
  cumulativeSpent: number;
  breakdown: Record<string, number>;
  transactions: ExpenseResponse[];
}

/**
 * Paginated response for expense list with cursor-based pagination
 */
export interface PaginatedExpensesResponse extends BrandedApiResponse<"ExpenseListResponse"> {
  expenses: ExpenseResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Payload for creating a fixed expense from the CaptureMenu
 */
export interface CreateFixedExpensePayload {
  name: string;
  amount: number;
  dueDay?: number;
  type: ExpenseType;
  creditCardId?: string;
  invoiceDueMonthId?: number;
  isInstallment?: boolean;
  totalInstallments?: number;
  startInstallment?: number;
  targetMonthId: number;
  isRefundable?: boolean;
}
