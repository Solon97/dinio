import { createClient } from "@/libs/supabase/server";
import { createRepositories } from "@/app/api/budget/infrastructure/repositories/supabase";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CreditCardInvoiceExpensesResponse } from "@/types/budget";

const getInvoiceExpensesSchema = z.object({
  month_id: z
    .string()
    .regex(/^\d{6}$/, "month_id must be in YYYYMM format")
    .transform(Number),
  credit_card_id: z.string().uuid("credit_card_id must be a valid UUID"),
});

/**
 * GET /api/credit-card-invoices/expenses?month_id=YYYYMM&credit_card_id=UUID
 * Returns all expenses (daily + fixed) for a specific credit card invoice period.
 * Each item includes type: "daily" | "fixed" to distinguish the source.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validation = getInvoiceExpensesSchema.safeParse({
      month_id: searchParams.get("month_id") ?? "",
      credit_card_id: searchParams.get("credit_card_id") ?? "",
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid params", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { month_id: dueMonthId, credit_card_id: creditCardId } =
      validation.data;

    const { creditCardInvoiceRepository } = await createRepositories();
    const expenses =
      await creditCardInvoiceRepository.findExpensesByCardAndMonth(
        user.id,
        creditCardId,
        dueMonthId,
      );

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    const response: CreditCardInvoiceExpensesResponse = {
      __type: "CreditCardInvoiceExpensesResponse",
      creditCardId,
      dueMonthId,
      expenses,
      totalAmount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Invoice expenses GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
