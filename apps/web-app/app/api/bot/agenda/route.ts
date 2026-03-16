import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotInternalSecret } from "../_lib/internal-auth";
import { createAdminClient } from "@/libs/supabase/admin";
import { fetchBudgetContextForUser } from "@/app/api/cron/notifications/fetchBudgetContext";
import { SupabaseFixedExpenseRepository } from "@/app/api/budget/infrastructure/repositories/supabase/fixed-expense";
import { SupabaseCreditCardRepository } from "@/app/api/budget/infrastructure/repositories/supabase/credit-card";

const SAO_PAULO_TZ = "America/Sao_Paulo";

function getTodayInSaoPaulo(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Converts a YYYY-MM-DD date string to a 6-char month ID like "202603". */
function toMonthId(date: string): string {
  return date.slice(0, 4) + date.slice(5, 7);
}

/** Formats a Date as YYYY-MM-DD using the local date parts (no timezone shift). */
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns the next `count` calendar dates starting from `start` (YYYY-MM-DD). */
function getDatesFrom(start: string, count: number): string[] {
  const [y, m, d] = start.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    return formatLocalDate(new Date(y, m - 1, d + i));
  });
}

/** Returns all remaining dates of the current month, starting from `start`. */
function getDatesUntilMonthEnd(start: string): string[] {
  const [y, m, d] = start.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  return Array.from({ length: daysInMonth - d + 1 }, (_, i) => {
    return formatLocalDate(new Date(y, m - 1, d + i));
  });
}

const querySchema = z.object({
  user_id: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  period: z.enum(["day", "week", "month"]).default("day"),
});

/**
 * GET /api/bot/agenda?user_id=<id>&date=<YYYY-MM-DD>&period=<day|week|month>
 *
 * Returns the financial commitments for the requested period:
 *   - day   (default): commitments due on the given date (defaults to today in São Paulo)
 *   - week  : commitments over the next 7 days starting from today
 *   - month : commitments for the remaining days of the current month
 *
 * Items for week/month include a `date` field (YYYY-MM-DD) indicating when
 * the commitment is due. All monetary values are in cents.
 */
export async function GET(request: Request) {
  const unauthorized = requireBotInternalSecret(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const validation = querySchema.safeParse({
    user_id: searchParams.get("user_id"),
    date: searchParams.get("date") ?? undefined,
    period: searchParams.get("period") ?? "day",
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid query", details: validation.error.flatten() },
      { status: 400 },
    );
  }

  const {
    user_id: userId,
    date = getTodayInSaoPaulo(),
    period,
  } = validation.data;

  const supabase = createAdminClient();

  if (period === "day") {
    const context = await fetchBudgetContextForUser(supabase, userId, date);
    return NextResponse.json({ items: context.agendaItems });
  }

  // For week/month: efficiently fetch all data in 2 queries then filter by day
  const dates =
    period === "week" ? getDatesFrom(date, 7) : getDatesUntilMonthEnd(date);

  // Determine which months are touched (week may span two months)
  const monthIds = [...new Set(dates.map(toMonthId))];

  const fixedExpenseRepo = new SupabaseFixedExpenseRepository(supabase);
  const creditCardRepo = new SupabaseCreditCardRepository(supabase);

  const [fixedExpenses, creditCards] = await Promise.all([
    Promise.all(
      monthIds.map((monthId) =>
        fixedExpenseRepo.findByUserAndMonth(userId, monthId),
      ),
    ).then((results) => results.flat()),
    creditCardRepo.findActiveByUser(userId),
  ]);

  const items = dates.flatMap((d) => {
    const dayOfMonth = parseInt(d.split("-")[2]);
    const dateMonthId = toMonthId(d);
    const dayItems: Array<{
      name: string;
      amountCents: number | null;
      date: string;
    }> = [];

    for (const expense of fixedExpenses) {
      if (
        expense.monthId === dateMonthId &&
        expense.dueDay === dayOfMonth &&
        !expense.creditCardId
      ) {
        dayItems.push({ name: expense.name, amountCents: expense.amount, date: d });
      }
    }

    for (const card of creditCards) {
      if (card.dueDay === dayOfMonth) {
        dayItems.push({ name: `Fatura ${card.name}`, amountCents: null, date: d });
      }
    }

    return dayItems;
  });

  return NextResponse.json({ items });
}
