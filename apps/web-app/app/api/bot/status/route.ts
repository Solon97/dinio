import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotInternalSecret } from "../_lib/internal-auth";
import { getBotFinancialStatus } from "../_lib/financial";
import { createBotRepositories } from "../_lib/repositories";

const querySchema = z.object({
  user_id: z.string().uuid(),
});

/**
 * GET /api/bot/status?user_id=<id>
 * Returns the current financial status of a user for bot queries.
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
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid query", details: validation.error.flatten() },
      { status: 400 },
    );
  }

  const { user_id: userId } = validation.data;
  const { budgetRepository, dailyExpenseRepository } = createBotRepositories();

  const status = await getBotFinancialStatus(
    userId,
    budgetRepository,
    dailyExpenseRepository,
  );

  if (!status.isConfigured) {
    return NextResponse.json(
      { error: "Budget not configured for current month" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    recommended_today: status.recommendedTodayCents,
    today_spent: status.todaySpentCents,
    month_balance: status.monthBalanceCents,
    days_left: status.daysLeft,
    month_projection: status.monthProjectionCents,
  });
}
