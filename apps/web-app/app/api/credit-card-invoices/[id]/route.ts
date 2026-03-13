import { createClient } from "@/libs/supabase/server";
import { createRepositories } from "@/app/api/budget/infrastructure/repositories/supabase";
import { NextResponse } from "next/server";
import { z } from "zod";

const markAsPaidSchema = z.object({
  isPaid: z.boolean(),
});

/**
 * PATCH /api/credit-card-invoices/:id
 * Marks a credit card invoice as paid.
 * Only updates is_paid — does NOT recalculate ceilings, daily budgets, or create expenses.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const validation = markAsPaidSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { isPaid } = validation.data;

    const { creditCardInvoiceRepository } = await createRepositories();
    const invoice = await creditCardInvoiceRepository.markAsPaid(
      id,
      user.id,
      isPaid,
    );

    return NextResponse.json({ id: invoice.id, isPaid: invoice.isPaid });
  } catch (error) {
    console.error("Invoice PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
