import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { computeMonthIdFromString } from "@/libs/monthId";
import { createClient } from "@/libs/supabase/server";
import { captureServerEvent } from "@/libs/posthogServer";
import { posthogEvents } from "@/libs/posthog";
import { DailyExpenseRow, ExpenseResponse } from "@/types/budget";
import { NextResponse } from "next/server";
import { z } from "zod";

const VALID_CATEGORIES = EXPENSE_CATEGORIES.map((cat) => cat.value);

const createExpenseSchema = z
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
      }, "Date must be a valid calendar date"),
    amount: z
      .number()
      .refine((v) => v !== 0, "Amount must not be zero")
      .refine(
        (v) => Math.abs(v) <= 99999999,
        "Amount exceeds maximum of R$ 999.999,99",
      ),
    description: z
      .string()
      .min(3, "Description must be at least 3 characters")
      .max(120, "Description must be at most 120 characters"),
    category: z
      .enum(VALID_CATEGORIES as [string, ...string[]])
      .default("Outros"),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format")
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

type ValidatedExpensePayload = z.infer<typeof createExpenseSchema>;

/**
 * GET /api/expenses?month=X&year=Y
 * Returns all expenses for a specific month
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
    const month = parseInt(searchParams.get("month") || "");
    const year = parseInt(searchParams.get("year") || "");

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 },
      );
    }

    // Cursor-based pagination params
    const cursor = searchParams.get("cursor") || undefined;
    const limitParam = parseInt(searchParams.get("limit") || "");
    const isPaginated = cursor !== undefined || !isNaN(limitParam);
    const limit = !isNaN(limitParam) ? Math.min(limitParam, 50) : 20;

    // Calculate date range for the month
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      lastDay,
    ).padStart(2, "0")}`;

    if (isPaginated) {
      // Cursor-based paginated query (for expense list UI)
      let query = supabase
        .from("daily_expenses")
        .select("*, credit_cards(id, name, color)")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false })
        .order("time", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit + 1); // Fetch one extra to detect hasMore

      if (cursor) {
        // Fetch the cursor row to get its date/time for keyset pagination
        const { data: cursorRow } = await supabase
          .from("daily_expenses")
          .select("date, time, created_at")
          .eq("id", cursor)
          .single();

        if (cursorRow) {
          // Use OR-based keyset pagination for composite ordering
          query = query.or(
            `date.lt.${cursorRow.date},` +
              `and(date.eq.${cursorRow.date},time.lt.${cursorRow.time || "00:00"}),` +
              `and(date.eq.${cursorRow.date},time.eq.${cursorRow.time || "00:00"},created_at.lt.${cursorRow.created_at})`,
          );
        }
      }

      const { data: expenses, error: queryError } = await query;

      if (queryError) {
        console.error("Error fetching paginated expenses:", queryError);
        return NextResponse.json(
          { error: "Failed to fetch expenses" },
          { status: 500 },
        );
      }

      const rows = expenses || [];
      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;

      const response: ExpenseResponse[] = pageRows.map(
        (row: DailyExpenseRow) => ({
          __type: "ExpenseResponse",
          id: row.id,
          date: row.date,
          amount: Number(row.amount),
          description: row.description,
          category: row.category,
          time: row.time || undefined,
          createdAt: row.created_at,
          creditCard: row.credit_cards ?? null,
          invoiceDueMonthId: row.invoice_due_month_id ?? null,
        }),
      );

      return NextResponse.json({
        __type: "ExpenseListResponse",
        expenses: response,
        nextCursor,
        hasMore,
      });
    }

    // Non-paginated query (for budget helper / backward compatibility)
    const { data: expenses, error: queryError } = await supabase
      .from("daily_expenses")
      .select("*, credit_cards(id, name, color)")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (queryError) {
      console.error("Error fetching expenses:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch expenses" },
        { status: 500 },
      );
    }

    const response: ExpenseResponse[] = (expenses || []).map(
      (row: DailyExpenseRow) => ({
        __type: "ExpenseResponse",
        id: row.id,
        date: row.date,
        amount: Number(row.amount),
        description: row.description,
        category: row.category,
        time: row.time || undefined,
        createdAt: row.created_at,
        creditCard: row.credit_cards ?? null,
        invoiceDueMonthId: row.invoice_due_month_id ?? null,
      }),
    );

    return NextResponse.json({ expenses: response });
  } catch (error) {
    console.error("Expenses GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/expenses
 * Creates a new daily expense
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validation = createExpenseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const payload = validation.data as ValidatedExpensePayload;

    // Check if this is the user's first expense before inserting
    const { data: existingExpense } = await supabase
      .from("daily_expenses")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    const isFirstExpense = existingExpense === null;

    // Insert the expense
    const { data: expense, error: insertError } = await supabase
      .from("daily_expenses")
      .insert({
        user_id: user.id,
        date: payload.date,
        month_id: computeMonthIdFromString(payload.date),
        amount: payload.amount,
        description: payload.description,
        category: payload.category,
        time: payload.time || null,
        credit_card_id: payload.creditCardId ?? null,
        invoice_due_month_id: payload.invoiceDueMonthId ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating expense:", insertError);
      return NextResponse.json(
        { error: "Failed to create expense" },
        { status: 500 },
      );
    }

    const response: ExpenseResponse = {
      __type: "ExpenseResponse",
      id: expense.id,
      date: expense.date,
      amount: Number(expense.amount),
      description: expense.description,
      category: expense.category,
      time: expense.time || undefined,
      createdAt: expense.created_at,
      invoiceDueMonthId: expense.invoice_due_month_id ?? null,
    };

    const daysSinceOnboarding = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    captureServerEvent(user.id, posthogEvents.EXPENSE_CREATED, {
      is_first_expense: isFirstExpense,
      days_since_onboarding: daysSinceOnboarding,
      month_id: String(expense.month_id),
    }).catch((e) => console.error("[posthog] expense_created error:", e));

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Expenses POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
