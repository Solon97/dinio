export interface BudgetConfig {
  id: string;
  userId: string;
  month: number;
  year: number;
  monthId: string;
  totalIncome: number;
  fixedPercent: number;
  dailyPercent: number;
  reservePercent: number;
  remainingDailyBudget: number;
  startDay: number;
}

export interface Income {
  id?: string;
  userId?: string;
  monthId?: string;
  name: string;
  amount: number;
}

export interface FixedExpense {
  id?: string;
  userId?: string;
  monthId?: string;
  name: string;
  amount: number;
  dueDay: number;
  isMandatory?: boolean;
  paid?: boolean;
  creditCardId?: string | null;
  invoiceDueMonthId?: number | null;
  isInstallment?: boolean;
  totalInstallments?: number;
  currentInstallment?: number;
  startInstallment?: number;
  installmentExpenseId?: string | null;
  markedForDeletion?: boolean;
  deletionScope?: "current" | "future";
  isRefundable?: boolean;
  refundIncomeId?: string | null;
}

export type DatabaseFixedExpense = FixedExpense;

export interface CreditCard {
  id?: string;
  userId?: string;
  name: string;
  dueDay: number;
  closingDay?: number;
  limit: number;
  color: string;
}

export interface InstallmentExpense {
  id?: string;
  userId?: string;
  name: string;
  creditCardId?: string;
  totalAmount: number;
  totalInstallments: number;
  startInstallment: number;
  startsAtMonthId: number;
  endsAtMonthId: number;
}

export interface DailyExpense {
  id: string;
  userId: string;
  date: string;
  amount: number;
  time: string;
  category: string;
  description: string;
}

export interface CreditCardInvoice {
  id?: string;
  userId: string;
  creditCardId: string;
  dueMonthId: number;
  isPaid: boolean;
}
