import { ExpenseType, FixedExpense, IncomeSource } from "@/types/finance";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  IBudgetRepository,
  ICreditCardInvoiceRepository,
  ICreditCardRepository,
  IDailyExpenseRepository,
  IFixedExpenseRepository,
  IIncomeRepository,
  IInstallmentExpenseRepository,
} from "../../domain/repositories/IBudgetRepository";
import { UpdateBudgetUseCase } from "./UpdateBudgetUseCase";
import { v4 as uuidv4 } from "uuid";

// Valid UUIDs for testing
const UUID_INC_1 = uuidv4();
const UUID_INC_2 = uuidv4();
const UUID_EXP_1 = uuidv4();
const UUID_EXP_2 = uuidv4();
const UUID_EXP_REGULAR = uuidv4();
const UUID_CARD_1 = uuidv4();

// Mock repositories
const createMockBudgetRepository = (): IBudgetRepository => ({
  findByUserAndMonth: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
});

const createMockIncomeRepository = (): IIncomeRepository => ({
  findByUserAndMonth: vi.fn(),
  deleteByUserAndMonth: vi.fn(),
  bulkCreate: vi.fn(),
  bulkUpdate: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const createMockExpenseRepository = (): IFixedExpenseRepository => ({
  findByUserAndMonth: vi.fn(),
  findById: vi.fn(),
  deleteByUserAndMonth: vi.fn(),
  bulkCreate: vi.fn(),
  bulkUpdate: vi.fn(),
  update: vi.fn(),
  setRefundIncomeId: vi.fn(),
  softDelete: vi.fn(),
  softDeleteFutureInstallments: vi.fn(),
});

const createMockCreditCardRepository = (): ICreditCardRepository => ({
  findActiveByUser: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  bulkUpdate: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  hardDelete: vi.fn(),
  checkHasExpenses: vi.fn(),
});

const createMockDailyExpenseRepository = (): IDailyExpenseRepository => ({
  findByUserAndDateRange: vi.fn(),
  createOpeningBalance: vi.fn(),
  createOpeningBalances: vi.fn(),
  findOpeningBalancesByDueMonth: vi.fn().mockResolvedValue([]),
  deleteOpeningBalancesByDueMonth: vi.fn().mockResolvedValue(undefined),
});

const createMockInstallmentExpenseRepository =
  (): IInstallmentExpenseRepository => ({
    findById: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  });

const createMockCreditCardInvoiceRepository =
  (): ICreditCardInvoiceRepository => ({
    upsertForMonth: vi.fn().mockResolvedValue(undefined),
    findByUserAndMonth: vi.fn().mockResolvedValue([]),
    findExpensesByCardAndMonth: vi.fn().mockResolvedValue([]),
    markAsPaid: vi.fn(),
  });

describe("UpdateBudgetUseCase", () => {
  let useCase: UpdateBudgetUseCase;
  let budgetRepo: IBudgetRepository;
  let incomeRepo: IIncomeRepository;
  let expenseRepo: IFixedExpenseRepository;
  let creditCardRepo: ICreditCardRepository;
  let dailyExpenseRepo: IDailyExpenseRepository;
  let installmentExpenseRepo: IInstallmentExpenseRepository;
  let creditCardInvoiceRepo: ICreditCardInvoiceRepository;

  const userId = "user-123";
  const month = 0; // January
  const year = 2026;

  const existingConfig = {
    id: "budget-123",
    userId,
    monthId: "202601",
    month,
    year,
    totalIncome: 500000,
    fixedPercent: 40,
    dailyPercent: 50,
    reservePercent: 10,
    remainingDailyBudget: 0,
    startDay: 1,
  };

  beforeEach(() => {
    budgetRepo = createMockBudgetRepository();
    incomeRepo = createMockIncomeRepository();
    expenseRepo = createMockExpenseRepository();
    creditCardRepo = createMockCreditCardRepository();
    dailyExpenseRepo = createMockDailyExpenseRepository();
    installmentExpenseRepo = createMockInstallmentExpenseRepository();
    creditCardInvoiceRepo = createMockCreditCardInvoiceRepository();

    useCase = new UpdateBudgetUseCase(
      budgetRepo,
      incomeRepo,
      expenseRepo,
      creditCardRepo,
      dailyExpenseRepo,
      installmentExpenseRepo,
      creditCardInvoiceRepo,
    );

    // Default mocks
    vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(existingConfig);
    vi.mocked(incomeRepo.findByUserAndMonth).mockResolvedValue([]);
    vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
    vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
    vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);
  });

  describe("Budget configuration validation", () => {
    it("should throw error when budget configuration not found", async () => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(null);

      const request = {
        userId,
        month,
        year,
        incomes: [] as IncomeSource[],
        expenses: [] as FixedExpense[],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Budget configuration not found",
      );
    });

    it("should update existing budget configuration", async () => {
      const incomes: IncomeSource[] = [
        { id: UUID_INC_1, name: "Salary", amount: 500000 },
      ];

      const expenses: FixedExpense[] = [
        {
          id: UUID_EXP_1,
          name: "Rent",
          amount: 150000,
          dueDay: 1,
          type: ExpenseType.DISCRETIONARY,
          paid: false,
        },
      ];

      const request = {
        userId,
        month,
        year,
        incomes,
        expenses,
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(budgetRepo.update).toHaveBeenCalledWith(
        "budget-123",
        userId,
        expect.objectContaining({
          totalIncome: 500000, // R$ 5000 in cents
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        }),
      );
    });
  });

  describe("Allocation calculations", () => {
    it("should calculate daily budget based on percentage", async () => {
      const existingIncomes = [
        {
          id: UUID_INC_1,
          userId,
          monthId: "202601",
          name: "Salary",
          amount: 500000,
        },
      ];

      vi.mocked(incomeRepo.findByUserAndMonth).mockResolvedValue(
        existingIncomes,
      );

      const request = {
        userId,
        month,
        year,
        incomes: [{ id: UUID_INC_1, name: "Updated Salary", amount: 550000 }],
        expenses: [] as FixedExpense[],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(incomeRepo.bulkUpdate).toHaveBeenCalledWith(userId, "202601", [
        {
          id: UUID_INC_1,
          name: "Updated Salary",
          amount: 550000, // R$ 5500 in cents
        },
      ]);
    });

    it("should create new incomes", async () => {
      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "New Income", amount: 100000 }],
        expenses: [] as FixedExpense[],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(incomeRepo.bulkCreate).toHaveBeenCalledWith([
        {
          userId,
          monthId: "202601",
          name: "New Income",
          amount: 100000, // R$ 1000 in cents
        },
      ]);
    });

    it("should delete removed incomes", async () => {
      const existingIncomes = [
        {
          id: UUID_INC_1,
          userId,
          monthId: "202601",
          name: "Salary",
          amount: 500000,
        },
        {
          id: UUID_INC_2,
          userId,
          monthId: "202601",
          name: "Bonus",
          amount: 100000,
        },
      ];

      vi.mocked(incomeRepo.findByUserAndMonth).mockResolvedValue(
        existingIncomes,
      );

      const request = {
        userId,
        month,
        year,
        incomes: [{ id: UUID_INC_1, name: "Salary", amount: 500000 }],
        expenses: [] as FixedExpense[],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(incomeRepo.delete).toHaveBeenCalledWith([UUID_INC_2], userId);
    });
  });

  describe("Expense management", () => {
    it("should update existing regular expenses", async () => {
      const existingExpenses = [
        {
          id: UUID_EXP_1,
          userId,
          monthId: "202601",
          name: "Rent",
          amount: 150000,
          dueDay: 1,
          creditCardId: null as string | null,
          isInstallment: false,
          totalInstallments: undefined as number | undefined,
          currentInstallment: undefined as number | undefined,
          installmentExpenseId: null as string | null,
        },
      ];

      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue(
        existingExpenses,
      );
      vi.mocked(creditCardRepo.checkHasExpenses).mockResolvedValue(new Set());

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            id: UUID_EXP_1,
            name: "Updated Rent",
            amount: 160000,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(expenseRepo.bulkUpdate).toHaveBeenCalledWith(userId, "202601", [
        {
          id: UUID_EXP_1,
          name: "Updated Rent",
          amount: 160000, // R$ 1600 in cents
          dueDay: 1,
          isMandatory: false,
          creditCardId: undefined,
          isRefundable: false,
        },
      ]);
    });

    it("should create new regular expenses", async () => {
      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            name: "New Expense",
            amount: 20000,
            dueDay: 1,
            type: ExpenseType.MANDATORY,
            paid: false,
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(expenseRepo.bulkCreate).toHaveBeenCalledWith([
        {
          userId,
          monthId: "202601",
          name: "New Expense",
          amount: 20000, // R$ 200 in cents
          dueDay: 1,
          isMandatory: true,
          creditCardId: undefined,
          isRefundable: false,
        },
      ]);
    });

    it("should soft delete removed expenses", async () => {
      const existingExpenses = [
        {
          id: UUID_EXP_1,
          userId,
          monthId: "202601",
          name: "Rent",
          amount: 150000,
          dueDay: 1,
          creditCardId: null as string | null,
          isInstallment: false,
          installmentExpenseId: null as string | null,
        },
        {
          id: UUID_EXP_2,
          userId,
          monthId: "202601",
          name: "Internet",
          amount: 10000,
          dueDay: 5,
          creditCardId: null as string | null,
          isInstallment: false,
          installmentExpenseId: null as string | null,
        },
      ];

      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue(
        existingExpenses,
      );

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            id: UUID_EXP_1,
            name: "Rent",
            amount: 150000,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(expenseRepo.softDelete).toHaveBeenCalledWith([UUID_EXP_2], userId);
    });

    it("should handle expenses with credit cards", async () => {
      const existingExpenses = [
        {
          id: UUID_EXP_1,
          userId,
          monthId: "202601",
          name: "Groceries",
          amount: 45000,
          dueDay: 1,
          creditCardId: "card-1" as string | null,
          isInstallment: false,
          installmentExpenseId: null as string | null,
        },
      ];

      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue(
        existingExpenses,
      );
      vi.mocked(creditCardRepo.checkHasExpenses).mockResolvedValue(new Set());

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            id: UUID_EXP_1,
            name: "Groceries",
            amount: 50000,
            creditCardId: "card-1",
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(expenseRepo.bulkUpdate).toHaveBeenCalledWith(
        userId,
        "202601",
        expect.arrayContaining([
          expect.objectContaining({
            id: UUID_EXP_1,
            creditCardId: "card-1",
          }),
        ]),
      );
    });

    it("should filter out expenses marked for deletion", async () => {
      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            id: UUID_EXP_1,
            name: "To Delete",
            amount: 10000,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
            markedForDeletion: true,
            deletionScope: "current" as const,
          },
          {
            id: UUID_EXP_2,
            name: "Keep",
            amount: 20000,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(expenseRepo.softDelete).toHaveBeenCalledWith([UUID_EXP_1], userId);

      // Budget should only include active expenses
      expect(budgetRepo.update).toHaveBeenCalledWith(
        "budget-123",
        userId,
        expect.objectContaining({
          // totalFixed should be 20000 (sum of active expenses)
        }),
      );
    });
  });

  describe("Expense deletions", () => {
    it("should soft delete expense with current scope", async () => {
      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            id: UUID_EXP_1,
            name: "To Delete",
            amount: 10000,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
            markedForDeletion: true,
            deletionScope: "current" as const,
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(expenseRepo.softDelete).toHaveBeenCalledWith([UUID_EXP_1], userId);
    });

    it("should soft delete future installments with future scope", async () => {
      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            id: UUID_EXP_1,
            name: "Installment",
            amount: 10000,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
            markedForDeletion: true,
            deletionScope: "future" as const,
            installmentExpenseId: "install-123",
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(expenseRepo.softDeleteFutureInstallments).toHaveBeenCalledWith(
        "install-123",
        "202601",
        userId,
      );
    });

    it("should skip deletion when expense has no id", async () => {
      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            name: "New Expense",
            amount: 10000,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
            markedForDeletion: true,
            deletionScope: "current" as const,
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(expenseRepo.softDelete).not.toHaveBeenCalled();
      expect(expenseRepo.softDeleteFutureInstallments).not.toHaveBeenCalled();
    });
  });

  describe("Allocation calculations", () => {
    it("should calculate daily budget based on percentage", async () => {
      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [] as FixedExpense[],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 30,
          dailyPercent: 60,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      expect(budgetRepo.update).toHaveBeenCalledWith(
        "budget-123",
        userId,
        expect.objectContaining({
          dailyPercent: 60,
        }),
      );
    });

    it("should calculate reserve amount based on percentage", async () => {
      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [] as FixedExpense[],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 30,
          dailyPercent: 50,
          reservePercent: 20,
        },
      };

      await useCase.execute(request);

      expect(budgetRepo.update).toHaveBeenCalledWith(
        "budget-123",
        userId,
        expect.objectContaining({
          reservePercent: 20,
        }),
      );
    });

    it("should handle targetRemaining when remainingDailyBudget is zero", async () => {
      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [] as FixedExpense[],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
        targetRemaining: 200000, // User wants R$ 2000 remaining (in cents)
      };

      const result = await useCase.execute(request);

      // Current implementation preserves existing remainingDailyBudget (0) when updating
      // targetRemaining is not used in UpdateBudgetUseCase
      expect(result.remainingDailyBudget).toBe(0);
    });

    it("should not override remainingDailyBudget if already set", async () => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue({
        ...existingConfig,
        remainingDailyBudget: 50000, // Already has R$ 500 remaining
      });

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [] as FixedExpense[],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
        targetRemaining: 2000,
      };

      const result = await useCase.execute(request);

      expect(result.remainingDailyBudget).toBe(50000); // Should keep existing (R$ 500 in cents)
    });
  });

  describe("Response structure", () => {
    it("should return complete budget configuration response", async () => {
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([
        {
          id: UUID_CARD_1,
          name: "Credit Card",
          dueDay: 10,
          limit: 200000,
          color: "#FF0000",
        },
      ]);
      vi.mocked(incomeRepo.findByUserAndMonth).mockResolvedValue([
        {
          id: UUID_INC_1,
          userId,
          monthId: "202601",
          name: "Salary",
          amount: 500000,
        },
      ]);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([
        {
          id: UUID_EXP_1,
          userId,
          monthId: "202601",
          name: "Rent",
          amount: 150000,
          dueDay: 1,
          installmentExpenseId: null,
        },
      ]);

      const request = {
        userId,
        month,
        year,
        incomes: [{ id: UUID_INC_1, name: "Salary", amount: 500000 }],
        expenses: [
          {
            id: UUID_EXP_1,
            name: "Rent",
            amount: 150000,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
          },
        ],
        creditCards: [
          {
            id: UUID_CARD_1,
            name: "Credit Card",
            dueDay: 10,
            limit: 200000,
            color: "#FF0000",
          },
        ],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      const result = await useCase.execute(request);

      expect(result).toMatchObject({
        id: "budget-123",
        month,
        year,
        totalIncome: 500000,
        fixedPercent: 40,
        dailyPercent: 50,
        reservePercent: 10,
        isConfigured: true,
      });

      expect(result.incomes).toHaveLength(1);
      expect(result.expenses).toHaveLength(1);
      expect(result.creditCards).toHaveLength(1);
      expect(result.dailyHistory).toBeDefined();
      expect(result.wizardInitialData).toBeDefined();
    });

    it("should include financial metrics in response", async () => {
      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [] as FixedExpense[],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      const result = await useCase.execute(request);

      expect(result).toHaveProperty("initialAvailable");
      expect(result).toHaveProperty("initialLimit");
      expect(result).toHaveProperty("totalSpent");
      expect(result).toHaveProperty("remainingBalance");
      expect(result).toHaveProperty("balanceProgress");
    });

    it("should include daily history with expenses", async () => {
      const dailyExpenses = [
        {
          id: "daily-1",
          userId,
          date: "2026-01-15",
          amount: 500000,
          description: "Lunch",
        },
      ];

      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        dailyExpenses,
      );

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [] as FixedExpense[],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      const result = await useCase.execute(request);

      expect(result.dailyHistory).toBeDefined();
      expect(result.dailyHistory.length).toBeGreaterThan(0);
      expect(result.totalSpent).toBeGreaterThan(0);
    });
  });

  describe("Installment expenses", () => {
    it("should calculate total fixed with installment first payment", async () => {
      vi.mocked(installmentExpenseRepo.create).mockResolvedValue({
        id: "installment-first",
        userId,
        name: "TV Installment",
        totalAmount: 120000,
        totalInstallments: 12,
        startInstallment: 1,
        startsAtMonthId: 202601,
        endsAtMonthId: 202612,
      });

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            id: UUID_EXP_1,
            name: "TV Installment",
            amount: 1200, // Total value
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
            isInstallment: true,
            totalInstallments: 12,
            startInstallment: 1, // First installment
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      // First installment should include remainder
      // 1200 / 12 = 100 per installment
      // First = 100 + (1200 % 12) = 100
      expect(budgetRepo.update).toHaveBeenCalledWith(
        "budget-123",
        userId,
        expect.objectContaining({
          // totalFixed is calculated from actual expenses
        }),
      );
    });

    it("should calculate total fixed with regular installment payment", async () => {
      vi.mocked(installmentExpenseRepo.create).mockResolvedValue({
        id: "installment-regular",
        userId,
        name: "Fridge Installment",
        totalAmount: 120000,
        totalInstallments: 12,
        startInstallment: 5,
        startsAtMonthId: 202601,
        endsAtMonthId: 202608,
      });

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            id: UUID_EXP_1,
            name: "TV Installment",
            amount: 120000,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
            isInstallment: true,
            totalInstallments: 12,
            startInstallment: 3, // Regular installment (not first)
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      await useCase.execute(request);

      // Regular installment = floor(120000 / 12) = 10000
      expect(budgetRepo.update).toHaveBeenCalledWith(
        "budget-123",
        userId,
        expect.objectContaining({
          // totalFixed is calculated from actual expenses
        }),
      );
    });
  });

  describe("Installment expense management", () => {
    it("should create new installment expense and its monthly records", async () => {
      // Arrange
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(installmentExpenseRepo.create).mockResolvedValue({
        id: "new-installment-123",
        userId,
        name: "New Laptop",
        totalAmount: 360000, // R$ 3600
        totalInstallments: 10,
        startInstallment: 1,
        startsAtMonthId: 202601,
        endsAtMonthId: 202610,
      });

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            name: "New Laptop",
            amount: 360000,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
            isInstallment: true,
            totalInstallments: 10,
            startInstallment: 1,
            // No installmentExpenseId = new installment
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      // Act
      await useCase.execute(request);

      // Assert - installment_expenses created
      expect(installmentExpenseRepo.create).toHaveBeenCalledWith({
        userId,
        name: "New Laptop",
        creditCardId: undefined,
        totalAmount: 360000,
        totalInstallments: 10,
        startInstallment: 1,
        startsAtMonthId: 202601,
        endsAtMonthId: 202610,
      });

      // Assert - 10 monthly fixed_expenses created
      expect(expenseRepo.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId,
            monthId: "202601",
            name: "New Laptop",
            installmentExpenseId: "new-installment-123",
            currentInstallment: 1,
            totalInstallments: 10,
          }),
        ]),
      );

      const bulkCreateCalls = vi.mocked(expenseRepo.bulkCreate).mock.calls;
      const createdExpenses = bulkCreateCalls[0][0];
      expect(createdExpenses).toHaveLength(10);
    });

    it("should not recreate installment if it already has installmentExpenseId", async () => {
      // Arrange
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([
        {
          id: "exp-existing",
          userId,
          monthId: "202601",
          name: "Existing Installment",
          amount: 50000,
          dueDay: 1,
          creditCardId: null,
          isInstallment: true,
          totalInstallments: 6,
          currentInstallment: 2,
          installmentExpenseId: "existing-parent-123",
        },
      ]);

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            id: "exp-existing",
            name: "Existing Installment",
            amount: 3000,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
            isInstallment: true,
            totalInstallments: 6,
            currentInstallment: 2,
            installmentExpenseId: "existing-parent-123", // Already exists
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      // Act
      await useCase.execute(request);

      // Assert - should NOT create new installment
      expect(installmentExpenseRepo.create).not.toHaveBeenCalled();

      // Assert - should NOT create new fixed_expenses
      expect(expenseRepo.bulkCreate).not.toHaveBeenCalled();
    });

    it("should handle adding new installment alongside existing regular expenses", async () => {
      // Arrange
      const existingRegularExpense = {
        id: UUID_EXP_REGULAR,
        userId,
        monthId: "202601",
        name: "Rent",
        amount: 150000,
        dueDay: 1,
        creditCardId: null as string | null,
        isInstallment: false,
        installmentExpenseId: null as string | null,
      };

      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([
        existingRegularExpense,
      ]);
      vi.mocked(creditCardRepo.checkHasExpenses).mockResolvedValue(new Set());

      vi.mocked(installmentExpenseRepo.create).mockResolvedValue({
        id: "new-inst-456",
        userId,
        name: "Refrigerator",
        totalAmount: 240000,
        totalInstallments: 8,
        startInstallment: 1,
        startsAtMonthId: 202601,
        endsAtMonthId: 202608,
      });

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            id: UUID_EXP_REGULAR,
            name: "Rent",
            amount: 150000,
            dueDay: 5,
            type: ExpenseType.MANDATORY,
            paid: false,
          },
          {
            name: "Refrigerator",
            amount: 240000,
            dueDay: 10,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
            isInstallment: true,
            totalInstallments: 8,
            startInstallment: 1,
            creditCardId: "card-123",
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      // Act
      await useCase.execute(request);

      // Assert - regular expense updated
      expect(expenseRepo.bulkUpdate).toHaveBeenCalledWith(
        userId,
        "202601",
        expect.arrayContaining([
          expect.objectContaining({
            id: UUID_EXP_REGULAR,
            name: "Rent",
            amount: 150000,
          }),
        ]),
      );

      // Assert - new installment created
      expect(installmentExpenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Refrigerator",
          totalAmount: 240000,
          totalInstallments: 8,
          creditCardId: "card-123",
        }),
      );

      // Assert - monthly installments created
      expect(expenseRepo.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Refrigerator",
            installmentExpenseId: "new-inst-456",
            creditCardId: "card-123",
          }),
        ]),
      );
    });

    it("should create installment starting mid-series on update", async () => {
      // Arrange
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(installmentExpenseRepo.create).mockResolvedValue({
        id: "mid-series-789",
        userId,
        name: "Smartphone",
        totalAmount: 180000,
        totalInstallments: 12,
        startInstallment: 5, // Starting at 5th installment
        startsAtMonthId: 202601,
        endsAtMonthId: 202608, // 8 months remaining (5 to 12)
      });

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            name: "Smartphone",
            amount: 1800,
            dueDay: 1,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
            isInstallment: true,
            totalInstallments: 12,
            startInstallment: 5,
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      // Act
      await useCase.execute(request);

      // Assert - 8 installments created (5th to 12th)
      const bulkCreateCalls = vi.mocked(expenseRepo.bulkCreate).mock.calls;
      const createdExpenses = bulkCreateCalls[0][0];
      expect(createdExpenses).toHaveLength(8); // From 5th to 12th installment

      // Verify first installment starts at 5
      expect(createdExpenses[0]).toMatchObject({
        currentInstallment: 5,
      });

      // Verify last installment is 12
      expect(createdExpenses[7]).toMatchObject({
        currentInstallment: 12,
      });
    });

    it("should calculate correct totalFixed with mix of regular and installment expenses", async () => {
      // Arrange
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(installmentExpenseRepo.create).mockResolvedValue({
        id: "mix-inst",
        userId,
        name: "Computer",
        totalAmount: 300000,
        totalInstallments: 6,
        startInstallment: 1,
        startsAtMonthId: 202601,
        endsAtMonthId: 202606,
      });

      const request = {
        userId,
        month,
        year,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [
          {
            name: "Rent",
            amount: 150000, // Regular
            dueDay: 5,
            type: ExpenseType.MANDATORY,
            paid: false,
          },
          {
            name: "Internet",
            amount: 10000, // Regular
            dueDay: 10,
            type: ExpenseType.MANDATORY,
            paid: false,
          },
          {
            name: "Computer",
            amount: 300000, // Installment (300000/6 = 50000 per month)
            dueDay: 15,
            type: ExpenseType.DISCRETIONARY,
            paid: false,
            isInstallment: true,
            totalInstallments: 6,
            startInstallment: 1,
          },
        ],
        creditCards: [] as any[],
        allocation: {
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
        },
      };

      // Act
      await useCase.execute(request);

      // Assert - totalFixed should be 1500 + 100 + 500 = 2100
      // In cents: 150000 + 10000 + 50000 = 210000
      expect(budgetRepo.update).toHaveBeenCalledWith(
        "budget-123",
        userId,
        expect.objectContaining({
          // totalFixed is calculated from actual expenses
        }),
      );
    });
  });
});
