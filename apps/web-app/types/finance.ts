export enum FinancialStatus {
  HEALTHY = "Saudável",
  WARNING = "Atenção",
  CRITICAL = "Crítico",
}

export enum ExpenseType {
  MANDATORY = "Obrigatório",
  DISCRETIONARY = "Dispensável",
}

export interface IncomeSource {
  id?: string;
  name: string;
  amount: number;
}

export interface CreditCard {
  id?: string;
  name: string;
  dueDay: number;
  closingDay?: number;
  limit: number;
  color: string;
}

export interface FixedExpense {
  id?: string;
  name: string;
  amount: number;
  dueDay: number;
  type: ExpenseType;
  paid: boolean;
  creditCardId?: string;
  invoiceDueMonthId?: number;
  installmentExpenseId?: string;
  isInstallment?: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
  startInstallment?: number;
  markedForDeletion?: boolean;
  deletionScope?: "current" | "future";
  isRefundable?: boolean;
  refundIncomeId?: string | null;
}

export interface DailyRecord {
  day: number;
  limit: number;
  spent: number;
  cumulativeSpent: number;
  breakdown: {
    [category: string]: number;
  };
  transactions?: Transaction[];
}

export interface CategoryRecord {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  time: string;
}

export interface MonthSummary {
  month: number;
  year: number;
  income: number;
  totalFixed: number;
  reserveGoal: number;
  currentDay: number;
  daysInMonth: number;
  expenses: FixedExpense[];
  dailyHistory: DailyRecord[];
  categories: CategoryRecord[];
  creditCards: CreditCard[];
}

export interface MonthYearlyRecord {
  monthName: string;
  income: number;
  fixedMandatory: number;
  fixedDiscretionary: number;
  dailySpent: number;
  plannedSavings: number;
  realSavings: number;
}

export interface BudgetConfig {
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

export interface InstallmentExpense {
  id: string;
  userId: string;
  name: string;
  creditCardId?: string;
  totalAmount: number;
  totalInstallments: number;
  startInstallment: number;
  startsAtMonthId: number;
  endsAtMonthId: number;
  createdAt: string;
}
