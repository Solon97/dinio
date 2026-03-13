import { SupabaseClient } from "@supabase/supabase-js";
import {
  DatabaseFixedExpense,
  FixedExpense,
} from "../../../domain/entities/BudgetConfig";
import { IFixedExpenseRepository } from "../../../domain/repositories/IBudgetRepository";

export class SupabaseFixedExpenseRepository implements IFixedExpenseRepository {
  constructor(private supabase: SupabaseClient) {}

  async bulkUpdate(
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
  ): Promise<void> {
    if (expenses.length === 0) return;

    const rows = expenses.map((expense) => ({
      id: expense.id,
      user_id: userId,
      month_id: monthId,
      name: expense.name,
      amount: expense.amount,
      due_day: expense.dueDay,
      is_mandatory: expense.isMandatory,
      credit_card_id: expense.creditCardId,
      is_refundable: expense.isRefundable,
    }));

    const { error } = await this.supabase
      .from("fixed_expenses")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      throw new Error(`Failed to bulk update expenses: ${error.message}`);
    }
  }

  async findByUserAndMonth(
    userId: string,
    monthId: string,
  ): Promise<FixedExpense[]> {
    const { data, error } = await this.supabase
      .from("fixed_expenses")
      .select("*")
      .eq("user_id", userId)
      .eq("month_id", monthId)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`Failed to fetch expenses: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      monthId: row.month_id,
      name: row.name,
      amount: Number(row.amount),
      dueDay: row.due_day,
      isMandatory: row.is_mandatory,
      paid: row.is_paid ?? false,
      creditCardId: row.credit_card_id,
      isInstallment: row.installment_expense_id !== null,
      totalInstallments: row.total_installments,
      currentInstallment: row.current_installment,
      installmentExpenseId: row.installment_expense_id,
      isRefundable: row.is_refundable ?? false,
      refundIncomeId: row.refund_income_id ?? null,
    }));
  }

  async deleteByUserAndMonth(userId: string, monthId: string): Promise<void> {
    const { error } = await this.supabase
      .from("fixed_expenses")
      .delete()
      .eq("user_id", userId)
      .eq("month_id", monthId);

    if (error) {
      throw new Error(`Failed to delete expenses: ${error.message}`);
    }
  }

  async bulkCreate(expenses: FixedExpense[]): Promise<void> {
    const rows = expenses.map((expense) => ({
      user_id: expense.userId,
      month_id: expense.monthId,
      name: expense.name,
      amount: expense.amount,
      due_day: expense.dueDay,
      is_mandatory: expense.isMandatory ?? true,
      credit_card_id: expense.creditCardId,
      invoice_due_month_id: expense.invoiceDueMonthId ?? null,
      installment_expense_id: expense.installmentExpenseId,
      is_installment: expense.isInstallment || false,
      total_installments: expense.totalInstallments,
      current_installment: expense.currentInstallment,
      is_refundable: expense.isRefundable ?? false,
    }));

    const { error } = await this.supabase.from("fixed_expenses").insert(rows);

    if (error) {
      console.error("Supabase insert error details:", { error, rows });
      throw new Error(`Failed to create expenses`);
    }
  }

  async update(
    id: string,
    userId: string,
    expense: Partial<FixedExpense>,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (expense.name !== undefined) updateData.name = expense.name;
    if (expense.amount !== undefined) updateData.amount = expense.amount;
    if (expense.dueDay !== undefined) updateData.due_day = expense.dueDay;
    if (expense.isMandatory !== undefined)
      updateData.is_mandatory = expense.isMandatory;
    if (expense.creditCardId !== undefined)
      updateData.credit_card_id = expense.creditCardId;
    if (expense.paid !== undefined) updateData.is_paid = expense.paid;
    if (expense.isRefundable !== undefined)
      updateData.is_refundable = expense.isRefundable;

    const { error } = await this.supabase
      .from("fixed_expenses")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update expense: ${error.message}`);
    }
  }

  async softDelete(ids: string[], userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("fixed_expenses")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to soft delete expenses: ${error.message}`);
    }
  }

  async softDeleteFutureInstallments(
    installmentExpenseId: string,
    currentMonthId: string,
    userId: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("fixed_expenses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("installment_expense_id", installmentExpenseId)
      .gt("month_id", currentMonthId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(
        `Failed to soft delete future installments: ${error.message}`,
      );
    }
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<DatabaseFixedExpense | null> {
    const { data, error } = await this.supabase
      .from("fixed_expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      monthId: data.month_id,
      name: data.name,
      amount: Number(data.amount),
      dueDay: data.due_day,
      isMandatory: data.is_mandatory,
      paid: data.is_paid ?? false,
      creditCardId: data.credit_card_id,
      isInstallment: data.installment_expense_id !== null,
      totalInstallments: data.total_installments,
      currentInstallment: data.current_installment,
      installmentExpenseId: data.installment_expense_id,
      isRefundable: data.is_refundable ?? false,
      refundIncomeId: data.refund_income_id ?? null,
    };
  }

  async setRefundIncomeId(
    id: string,
    userId: string,
    incomeId: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("fixed_expenses")
      .update({ refund_income_id: incomeId })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to set refund income id: ${error.message}`);
    }
  }
}
