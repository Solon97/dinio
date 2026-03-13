import { SupabaseClient } from "@supabase/supabase-js";
import { InstallmentExpense } from "../../../domain/entities/BudgetConfig";
import { IInstallmentExpenseRepository } from "../../../domain/repositories/IBudgetRepository";

export class SupabaseInstallmentExpenseRepository implements IInstallmentExpenseRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(
    id: string,
    userId: string,
  ): Promise<InstallmentExpense | null> {
    const { data, error } = await this.supabase
      .from("installment_expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch installment expense: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      creditCardId: data.credit_card_id,
      totalAmount: Number(data.total_amount),
      totalInstallments: Number(data.total_installments),
      startInstallment: Number(data.start_installment),
      startsAtMonthId: Number(data.starts_at_month_id),
      endsAtMonthId: Number(data.ends_at_month_id),
    };
  }

  async findByUserId(userId: string): Promise<InstallmentExpense[]> {
    const { data, error } = await this.supabase
      .from("installment_expenses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch installment expenses: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      creditCardId: row.credit_card_id,
      totalAmount: Number(row.total_amount),
      totalInstallments: Number(row.total_installments),
      startInstallment: Number(row.start_installment),
      startsAtMonthId: Number(row.starts_at_month_id),
      endsAtMonthId: Number(row.ends_at_month_id),
    }));
  }

  async create(
    installmentExpense: Omit<InstallmentExpense, "id">,
  ): Promise<InstallmentExpense> {
    const { data, error } = await this.supabase
      .from("installment_expenses")
      .insert({
        user_id: installmentExpense.userId,
        name: installmentExpense.name,
        credit_card_id: installmentExpense.creditCardId,
        total_amount: installmentExpense.totalAmount,
        total_installments: installmentExpense.totalInstallments,
        start_installment: installmentExpense.startInstallment,
        starts_at_month_id: installmentExpense.startsAtMonthId,
        ends_at_month_id: installmentExpense.endsAtMonthId,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to create installment expense: ${error?.message}`,
      );
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      creditCardId: data.credit_card_id,
      totalAmount: Number(data.total_amount),
      totalInstallments: Number(data.total_installments),
      startInstallment: Number(data.start_installment),
      startsAtMonthId: Number(data.starts_at_month_id),
      endsAtMonthId: Number(data.ends_at_month_id),
    };
  }

  async update(
    id: string,
    userId: string,
    data: Partial<InstallmentExpense>,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.creditCardId !== undefined)
      updateData.credit_card_id = data.creditCardId;
    if (data.totalAmount !== undefined)
      updateData.total_amount = data.totalAmount;
    if (data.totalInstallments !== undefined)
      updateData.total_installments = data.totalInstallments;
    if (data.startInstallment !== undefined)
      updateData.start_installment = data.startInstallment;
    if (data.startsAtMonthId !== undefined)
      updateData.starts_at_month_id = data.startsAtMonthId;
    if (data.endsAtMonthId !== undefined)
      updateData.ends_at_month_id = data.endsAtMonthId;

    const { error } = await this.supabase
      .from("installment_expenses")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update installment expense: ${error.message}`);
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("installment_expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete installment expense: ${error.message}`);
    }
  }
}
