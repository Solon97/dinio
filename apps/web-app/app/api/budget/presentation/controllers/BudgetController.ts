import { NextResponse } from "next/server";
import { GetBudgetUseCase } from "../../application/use-cases/GetBudgetUseCase";
import { CreateBudgetUseCase } from "../../application/use-cases/CreateBudgetUseCase";
import { UpdateBudgetUseCase } from "../../application/use-cases/UpdateBudgetUseCase";
import { BudgetConfigPayload } from "@/types/budget";
import {
  IBudgetRepository,
  ICreditCardInvoiceRepository,
  ICreditCardRepository,
  IDailyExpenseRepository,
  IFixedExpenseRepository,
  IIncomeRepository,
  IInstallmentExpenseRepository,
} from "../../domain/repositories/IBudgetRepository";
import { captureServerEvent } from "@/libs/posthogServer";
import { posthogEvents } from "@/libs/posthog";
import { computeMonthId } from "@/libs/monthId";

export class BudgetController {
  constructor(
    private budgetRepository: IBudgetRepository,
    private incomeRepository: IIncomeRepository,
    private expenseRepository: IFixedExpenseRepository,
    private creditCardRepository: ICreditCardRepository,
    private dailyExpenseRepository: IDailyExpenseRepository,
    private installmentExpenseRepository: IInstallmentExpenseRepository,
    private creditCardInvoiceRepository: ICreditCardInvoiceRepository,
  ) {}

  private validatePayload(payload: BudgetConfigPayload): NextResponse | null {
    const invalidCard = payload.creditCards?.find((c) => !c.name?.trim());
    if (invalidCard) {
      return NextResponse.json(
        { error: "Todos os cartões precisam ter um nome." },
        { status: 422 },
      );
    }

    const invalidExpense = payload.expenses
      ?.filter((e) => !e.markedForDeletion)
      .find((e) => !e.name?.trim() || !e.amount || e.amount <= 0);
    if (invalidExpense) {
      return NextResponse.json(
        {
          error:
            "Todos os gastos fixos precisam ter nome e valor maior que zero.",
        },
        { status: 422 },
      );
    }

    return null;
  }

  async getBudget(userId: string, month: number, year: number) {
    try {
      if (isNaN(month) || isNaN(year)) {
        return NextResponse.json(
          { error: "Month and year are required" },
          { status: 400 },
        );
      }

      const useCase = new GetBudgetUseCase(
        this.budgetRepository,
        this.incomeRepository,
        this.expenseRepository,
        this.creditCardRepository,
        this.dailyExpenseRepository,
        this.installmentExpenseRepository,
        this.creditCardInvoiceRepository,
      );

      const result = await useCase.execute({ userId, month, year });
      return NextResponse.json(result);
    } catch (error) {
      console.error("Budget GET error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  }

  async createBudget(userId: string, payload: BudgetConfigPayload) {
    const start = performance.now();
    try {
      const {
        month,
        year,
        incomes,
        expenses,
        creditCards,
        allocation,
        targetRemaining,
        invoiceOpeningBalances,
      } = payload;

      if (month === undefined || year === undefined) {
        return NextResponse.json(
          { error: "Month and year are required" },
          { status: 400 },
        );
      }

      const validationError = this.validatePayload(payload);
      if (validationError) return validationError;

      const useCase = new CreateBudgetUseCase(
        this.budgetRepository,
        this.incomeRepository,
        this.expenseRepository,
        this.creditCardRepository,
        this.dailyExpenseRepository,
        this.installmentExpenseRepository,
        this.creditCardInvoiceRepository,
      );

      const result = await useCase.execute(
        {
          userId,
          month,
          year,
          incomes,
          expenses,
          creditCards,
          allocation,
          targetRemaining,
          invoiceOpeningBalances,
        },
        { responseMode: "full" },
      );

      console.info("[budget][controller] create-budget", {
        userId,
        month,
        year,
        durationMs: Math.round(performance.now() - start),
        created: result.created,
      });

      if (result.created) {
        const activeExpenses =
          expenses?.filter((e) => !e.markedForDeletion) ?? [];
        captureServerEvent(userId, posthogEvents.ONBOARDING_COMPLETED, {
          month_id: String(computeMonthId(year, month)),
          has_fixed_expenses: activeExpenses.length > 0,
          reserve_percentage: allocation.reservePercent,
        }).catch((e) =>
          console.error("[posthog] onboarding_completed error:", e),
        );
      }

      return NextResponse.json(result.response, {
        status: result.created ? 201 : 200,
      });
    } catch (error) {
      console.error("Budget POST error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  }

  async updateBudget(userId: string, payload: BudgetConfigPayload) {
    try {
      const {
        month,
        year,
        incomes,
        expenses,
        creditCards,
        allocation,
        targetRemaining,
        invoiceOpeningBalances,
      } = payload;

      if (month === undefined || year === undefined) {
        return NextResponse.json(
          { error: "Month and year are required" },
          { status: 400 },
        );
      }

      const validationError = this.validatePayload(payload);
      if (validationError) return validationError;

      const useCase = new UpdateBudgetUseCase(
        this.budgetRepository,
        this.incomeRepository,
        this.expenseRepository,
        this.creditCardRepository,
        this.dailyExpenseRepository,
        this.installmentExpenseRepository,
        this.creditCardInvoiceRepository,
      );

      const result = await useCase.execute({
        userId,
        month,
        year,
        incomes,
        expenses,
        creditCards,
        allocation,
        targetRemaining,
        invoiceOpeningBalances,
      });

      return NextResponse.json(result);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Budget configuration not found"
      ) {
        return NextResponse.json(
          { error: "Budget configuration not found. Use POST to create." },
          { status: 404 },
        );
      }

      console.error("Budget PUT error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  }
}
