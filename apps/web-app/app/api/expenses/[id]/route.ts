import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { computeMonthIdFromString } from "@/libs/monthId";
import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const VALID_CATEGORIES = EXPENSE_CATEGORIES.map((cat) => cat.value);

const updateExpenseSchema = z
  .object({
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
    amount: z
      .number()
      .refine((v) => v !== 0, "Amount must not be zero")
      .refine(
        (v) => Math.abs(v) <= 99999999,
        "Amount exceeds maximum of R$ 999.999,99",
      )
      .optional(),
    description: z
      .string()
      .min(3, "Description must be at least 3 characters")
      .max(120, "Description must be at most 120 characters")
      .optional(),
    category: z.enum(VALID_CATEGORIES as [string, ...string[]]).optional(),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format")
      .nullable()
      .optional(),
    creditCardId: z.string().uuid().nullable().optional(),
    invoiceDueMonthId: z.number().int().positive().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.creditCardId && !data.invoiceDueMonthId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invoice month is required when a credit card is selected",
        path: ["invoiceDueMonthId"],
      });
    }
  });

/**
 * DELETE /api/expenses/:id
 * Removes a daily expense by ID (hard delete)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete only if the expense belongs to this user (RLS enforces it too)
    const { error: deleteError } = await supabase
      .from("daily_expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting expense:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete expense" },
        { status: 500 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Expenses DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/expenses/:id
 * Updates a daily expense by ID
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validation = updateExpenseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const payload = validation.data;

    // Convert to DB payload, filtering out undefined fields
    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.date !== undefined) {
      dbPayload.date = payload.date;
      dbPayload.month_id = computeMonthIdFromString(payload.date);
    }
    if (payload.amount !== undefined) dbPayload.amount = payload.amount;
    if (payload.description !== undefined)
      dbPayload.description = payload.description;
    if (payload.category !== undefined) dbPayload.category = payload.category;
    if (payload.time !== undefined) dbPayload.time = payload.time;
    if (payload.creditCardId !== undefined)
      dbPayload.credit_card_id = payload.creditCardId;
    if (payload.invoiceDueMonthId !== undefined)
      dbPayload.invoice_due_month_id = payload.invoiceDueMonthId;

    if (Object.keys(dbPayload).length === 1) {
      // only updated_at is present
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const { data: updatedExpense, error: updateError } = await supabase
      .from("daily_expenses")
      .update(dbPayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, credit_cards(id, name, color)")
      .single();

    if (updateError) {
      console.error("Error updating expense:", updateError);
      return NextResponse.json(
        { error: "Failed to update expense" },
        { status: 500 },
      );
    }

    const response = {
      __type: "ExpenseResponse" as const,
      id: updatedExpense.id,
      date: updatedExpense.date,
      amount: Number(updatedExpense.amount),
      description: updatedExpense.description,
      category: updatedExpense.category,
      time: updatedExpense.time || undefined,
      createdAt: updatedExpense.created_at,
      creditCard: updatedExpense.credit_cards ?? null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Expenses PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
