import { computeMonthIdFromString } from "@/libs/monthId";
import { SupabaseClient } from "@supabase/supabase-js";
import { DailyExpense } from "../../../domain/entities/BudgetConfig";
import { IDailyExpenseRepository } from "../../../domain/repositories/IBudgetRepository";

export class SupabaseDailyExpenseRepository implements IDailyExpenseRepository {
  constructor(private supabase: SupabaseClient) {}

  async createOpeningBalances(
    paramsList: {
      userId: string;
      date: string;
      creditCardId: string;
      invoiceDueMonthId: number;
      amount: number;
      description: string;
    }[],
  ): Promise<void> {
    if (paramsList.length === 0) return;

    const rows = paramsList.map((params) => ({
      user_id: params.userId,
      date: params.date,
      month_id: computeMonthIdFromString(params.date),
      amount: params.amount,
      description: params.description,
      category: "Outros",
      credit_card_id: params.creditCardId,
      invoice_due_month_id: params.invoiceDueMonthId,
    }));

    const { error } = await this.supabase.from("daily_expenses").insert(rows);

    if (error) {
      throw new Error(`Failed to create opening balances: ${error.message}`);
    }
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<DailyExpense[]> {
    const { data, error } = await this.supabase
      .from("daily_expenses")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch daily expenses: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      amount: Number(row.amount),
      description: row.description,
      category: row.category,
      time: row.time,
    }));
  }

  async createOpeningBalance(params: {
    userId: string;
    date: string;
    creditCardId: string;
    invoiceDueMonthId: number;
    amount: number;
    description: string;
  }): Promise<void> {
    const monthId = computeMonthIdFromString(params.date);

    const { error } = await this.supabase.from("daily_expenses").insert({
      user_id: params.userId,
      date: params.date,
      month_id: monthId,
      amount: params.amount,
      description: params.description,
      category: "Outros",
      credit_card_id: params.creditCardId,
      invoice_due_month_id: params.invoiceDueMonthId,
    });

    if (error) {
      throw new Error(`Failed to create opening balance: ${error.message}`);
    }
  }

  async findOpeningBalancesByDueMonth(
    userId: string,
    invoiceDueMonthId: number,
  ): Promise<{ creditCardId: string; amount: number }[]> {
    const { data, error } = await this.supabase
      .from("daily_expenses")
      .select("credit_card_id, amount")
      .eq("user_id", userId)
      .eq("invoice_due_month_id", invoiceDueMonthId)
      .eq("description", "Saldo da fatura")
      .not("credit_card_id", "is", null);

    if (error) {
      throw new Error(`Failed to fetch opening balances: ${error.message}`);
    }

    return (data || []).map((row) => ({
      creditCardId: row.credit_card_id as string,
      amount: Number(row.amount),
    }));
  }

  async deleteOpeningBalancesByDueMonth(
    userId: string,
    invoiceDueMonthId: number,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("daily_expenses")
      .delete()
      .eq("user_id", userId)
      .eq("invoice_due_month_id", invoiceDueMonthId)
      .eq("description", "Saldo da fatura")
      .not("credit_card_id", "is", null);

    if (error) {
      throw new Error(`Failed to delete opening balances: ${error.message}`);
    }
  }
}
