import { createAdminClient } from "@/libs/supabase/admin";
import { SupabaseBudgetRepository } from "@/app/api/budget/infrastructure/repositories/supabase/budget";
import { SupabaseDailyExpenseRepository } from "@/app/api/budget/infrastructure/repositories/supabase/daily-expense";

/**
 * Creates budget and daily expense repositories backed by the Supabase admin client.
 * Used by bot endpoints to operate on behalf of a user without a session cookie.
 */
export function createBotRepositories() {
  const supabase = createAdminClient();

  return {
    supabase,
    budgetRepository: new SupabaseBudgetRepository(supabase),
    dailyExpenseRepository: new SupabaseDailyExpenseRepository(supabase),
  };
}
