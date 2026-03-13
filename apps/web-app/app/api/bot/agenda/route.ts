import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotInternalSecret } from "../_lib/internal-auth";
import { createAdminClient } from "@/libs/supabase/admin";
import { fetchBudgetContextForUser } from "@/app/api/cron/notifications/fetchBudgetContext";

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

const querySchema = z.object({
  user_id: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/**
 * GET /api/bot/agenda?user_id=<id>&date=<YYYY-MM-DD>
 * Returns the financial commitments due on the given date (defaults to today in São Paulo).
 * All monetary values are in cents.
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
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid query", details: validation.error.flatten() },
      { status: 400 },
    );
  }

  const { user_id: userId, date = getTodayInSaoPaulo() } = validation.data;

  const supabase = createAdminClient();
  const context = await fetchBudgetContextForUser(supabase, userId, date);

  return NextResponse.json({
    items: context.agendaItems,
  });
}
