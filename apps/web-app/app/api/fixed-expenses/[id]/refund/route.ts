import { RecalibrateBudgetAfterRefundUseCase } from "@/app/api/budget/application/use-cases/RecalibrateBudgetAfterRefundUseCase";
import { createRepositories } from "@/app/api/budget/infrastructure/repositories/supabase";
import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/fixed-expenses/:id/refund
 *
 * Two-step flow:
 *   1. User marks expense as paid (PATCH /fixed-expenses/:id  { isPaid: true })
 *   2. User marks the refund as received (this endpoint)
 *
 * When called:
 *   - Validates that the expense is refundable and has not been refunded yet.
 *   - Creates a new income entry in the expense's original month.
 *   - Links the created income to the fixed expense via refund_income_id.
 *   - Returns the created income and updated expense.
 *
 * Idempotency: if refund_income_id is already set, returns 409 with existing data.
 */
export async function POST(
  _request: Request,
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
    const { budgetRepository, expenseRepository, incomeRepository } =
      await createRepositories();

    const expense = await expenseRepository.findById(id, user.id);

    if (!expense) {
      return NextResponse.json(
        { error: "Gasto fixo não encontrado" },
        { status: 404 },
      );
    }

    if (!expense.isRefundable) {
      return NextResponse.json(
        { error: "Este gasto fixo não é reembolsável" },
        { status: 422 },
      );
    }

    if (expense.refundIncomeId) {
      return NextResponse.json(
        {
          error: "Este gasto já foi reembolsado",
          refundIncomeId: expense.refundIncomeId,
        },
        { status: 409 },
      );
    }

    // Create income in the expense's original month
    const income = await incomeRepository.create({
      userId: user.id,
      monthId: expense.monthId!,
      name: `Reembolso: ${expense.name}`,
      amount: expense.amount,
    });

    // Link income to the fixed expense
    await expenseRepository.setRefundIncomeId(id, user.id, income.id!);

    // Recalibrate budget percentages to reflect the new total income.
    // Runs best-effort — a failure must not roll back the already-created income.
    try {
      const recalibrateUseCase = new RecalibrateBudgetAfterRefundUseCase(
        budgetRepository,
      );
      await recalibrateUseCase.execute({
        userId: user.id,
        monthId: String(expense.monthId!),
        refundAmountCents: expense.amount,
      });
    } catch (recalibrationError) {
      console.error(
        "Budget recalibration after refund failed (non-fatal):",
        recalibrationError,
      );
    }

    return NextResponse.json(
      {
        message: "Reembolso registrado com sucesso",
        refundIncomeId: income.id,
        income: {
          id: income.id,
          name: income.name,
          amount: income.amount,
          monthId: income.monthId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Fixed expense refund POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
