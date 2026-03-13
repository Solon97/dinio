import { SupabaseClient } from "@supabase/supabase-js";
import type { AgendaItem } from "@/app/api/notifications/application/helpers/buildDailyNotifications";

export interface UserBudgetContext {
  /** null when the user has no budget configured for the current month */
  dailyLimitCents: number | null;
  /** financial commitments due today */
  agendaItems: AgendaItem[];
}

// Shape returned by the get_notification_budget_context RPC
interface BudgetContextPayload {
  budget_configs: Array<{
    user_id: string;
    total_income: number;
    daily_percent: number;
    remaining_daily_budget: number;
    start_day: number;
  }>;
  expense_agg: Array<{
    user_id: string;
    spent_before: number;
    future_committed: number;
  }>;
  fixed_expenses_today: Array<{
    user_id: string;
    name: string;
    amount: number;
  }>;
  invoices_today: Array<{
    user_id: string;
    card_name: string;
  }>;
}

/**
 * Fetch budget notification context for a single user via RPC.
 *
 * Uses HTTP POST (JSON body) via RPC to avoid URL-length constraints from
 * PostgREST GET queries. All four subqueries run in a single Postgres
 * transaction, ensuring a consistent snapshot.
 *
 * @param supabase - Admin Supabase client
 * @param userId   - User ID to fetch context for
 * @param date     - Notification date in "YYYY-MM-DD" format
 */
export async function fetchBudgetContextForUser(
  supabase: SupabaseClient,
  userId: string,
  date: string,
): Promise<UserBudgetContext> {
  const [yearStr, monthStr, dayStr] = date.split("-");
  const year = parseInt(yearStr);
  const month1 = parseInt(monthStr); // 1-indexed
  const dayOfMonth = parseInt(dayStr);
  const currentMonthId = year * 100 + month1;
  const daysInMonth = new Date(year, month1, 0).getDate();

  const { data, error } = await supabase.rpc(
    "get_notification_budget_context",
    {
      p_user_ids: [userId],
      p_month_id: currentMonthId,
      p_today: date,
    },
  );

  if (error) {
    throw new Error(`Failed to fetch budget context: ${error.message}`);
  }

  const payload = data as BudgetContextPayload;

  const config = (payload.budget_configs ?? []).find(
    (row) => row.user_id === userId,
  );

  const expenseRow = (payload.expense_agg ?? []).find(
    (row) => row.user_id === userId,
  );

  const agendaItems: AgendaItem[] = [
    ...(payload.fixed_expenses_today ?? [])
      .filter((row) => row.user_id === userId)
      .map((row) => ({ name: row.name, amountCents: Number(row.amount) })),
    ...(payload.invoices_today ?? [])
      .filter((row) => row.user_id === userId)
      .map((row) => ({
        name: `Fatura ${row.card_name}`,
        amountCents: null as number | null,
      })),
  ];

  let dailyLimitCents: number | null = null;

  if (config) {
    const adjustedDailyBudget =
      Number(config.remaining_daily_budget) > 0
        ? Number(config.remaining_daily_budget)
        : Math.floor(
            (Number(config.total_income) * Number(config.daily_percent)) / 100,
          );

    const spentBefore = expenseRow ? Number(expenseRow.spent_before) : 0;
    const futureCommitted = expenseRow
      ? Number(expenseRow.future_committed)
      : 0;

    const remainingBudget = adjustedDailyBudget - spentBefore - futureCommitted;
    const remainingDays = daysInMonth - dayOfMonth + 1;

    dailyLimitCents =
      remainingDays > 0
        ? Math.max(0, Math.floor(remainingBudget / remainingDays))
        : 0;
  }

  return { dailyLimitCents, agendaItems };
}
