import { createClient } from "@/libs/supabase/server";
import { createRepositories } from "@/app/api/budget/infrastructure/repositories/supabase";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CreditCardInvoicesResponse } from "@/types/budget";

const getInvoicesSchema = z.object({
  month_id: z
    .string()
    .regex(/^\d{6}$/, "month_id must be in YYYYMM format")
    .transform(Number),
});

/**
 * GET /api/credit-card-invoices?month_id=YYYYMM
 * Returns all credit card invoices for the given month with consolidated totals.
 * Each invoice includes credit card metadata (name, color, closingDay, dueDay)
 * and the sum of all daily + fixed expenses linked to that card/month pair.
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
    const validation = getInvoicesSchema.safeParse({
      month_id: searchParams.get("month_id") ?? "",
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid params", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { month_id: dueMonthId } = validation.data;

    const { creditCardInvoiceRepository } = await createRepositories();
    const invoices = await creditCardInvoiceRepository.findByUserAndMonth(
      user.id,
      dueMonthId,
    );

    const response: CreditCardInvoicesResponse = {
      __type: "CreditCardInvoicesResponse",
      invoices,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Credit card invoices GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
