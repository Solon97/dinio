import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { createLogger } from "@/libs/observability/logger";
import { runWithSpan } from "@/libs/observability/tracing";
import { BudgetConfigPayload } from "@/types/budget";
import { createRepositories } from "./infrastructure/repositories/supabase";
import { BudgetController } from "./presentation/controllers/BudgetController";

const logger = createLogger("api.budget.route");

async function createBudgetController() {
  const repositories = await createRepositories();

  return new BudgetController(
    repositories.budgetRepository,
    repositories.incomeRepository,
    repositories.expenseRepository,
    repositories.creditCardRepository,
    repositories.dailyExpenseRepository,
    repositories.installmentExpenseRepository,
    repositories.creditCardInvoiceRepository,
  );
}

/**
 * GET /api/budget?month=X&year=Y
 * Returns budget configuration for a specific month
 */
export async function GET(request: Request) {
  return runWithSpan(
    "api.budget.get",
    { "http.method": "GET", "http.route": "/api/budget" },
    async () => {
      const supabase = await createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.warn("budget_get_unauthorized", {
          hasAuthError: Boolean(authError),
        });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const month = parseInt(searchParams.get("month") || "", 10);
      const year = parseInt(searchParams.get("year") || "", 10);

      const controller = await createBudgetController();
      const response = await controller.getBudget(user.id, month, year);

      logger.info("budget_get_completed", {
        userId: user.id,
        month,
        year,
        status: response.status,
      });

      return response;
    },
  );
}

/**
 * POST /api/budget
 * Creates or updates budget configuration
 */
export async function POST(request: Request) {
  const start = performance.now();

  return runWithSpan(
    "api.budget.post",
    { "http.method": "POST", "http.route": "/api/budget" },
    async () => {
      const supabase = await createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.warn("budget_post_unauthorized", {
          hasAuthError: Boolean(authError),
        });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body: BudgetConfigPayload = await request.json();

      const controller = await createBudgetController();
      const response = await controller.createBudget(user.id, body);

      logger.info("budget_post_completed", {
        userId: user.id,
        durationMs: Math.round(performance.now() - start),
        status: response.status,
      });

      return response;
    },
  );
}

/**
 * PUT /api/budget
 * Updates existing budget configuration with differential updates
 * Handles soft deletes for expenses marked for deletion
 */
export async function PUT(request: Request) {
  const start = performance.now();

  return runWithSpan(
    "api.budget.put",
    { "http.method": "PUT", "http.route": "/api/budget" },
    async () => {
      const supabase = await createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.warn("budget_put_unauthorized", {
          hasAuthError: Boolean(authError),
        });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body: BudgetConfigPayload = await request.json();
      const controller = await createBudgetController();
      const response = await controller.updateBudget(user.id, body);

      logger.info("budget_put_completed", {
        userId: user.id,
        durationMs: Math.round(performance.now() - start),
        status: response.status,
      });

      return response;
    },
  );
}
