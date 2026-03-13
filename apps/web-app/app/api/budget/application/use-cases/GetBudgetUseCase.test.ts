import { ExpenseType } from "@/types/finance";
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
import { GetBudgetUseCase } from "./GetBudgetUseCase";
import { FixedExpense } from "../../domain/entities/BudgetConfig";

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

describe("GetBudgetUseCase", () => {
  let useCase: GetBudgetUseCase;
  let budgetRepo: IBudgetRepository;
  let incomeRepo: IIncomeRepository;
  let expenseRepo: IFixedExpenseRepository;
  let creditCardRepo: ICreditCardRepository;
  let dailyExpenseRepo: IDailyExpenseRepository;
  let installmentExpenseRepo: IInstallmentExpenseRepository;
  let creditCardInvoiceRepo: ICreditCardInvoiceRepository;

  const userId = "user-123";
  const month = 0; // Janeiro
  const year = 2026;

  beforeEach(() => {
    budgetRepo = createMockBudgetRepository();
    incomeRepo = createMockIncomeRepository();
    expenseRepo = createMockExpenseRepository();
    creditCardRepo = createMockCreditCardRepository();
    dailyExpenseRepo = createMockDailyExpenseRepository();
    installmentExpenseRepo = createMockInstallmentExpenseRepository();
    creditCardInvoiceRepo = createMockCreditCardInvoiceRepository();

    useCase = new GetBudgetUseCase(
      budgetRepo,
      incomeRepo,
      expenseRepo,
      creditCardRepo,
      dailyExpenseRepo,
      installmentExpenseRepo,
      creditCardInvoiceRepo,
    );
  });

  describe("Unconfigured month", () => {
    it("should return basic structure with isConfigured=false when there is no configuration", async () => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);

      const result = await useCase.execute({ userId, month, year });

      expect(result.isConfigured).toBe(false);
      expect(result.month).toBe(month);
      expect(result.year).toBe(year);
      expect(result.totalIncome).toBe(0);
      expect(result.dailyBudget).toBe(0);
      expect(result.incomes).toEqual([]);
      expect(result.expenses).toEqual([]);
      expect(result.dailyHistory).toEqual([]);
    });

    it("should check if previous month is configured", async () => {
      const prevMonthConfig = {
        id: "prev-config",
        userId,
        monthId: "202512", // December 2025
        month: 11,
        year: 2025,
        totalIncome: 500000,
        fixedPercent: 40,
        dailyPercent: 50,
        reservePercent: 10,
        remainingDailyBudget: 0,
        startDay: 1,
      };

      vi.mocked(budgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(null) // Mês atual
        .mockResolvedValueOnce(prevMonthConfig); // Mês anterior
      vi.mocked(incomeRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);

      const result = await useCase.execute({ userId, month, year });

      expect(result.isPreviousMonthConfigured).toBe(true);
      expect(budgetRepo.findByUserAndMonth).toHaveBeenCalledTimes(2);
    });

    it("should include available credit cards", async () => {
      const creditCards = [
        {
          id: "card-1",
          userId,
          name: "Nubank",
          dueDay: 10,
          limit: 200000, // R$ 2000.00 em centavos
          color: "#8A05BE",
          active: true,
        },
        {
          id: "card-2",
          userId,
          name: "Inter",
          dueDay: 15,
          limit: 150000,
          color: "#FF7A00",
          active: true,
        },
      ];

      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue(creditCards);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);

      const result = await useCase.execute({ userId, month, year });

      expect(result.creditCards).toHaveLength(2);
      expect(result.creditCards[0]).toEqual({
        id: "card-1",
        name: "Nubank",
        dueDay: 10,
        limit: 200000,
        color: "#8A05BE",
      });
    });

    it("should build wizardInitialData for unconfigured month", async () => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);

      const result = await useCase.execute({ userId, month, year });

      expect(result.wizardInitialData).toBeDefined();
      expect(result.wizardInitialData.incomes).toEqual([]);
      expect(result.wizardInitialData.expenses).toEqual([]);
    });
  });

  describe("Configured month", () => {
    const configuredBudget = {
      id: "budget-123",
      userId,
      monthId: "202601",
      month,
      year,
      totalIncome: 500000, // R$ 5000.00

      fixedPercent: 40,
      dailyPercent: 50,
      reservePercent: 10,
      remainingDailyBudget: 0,
      startDay: 1,
    };

    const incomes = [
      {
        id: "inc-1",
        userId,
        monthId: "202601",
        name: "Salário",
        amount: 500000,
      },
    ];

    const expenses: FixedExpense[] = [
      {
        id: "exp-1",
        userId,
        monthId: "202601",
        name: "Aluguel",
        amount: 150000,
        creditCardId: null,
        isInstallment: false,
        totalInstallments: undefined,
        currentInstallment: undefined,
        installmentExpenseId: null as string | null,
        isMandatory: false,
        dueDay: 5,
      },
      {
        id: "exp-2",
        userId,
        monthId: "202601",
        name: "Internet",
        amount: 10000,
        creditCardId: "card-1",
        isInstallment: false,
        totalInstallments: undefined,
        currentInstallment: undefined,
        installmentExpenseId: null,
        isMandatory: true,
        dueDay: 10,
      },
    ];

    beforeEach(() => {
      vi.mocked(budgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(configuredBudget)
        .mockResolvedValueOnce(null); // Previous month
      vi.mocked(incomeRepo.findByUserAndMonth).mockResolvedValue(incomes);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue(expenses);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);
    });

    it("should return complete configuration with isConfigured=true", async () => {
      const result = await useCase.execute({ userId, month, year });

      expect(result.isConfigured).toBe(true);
      expect(result.id).toBe("budget-123");
      expect(result.totalIncome).toBe(500000);
      expect(result.totalFixed).toBe(200000); // 500000 * 0.40
      expect(result.dailyBudget).toBe(250000); // 500000 * 0.50
      expect(result.reserveAmount).toBe(50000); // 500000 * 0.10
    });

    it("should transform incomes correctly", async () => {
      const result = await useCase.execute({ userId, month, year });

      expect(result.incomes).toHaveLength(1);
      expect(result.incomes[0]).toEqual({
        id: "inc-1",
        name: "Salário",
        amount: 500000,
      });
    });

    it("should transform fixed expenses correctly", async () => {
      const result = await useCase.execute({ userId, month, year });

      expect(result.expenses).toHaveLength(2);
      expect(result.expenses[0]).toMatchObject({
        id: "exp-1",
        name: "Aluguel",
        amount: 150000,
        type: ExpenseType.DISCRETIONARY,
        paid: false,
        dueDay: 5,
      });
      expect(result.expenses[1]).toMatchObject({
        id: "exp-2",
        name: "Internet",
        amount: 10000,
        creditCardId: "card-1",
        type: ExpenseType.MANDATORY,
        dueDay: 10,
      });
    });

    it("should calculate daily history without expenses", async () => {
      const result = await useCase.execute({ userId, month, year });

      expect(result.dailyHistory).toBeDefined();
      expect(result.dailyHistory.length).toBeGreaterThan(0);

      // Verify first day structure
      const firstDay = result.dailyHistory[0];
      expect(firstDay).toHaveProperty("day");
      expect(firstDay).toHaveProperty("limit");
      expect(firstDay).toHaveProperty("spent");
      expect(firstDay).toHaveProperty("cumulativeSpent");
      expect(firstDay).toHaveProperty("breakdown");
    });

    it("should return correct allocation percentages", async () => {
      const result = await useCase.execute({ userId, month, year });

      expect(result.fixedPercent).toBe(40);
      expect(result.dailyPercent).toBe(50);
      expect(result.reservePercent).toBe(10);
    });

    it("should build wizardInitialData for configured month", async () => {
      const result = await useCase.execute({ userId, month, year });

      expect(result.wizardInitialData).toBeDefined();
      expect(result.wizardInitialData.incomes).toHaveLength(1);
      expect(result.wizardInitialData.expenses).toHaveLength(2);
      expect(result.wizardInitialData.allocation).toEqual({
        fixedPercent: 40,
        dailyPercent: 50,
        reservePercent: 10,
      });
    });

    it("should map isMandatory=true to ExpenseType.MANDATORY", async () => {
      const mandatoryExpense: FixedExpense[] = [
        {
          id: "exp-1",
          userId,
          monthId: "202601",
          name: "Aluguel",
          amount: 150000,
          isMandatory: true,
          creditCardId: null as string | null,
          isInstallment: false,
          installmentExpenseId: null as string | null,
          dueDay: 5,
        },
      ];

      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue(
        mandatoryExpense,
      );

      const result = await useCase.execute({ userId, month, year });

      expect(result.expenses).toHaveLength(1);
      expect(result.expenses[0].type).toBe(ExpenseType.MANDATORY);
      expect(result.expenses[0].name).toBe("Aluguel");
      expect(result.expenses[0].dueDay).toBe(5);
    });

    it("should map isMandatory=false to ExpenseType.DISCRETIONARY", async () => {
      const discretionaryExpense: FixedExpense[] = [
        {
          id: "exp-2",
          userId,
          monthId: "202601",
          name: "Netflix",
          amount: 5000,
          isMandatory: false,
          creditCardId: null,
          isInstallment: false,
          installmentExpenseId: null,
          dueDay: 10,
        },
      ];

      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue(
        discretionaryExpense,
      );

      const result = await useCase.execute({ userId, month, year });

      expect(result.expenses).toHaveLength(1);
      expect(result.expenses[0].type).toBe(ExpenseType.DISCRETIONARY);
      expect(result.expenses[0].name).toBe("Netflix");
      expect(result.expenses[0].dueDay).toBe(10);
    });

    it("should handle mixed expense types correctly", async () => {
      const mixedExpenses: FixedExpense[] = [
        {
          id: "exp-1",
          userId,
          monthId: "202601",
          name: "Aluguel",
          amount: 150000,
          isMandatory: true,
          creditCardId: null,
          isInstallment: false,
          installmentExpenseId: null,
          dueDay: 5,
        },
        {
          id: "exp-2",
          userId,
          monthId: "202601",
          name: "Netflix",
          amount: 5000,
          isMandatory: false,
          creditCardId: "card-1",
          isInstallment: false,
          installmentExpenseId: null,
          dueDay: 10,
        },
        {
          id: "exp-3",
          userId,
          monthId: "202601",
          name: "Conta de Luz",
          amount: 20000,
          isMandatory: true,
          creditCardId: null,
          isInstallment: false,
          installmentExpenseId: null,
          dueDay: 15,
        },
      ];

      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue(
        mixedExpenses,
      );

      const result = await useCase.execute({ userId, month, year });

      expect(result.expenses).toHaveLength(3);
      expect(result.expenses[0].type).toBe(ExpenseType.MANDATORY);
      expect(result.expenses[0].name).toBe("Aluguel");
      expect(result.expenses[0].dueDay).toBe(5);
      expect(result.expenses[1].type).toBe(ExpenseType.DISCRETIONARY);
      expect(result.expenses[1].name).toBe("Netflix");
      expect(result.expenses[1].dueDay).toBe(10);
      expect(result.expenses[2].type).toBe(ExpenseType.MANDATORY);
      expect(result.expenses[2].name).toBe("Conta de Luz");
      expect(result.expenses[2].dueDay).toBe(15);
    });
  });

  describe("Financial metrics calculation", () => {
    it("should calculate metrics correctly with daily expenses", async () => {
      const configuredBudget = {
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

      const dailyExpenses = [
        {
          id: "daily-1",
          userId,
          date: "2026-01-15",
          amount: 5000, // R$ 50
          time: "12:00",
          category: "food",
          description: "Almoço",
        },
        {
          id: "daily-2",
          userId,
          date: "2026-01-15",
          amount: 3000, // R$ 30
          time: "16:00",
          category: "food",
          description: "Café",
        },
      ];

      vi.mocked(budgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(configuredBudget)
        .mockResolvedValueOnce(null);
      vi.mocked(incomeRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        dailyExpenses,
      );

      const result = await useCase.execute({ userId, month, year });

      expect(result.isConfigured).toBe(true);
      expect(result.totalSpent).toBeGreaterThan(0);
      expect(result.remainingBalance).toBeDefined();
      expect(result.balanceProgress).toBeDefined();
      expect(result.balanceProgress).toBeGreaterThanOrEqual(0);
      expect(result.balanceProgress).toBeLessThanOrEqual(100);
    });

    it("should calculate initialAvailable and initialLimit correctly", async () => {
      const configuredBudget = {
        id: "budget-123",
        userId,
        monthId: "202601",
        month,
        year,
        totalIncome: 500000, // R$ 5000
        fixedPercent: 40,
        dailyPercent: 50,
        reservePercent: 10,
        remainingDailyBudget: 0,
        startDay: 1,
      };

      vi.mocked(budgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(configuredBudget)
        .mockResolvedValueOnce(null);
      vi.mocked(incomeRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);

      const result = await useCase.execute({ userId, month, year });

      // initialAvailable = dailyBudget (total allocation for daily expenses)
      // = 500000 * 0.50 = 250000 (in cents)
      expect(result.initialAvailable).toBe(250000);

      // idealDailyAverage = adjustedDailyBudget / daysInMonth
      // For Jan/2026: floor(250000 / 31) = 8064
      expect(result.idealDailyAverage).toBe(8064);

      // initialLimit depends on the number of days in the month
      expect(result.initialLimit).toBeGreaterThan(0);
    });

    it("should adjust dailyBudget when there is remainingDailyBudget set", async () => {
      const configuredBudget = {
        id: "budget-123",
        userId,
        monthId: "202601",
        month,
        year,
        totalIncome: 500000,
        fixedPercent: 40,
        dailyPercent: 50,
        reservePercent: 10,
        remainingDailyBudget: 50000, // R$ 500 remaining from initial allocation
        startDay: 5, // Started on day 5
      };

      vi.mocked(budgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(configuredBudget)
        .mockResolvedValueOnce(null);
      vi.mocked(incomeRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);

      const result = await useCase.execute({ userId, month, year });

      expect(result.isConfigured).toBe(true);
      expect(result.remainingDailyBudget).toBe(50000);
      // idealDailyAverage uses adjusted budget even in mid-month setups
      // For Jan/2026: floor(50000 / 31) = 1612
      expect(result.idealDailyAverage).toBe(1612);

      // Daily history should consider the adjustment
      const day5 = result.dailyHistory.find((d) => d.day === 5);
      expect(day5).toBeDefined();
    });
  });

  describe("Partial month (current month, after day 10, unconfigured)", () => {
    it("should detect partial month correctly", async () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Mock current date to be after day 10
      // Use noon UTC to avoid timezone edge cases (America/Sao_Paulo is UTC-3)
      const mockToday = new Date(Date.UTC(currentYear, currentMonth, 15, 12));
      vi.useFakeTimers();
      vi.setSystemTime(mockToday);

      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);

      const result = await useCase.execute({
        userId,
        month: currentMonth,
        year: currentYear,
      });

      expect(result.isPartialMonth).toBe(true);
      expect(result.partialMonthInfo).toBeDefined();

      if (result.partialMonthInfo) {
        expect(result.partialMonthInfo.currentDay).toBe(15);
        expect(result.partialMonthInfo.remainingDays).toBeGreaterThan(0);
      }

      vi.useRealTimers();
    });
  });

  describe("Integration with wizard data", () => {
    it("should include previous month data in wizard when available", async () => {
      const prevMonthConfig = {
        id: "prev-config",
        userId,
        monthId: "202512",
        month: 11,
        year: 2025,
        totalIncome: 500000,
        fixedPercent: 40,
        dailyPercent: 50,
        reservePercent: 10,
        remainingDailyBudget: 0,
        startDay: 1,
      };

      const prevIncomes = [
        {
          id: "inc-prev",
          userId,
          monthId: "202512",
          name: "Salário",
          amount: 500000,
        },
      ];

      const prevExpenses: FixedExpense[] = [
        {
          id: "exp-prev",
          userId,
          monthId: "202512",
          name: "Aluguel",
          amount: 150000,
          creditCardId: null,
          isInstallment: false,
          totalInstallments: undefined,
          currentInstallment: undefined,
          installmentExpenseId: null,
          isMandatory: true,
          dueDay: 10,
        },
      ];

      vi.mocked(budgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(null) // Current month
        .mockResolvedValueOnce(prevMonthConfig); // Previous month
      vi.mocked(incomeRepo.findByUserAndMonth).mockResolvedValue(prevIncomes);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue(prevExpenses);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);

      const result = await useCase.execute({ userId, month, year });

      expect(result.isPreviousMonthConfigured).toBe(true);
      expect(result.wizardInitialData).toBeDefined();
      // Wizard should have suggestions based on previous month
      expect(result.wizardInitialData.incomes.length).toBeGreaterThan(0);
    });
  });

  describe("Input validations", () => {
    it("should handle valid userId", async () => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);

      const result = await useCase.execute({ userId, month, year });

      expect(budgetRepo.findByUserAndMonth).toHaveBeenCalledWith(
        userId,
        expect.any(String),
      );
    });

    it("should calculate monthId correctly", async () => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);

      await useCase.execute({ userId, month: 0, year: 2026 });

      // monthId for January/2026 = 202601
      expect(budgetRepo.findByUserAndMonth).toHaveBeenCalledWith(
        userId,
        "202601",
      );
    });

    it("should fetch correct date range for daily expenses", async () => {
      vi.mocked(budgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce({
          id: "budget-123",
          userId,
          monthId: "202601",
          month: 0,
          year: 2026,
          totalIncome: 100000,
          fixedPercent: 40,
          dailyPercent: 50,
          reservePercent: 10,
          remainingDailyBudget: 0,
          startDay: 1,
        })
        .mockResolvedValueOnce(null);
      vi.mocked(incomeRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(expenseRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(creditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(creditCardInvoiceRepo.findByUserAndMonth).mockResolvedValue([]);
      vi.mocked(
        dailyExpenseRepo.findOpeningBalancesByDueMonth,
      ).mockResolvedValue([]);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);

      await useCase.execute({ userId, month: 0, year: 2026 });

      expect(dailyExpenseRepo.findByUserAndDateRange).toHaveBeenCalledWith(
        userId,
        "2026-01-01",
        "2026-01-31",
      );
    });
  });
});
