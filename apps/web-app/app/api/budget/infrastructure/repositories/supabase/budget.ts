import { SupabaseClient } from "@supabase/supabase-js";
import { BudgetConfig } from "../../../domain/entities/BudgetConfig";
import { IBudgetRepository } from "../../../domain/repositories/IBudgetRepository";

export class SupabaseBudgetRepository implements IBudgetRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByUserAndMonth(
    userId: string,
    monthId: string,
  ): Promise<BudgetConfig | null> {
    const { data, error } = await this.supabase
      .from("monthly_budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("month_id", monthId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch budget: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      month: data.month,
      year: data.year,
      monthId: data.month_id,
      totalIncome: Number(data.total_income),
      fixedPercent: Number(data.fixed_percent),
      dailyPercent: Number(data.daily_percent),
      reservePercent: Number(data.reserve_percent),
      remainingDailyBudget: Number(data.remaining_daily_budget || 0),
      startDay: Number(data.start_day || 1),
    };
  }

  async create(config: Omit<BudgetConfig, "id">): Promise<BudgetConfig> {
    const { data, error } = await this.supabase
      .from("monthly_budgets")
      .insert({
        user_id: config.userId,
        month: config.month,
        year: config.year,
        month_id: config.monthId,
        total_income: config.totalIncome,
        fixed_percent: config.fixedPercent,
        daily_percent: config.dailyPercent,
        reserve_percent: config.reservePercent,
        remaining_daily_budget: config.remainingDailyBudget,
        start_day: config.startDay,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create budget: ${error?.message}`);
    }

    return { ...config, id: data.id };
  }

  async update(
    id: string,
    userId: string,
    config: Partial<BudgetConfig>,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (config.totalIncome !== undefined)
      updateData.total_income = config.totalIncome;
    if (config.fixedPercent !== undefined)
      updateData.fixed_percent = config.fixedPercent;
    if (config.dailyPercent !== undefined)
      updateData.daily_percent = config.dailyPercent;
    if (config.reservePercent !== undefined)
      updateData.reserve_percent = config.reservePercent;

    const { error } = await this.supabase
      .from("monthly_budgets")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update budget: ${error.message}`);
    }
  }
}
