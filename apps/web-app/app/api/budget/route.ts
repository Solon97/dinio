import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { BudgetConfigPayload } from "@/types/budget";
import { createRepositories } from "./infrastructure/repositories/supabase";
import { BudgetController } from "./presentation/controllers/BudgetController";
import { start } from "repl";

/**
 * GET /api/budget?month=X&year=Y
 * Returns budget configuration for a specific month
 */
export async function GET(request: Request) {
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

    // Create repositories and controller
    const repositories = await createRepositories();
    const controller = new BudgetController(
      repositories.budgetRepository,
      repositories.incomeRepository,
      repositories.expenseRepository,
      repositories.creditCardRepository,
      repositories.dailyExpenseRepository,
      repositories.installmentExpenseRepository,
      repositories.creditCardInvoiceRepository,
    );

    return await controller.getBudget(user.id, month, year);
}

/**
 * POST /api/budget
 * Creates or updates budget configuration
 */
export async function POST(request: Request) {
  const start = performance.now();
  
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: BudgetConfigPayload = await request.json();

    // Create repositories and controller
    const repositories = await createRepositories();
    const controller = new BudgetController(
      repositories.budgetRepository,
      repositories.incomeRepository,
      repositories.expenseRepository,
      repositories.creditCardRepository,
      repositories.dailyExpenseRepository,
      repositories.installmentExpenseRepository,
      repositories.creditCardInvoiceRepository,
    );

    const response = await controller.createBudget(user.id, body);
    console.info("[budget][route] POST /api/budget", {
      userId: user.id,
      durationMs: Math.round(performance.now() - start),
      status: response.status,
    });
    return response;
}

/**
 * PUT /api/budget
 * Updates existing budget configuration with differential updates
 * Handles soft deletes for expenses marked for deletion
 */
export async function PUT(request: Request) {
  console.log("[budget][route] PUT /api/budget - Start processing request");
    const supabase = await createClient();
    console.log("[budget][route] PUT /api/budget - Supabase client created");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("[budget][route] PUT /api/budget - User authentication checked", { authError, user });
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[budget][route] PUT /api/budget - User authenticated successfully", { userId: user.id });

    const body: BudgetConfigPayload = await request.json();

    // Create repositories and controller
    const repositories = await createRepositories();
    const controller = new BudgetController(
      repositories.budgetRepository,
      repositories.incomeRepository,
      repositories.expenseRepository,
      repositories.creditCardRepository,
      repositories.dailyExpenseRepository,
      repositories.installmentExpenseRepository,
      repositories.creditCardInvoiceRepository,
    );

    const response = await controller.updateBudget(user.id, body);
    console.info("[budget][route] PUT /api/budget", {
      userId: user.id,
      status: response.status,
    });
    return response;
}
