import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotInternalSecret } from "../_lib/internal-auth";
import { getBotFinancialStatus } from "../_lib/financial";
import { createBotRepositories } from "../_lib/repositories";

const simulateExpenseSchema = z.object({
  user_id: z.string().uuid(),
  // Amount in cents, positive integer
  amount: z
    .number()
    .int()
    .positive()
    .max(99999999, "Amount exceeds maximum of R$ 999.999,99"),
  description: z.string().optional(),
});

/**
 * POST /api/bot/simulate-expense
 * Simulates the budget impact of a hypothetical expense without saving it.
 * All monetary values are in cents.
 */
export async function POST(request: Request) {
  const unauthorized = requireBotInternalSecret(request);
  if (unauthorized) {
    return unauthorized;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = simulateExpenseSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid data", details: validation.error.flatten() },
      { status: 400 },
    );
  }

  const { user_id: userId, amount } = validation.data;
  const { budgetRepository, dailyExpenseRepository } = createBotRepositories();

  const status = await getBotFinancialStatus(
    userId,
    budgetRepository,
    dailyExpenseRepository,
    amount,
  );

  if (!status.isConfigured) {
    return NextResponse.json(
      { error: "Budget not configured for current month" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    new_future_recommendation: status.recommendedForFuture,
    new_month_balance: status.monthBalanceCents,
    new_projection: status.monthProjectionCents,
  });
}
