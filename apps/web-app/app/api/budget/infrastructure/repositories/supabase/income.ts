import { SupabaseClient } from "@supabase/supabase-js";
import { Income } from "../../../domain/entities/BudgetConfig";
import { IIncomeRepository } from "../../../domain/repositories/IBudgetRepository";

export class SupabaseIncomeRepository implements IIncomeRepository {
  constructor(private supabase: SupabaseClient) {}

  async bulkUpdate(
    userId: string,
    monthId: string,
    incomes: { id: string; name: string; amount: number }[],
  ): Promise<void> {
    if (incomes.length === 0) return;

    const rows = incomes.map((income) => ({
      id: income.id,
      user_id: userId,
      month_id: monthId,
      name: income.name,
      amount: income.amount,
    }));

    const { error } = await this.supabase
      .from("incomes")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      throw new Error(`Failed to bulk update incomes: ${error.message}`);
    }
  }

  async findByUserAndMonth(userId: string, monthId: string): Promise<Income[]> {
    const { data, error } = await this.supabase
      .from("incomes")
      .select("*")
      .eq("user_id", userId)
      .eq("month_id", monthId);

    if (error) {
      throw new Error(`Failed to fetch incomes: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      monthId: row.month_id,
      name: row.name,
      amount: Number(row.amount),
    }));
  }

  async deleteByUserAndMonth(userId: string, monthId: string): Promise<void> {
    const { error } = await this.supabase
      .from("incomes")
      .delete()
      .eq("user_id", userId)
      .eq("month_id", monthId);

    if (error) {
      throw new Error(`Failed to delete incomes: ${error.message}`);
    }
  }

  async bulkCreate(incomes: Income[]): Promise<void> {
    const rows = incomes.map((income) => ({
      user_id: income.userId,
      month_id: income.monthId,
      name: income.name,
      amount: income.amount,
    }));

    const { error } = await this.supabase.from("incomes").insert(rows);

    if (error) {
      throw new Error(`Failed to create incomes: ${error.message}`);
    }
  }

  async create(income: Omit<Income, "id">): Promise<Income> {
    const { data, error } = await this.supabase
      .from("incomes")
      .insert({
        user_id: income.userId,
        month_id: income.monthId,
        name: income.name,
        amount: income.amount,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create income: ${error?.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      monthId: data.month_id,
      name: data.name,
      amount: Number(data.amount),
    };
  }

  async update(
    id: string,
    userId: string,
    income: Partial<Income>,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (income.name !== undefined) updateData.name = income.name;
    if (income.amount !== undefined) updateData.amount = income.amount;

    const { error } = await this.supabase
      .from("incomes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update income: ${error.message}`);
    }
  }

  async delete(ids: string[], userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("incomes")
      .delete()
      .in("id", ids)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete incomes: ${error.message}`);
    }
  }
}
