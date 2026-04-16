import { ExpenseType } from "@/types/finance";

export type EntryMode = "daily" | "fixed";

export type EntryStatus = "idle" | "submitting" | "success" | "error";

export interface DailyEntryState {
  amount: number;
  description: string;
  category: string;
  isRefund: boolean;
  date: string;
  cardId: string;
  invoiceMonthId: string;
}

export interface FixedEntryState {
  name: string;
  amount: number;
  dueDay: number;
  type: ExpenseType;
  paid: boolean;
  isInstallment: boolean;
  totalInstallments?: number;
  startInstallment?: number;
  isRefundable: boolean;
  paymentType: "debit" | "card";
  cardId: string;
  targetMonth: string;
}

export interface DailyEntryErrors {
  amount?: string;
  description?: string;
  date?: string;
  card?: string;
  general?: string;
}

export interface FixedEntryErrors {
  name?: string;
  amount?: string;
  card?: string;
  installments?: string;
  general?: string;
}

export type EntryErrors = DailyEntryErrors & FixedEntryErrors;

export interface ExpenseEntry {
  id: string;
  mode: EntryMode;
  status: EntryStatus;
  daily: DailyEntryState;
  fixed: FixedEntryState;
  errors: EntryErrors;
}
