import { createClient } from "@/libs/supabase/server";
import { createRepositories } from "@/app/api/budget/infrastructure/repositories/supabase";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchFixedExpenseSchema = z.object({
  isPaid: z.boolean(),
});

/**
 * PATCH /api/fixed-expenses/:id
 * Marks a fixed expense as paid or unpaid.
 * Only updates is_paid — does NOT recalculate ceilings or daily budgets.
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
    const validation = patchFixedExpenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { isPaid } = validation.data;

    const { expenseRepository } = await createRepositories();
    await expenseRepository.update(id, user.id, { paid: isPaid });

    return NextResponse.json({ id, isPaid });
  } catch (error) {
    console.error("Fixed expense PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
