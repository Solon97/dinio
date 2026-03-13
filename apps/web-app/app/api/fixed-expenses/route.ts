import { createClient } from "@/libs/supabase/server";
import { computeMonthId } from "@/libs/monthId";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRepositories } from "@/app/api/budget/infrastructure/repositories/supabase";
import { InstallmentExpenseService } from "@/app/api/budget/application/services/InstallmentExpenseService";
import { ExpenseType, FixedExpense } from "@/types/finance";

const VALID_EXPENSE_TYPES = [
  ExpenseType.MANDATORY,
  ExpenseType.DISCRETIONARY,
] as const;

const createFixedExpenseSchema = z
  .object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(120, "Name must be at most 120 characters"),
    amount: z
      .number()
      .positive("Amount must be positive")
      .max(99999999, "Amount exceeds maximum of R$ 999.999,99"),
    dueDay: z.number().min(1).max(31).optional(),
    type: z.enum(VALID_EXPENSE_TYPES).default(ExpenseType.DISCRETIONARY),
    creditCardId: z.string().uuid().optional(),
    invoiceDueMonthId: z.number().int().positive().optional(),
    isInstallment: z.boolean().default(false),
    totalInstallments: z.number().min(2).max(48).optional(),
    startInstallment: z.number().min(1).optional(),
    targetMonthId: z
      .number()
      .int()
      .positive("Target month is required")
      .refine((v) => {
        const year = Math.floor(v / 100);
        const month = v % 100;
        return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
      }, "Target month must be a valid YYYYMM date"),
    isRefundable: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.isInstallment && !data.totalInstallments) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total de parcelas é obrigatório para parcelamentos",
        path: ["totalInstallments"],
      });
    }
    if (
      data.isInstallment &&
      data.totalInstallments &&
      data.startInstallment &&
      data.startInstallment > data.totalInstallments
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Parcela inicial não pode ser maior que o total de parcelas",
        path: ["startInstallment"],
      });
    }
  });

/**
 * POST /api/fixed-expenses
 * Creates a fixed expense (or installment) for a future month
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
    const validation = createFixedExpenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const payload = validation.data;

    // Validate: target month must be >= next month
    const now = new Date();
    const currentMonthId = computeMonthId(now.getFullYear(), now.getMonth());
    if (payload.targetMonthId <= currentMonthId) {
      return NextResponse.json(
        {
          error:
            "Gastos fixos só podem ser criados a partir do próximo mês. Configure o mês atual no wizard de configuração.",
        },
        { status: 400 },
      );
    }

    // Validate installment fields consistency
    if (payload.isInstallment && !payload.totalInstallments) {
      return NextResponse.json(
        { error: "Total de parcelas é obrigatório para parcelamentos" },
        { status: 400 },
      );
    }

    const repositories = await createRepositories();

    // If credit card specified, validate it exists and belongs to user
    if (payload.creditCardId) {
      const card = await repositories.creditCardRepository.findById(
        payload.creditCardId,
        user.id,
      );
      if (!card) {
        return NextResponse.json(
          { error: "Cartão de crédito não encontrado" },
          { status: 404 },
        );
      }
    }

    if (payload.isInstallment && payload.totalInstallments) {
      // Create installment expense using existing service
      const installmentService = new InstallmentExpenseService(
        repositories.installmentExpenseRepository,
        repositories.expenseRepository,
      );

      const fixedExpense: FixedExpense = {
        name: payload.name,
        amount: payload.amount,
        dueDay: payload.dueDay || 1,
        type: payload.type,
        creditCardId: payload.creditCardId,
        invoiceDueMonthId: payload.invoiceDueMonthId,
        isInstallment: true,
        totalInstallments: payload.totalInstallments,
        startInstallment: payload.startInstallment || 1,
        paid: false,
        isRefundable: payload.isRefundable,
      };

      await installmentService.processInstallmentExpenses(
        user.id,
        String(payload.targetMonthId),
        [fixedExpense],
      );

      return NextResponse.json(
        { message: "Parcelamento criado com sucesso" },
        { status: 201 },
      );
    }

    // Create single fixed expense
    await repositories.expenseRepository.bulkCreate([
      {
        userId: user.id,
        monthId: String(payload.targetMonthId),
        name: payload.name,
        amount: payload.amount,
        dueDay: payload.dueDay || 1,
        isMandatory: payload.type === ExpenseType.MANDATORY,
        creditCardId: payload.creditCardId || null,
        invoiceDueMonthId: payload.invoiceDueMonthId ?? null,
        isRefundable: payload.isRefundable,
      },
    ]);

    return NextResponse.json(
      { message: "Gasto fixo criado com sucesso" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Fixed expenses POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
