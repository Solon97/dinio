import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { computeMonthIdFromString } from "@/libs/monthId";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotInternalSecret } from "../_lib/internal-auth";
import { getBotFinancialStatus } from "../_lib/financial";
import { createBotRepositories } from "../_lib/repositories";

const VALID_CATEGORIES = EXPENSE_CATEGORIES.map((cat) => cat.value);

const registerExpenseSchema = z
  .object({
    user_id: z.string().uuid(),
    description: z
      .string()
      .min(3, "Description must be at least 3 characters")
      .max(120, "Description must be at most 120 characters"),
    // Amount in cents — positive for expenses, negative for refunds; must not be zero.
    amount: z
      .number()
      .int()
      .refine((v) => v !== 0, "Amount must not be zero")
      .refine(
        (v) => Math.abs(v) <= 99999999,
        "Amount exceeds maximum of R$ 999.999,99",
      ),
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
    credit_card_id: z.string().uuid().nullable().optional(),
    invoice_due_month_id: z.number().int().positive().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.credit_card_id && !data.invoice_due_month_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "invoice_due_month_id is required when credit_card_id is provided",
        path: ["invoice_due_month_id"],
      });
    }
  });

/**
 * POST /api/bot/register-expense
 * Registers a daily expense on behalf of a user.
 * All monetary values are in cents.
 * Supports optional date (defaults to today in São Paulo), credit card, and
 * invoice due month following the same rules as POST /api/expenses.
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

  const validation = registerExpenseSchema.safeParse(body);
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
    credit_card_id: creditCardId,
    invoice_due_month_id: invoiceDueMonthId,
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

  // Validate credit card ownership when provided
  if (creditCardId) {
    const { data: card, error: cardError } = await supabase
      .from("credit_cards")
      .select("id")
      .eq("id", creditCardId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: "Credit card not found or does not belong to user" },
        { status: 404 },
      );
    }
  }

  const { error: insertError } = await supabase.from("daily_expenses").insert({
    user_id: userId,
    date,
    month_id: computeMonthIdFromString(date),
    amount,
    description,
    category,
    time: null,
    credit_card_id: creditCardId ?? null,
    invoice_due_month_id: invoiceDueMonthId ?? null,
  });

  if (insertError) {
    console.error("Bot register-expense insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to register expense" },
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

