import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { computeMonthIdFromString } from "@/libs/monthId";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotInternalSecret } from "../_lib/internal-auth";
import { getBotFinancialStatus } from "../_lib/financial";
import { createBotRepositories } from "../_lib/repositories";

const VALID_CATEGORIES = EXPENSE_CATEGORIES.map((cat) => cat.value);

const registerReimbursementSchema = z.object({
  user_id: z.string().uuid(),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .max(120, "Description must be at most 120 characters"),
  // Amount in cents, positive integer — stored as negative expense
  amount: z
    .number()
    .int()
    .positive()
    .max(99999999, "Amount exceeds maximum of R$ 999.999,99"),
  category: z.enum(VALID_CATEGORIES as [string, ...string[]]).default("Outros"),
  // Optional date (YYYY-MM-DD); defaults to today when omitted
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .refine((val) => {
      const [year, month, day] = val.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month - 1 &&
        d.getDate() === day
      );
    }, "Date must be a valid calendar date")
    .optional(),
});

/**
 * POST /api/bot/register-reimbursement
 * Registers a reimbursement (negative daily expense) on behalf of a user.
 * Accepts a positive `amount` in cents and stores it as a negative expense,
 * following the same convention used by the web app's CaptureMenu.
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

  const validation = registerReimbursementSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid data", details: validation.error.flatten() },
      { status: 400 },
    );
  }

  const {
    user_id: userId,
    description,
    amount,
    category,
    date: providedDate,
  } = validation.data;

  const { supabase, budgetRepository, dailyExpenseRepository } =
    createBotRepositories();

  // Resolve date: use provided date or fall back to today in São Paulo
  let date: string;
  if (providedDate) {
    date = providedDate;
  } else {
    const { getTZDateParts } = await import("@/app/api/budget/helpers");
    const { year, month, day } = getTZDateParts(new Date());
    date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Store reimbursements as negative expenses (same convention as web app)
  const { error: insertError } = await supabase.from("daily_expenses").insert({
    user_id: userId,
    date,
    month_id: computeMonthIdFromString(date),
    amount: -amount,
    description,
    category,
    time: null,
    credit_card_id: null,
    invoice_due_month_id: null,
  });

  if (insertError) {
    console.error("Bot register-reimbursement insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to register reimbursement" },
      { status: 500 },
    );
  }

  const status = await getBotFinancialStatus(
    userId,
    budgetRepository,
    dailyExpenseRepository,
  );

  return NextResponse.json(
    {
      expense_saved: true,
      today_spent: status.todaySpentCents,
      recommended_today: status.recommendedTodayCents,
      month_balance: status.monthBalanceCents,
    },
    { status: 201 },
  );
}
