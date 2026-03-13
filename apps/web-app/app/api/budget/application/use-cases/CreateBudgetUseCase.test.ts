import { FixedExpense, IncomeSource } from "@/types/finance";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BudgetConfig,
  CreditCard,
  DailyExpense,
} from "../../domain/entities/BudgetConfig";
import {
  IBudgetRepository,
  ICreditCardInvoiceRepository,
  ICreditCardRepository,
  IDailyExpenseRepository,
  IFixedExpenseRepository,
  IIncomeRepository,
  IInstallmentExpenseRepository,
} from "../../domain/repositories/IBudgetRepository";
import { CreateBudgetUseCase } from "./CreateBudgetUseCase";
import { v4 as uuidv4 } from "uuid";

// Valid UUIDs for testing
const UUID_CARD_EXISTING = uuidv4();
const UUID_CARD_EXISTING_123 = uuidv4();
const UUID_CARD_NEW = uuidv4();
import { ZodError } from "zod";

describe("CreateBudgetUseCase", () => {
  let useCase: CreateBudgetUseCase;
  let mockBudgetRepo: IBudgetRepository;
  let mockIncomeRepo: IIncomeRepository;
  let mockExpenseRepo: IFixedExpenseRepository;
  let mockCreditCardRepo: ICreditCardRepository;
  let mockDailyExpenseRepo: IDailyExpenseRepository;
  let mockInstallmentExpenseRepo: IInstallmentExpenseRepository;
  let mockCreditCardInvoiceRepo: ICreditCardInvoiceRepository;

  const mockUserId = "user-123";
  const mockMonth = 0; // January
  const mockYear = 2026;

  beforeEach(() => {
    // Mock Budget Repository
    mockBudgetRepo = {
      findByUserAndMonth: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };

    // Mock Income Repository
    mockIncomeRepo = {
      findByUserAndMonth: vi.fn(),
      deleteByUserAndMonth: vi.fn(),
      bulkCreate: vi.fn(),
      bulkUpdate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // Mock Expense Repository
    mockExpenseRepo = {
      findByUserAndMonth: vi.fn(),
      findById: vi.fn(),
      deleteByUserAndMonth: vi.fn(),
      bulkCreate: vi.fn(),
      bulkUpdate: vi.fn(),
      update: vi.fn(),
      setRefundIncomeId: vi.fn(),
      softDelete: vi.fn(),
      softDeleteFutureInstallments: vi.fn(),
    };

    // Mock Credit Card Repository
    mockCreditCardRepo = {
      findActiveByUser: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      bulkUpdate: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      hardDelete: vi.fn(),
      checkHasExpenses: vi.fn(),
    };

    // Mock Daily Expense Repository
    mockDailyExpenseRepo = {
      findByUserAndDateRange: vi.fn(),
      createOpeningBalance: vi.fn(),
      createOpeningBalances: vi.fn(),
      findOpeningBalancesByDueMonth: vi.fn().mockResolvedValue([]),
      deleteOpeningBalancesByDueMonth: vi.fn().mockResolvedValue(undefined),
    };

    // Mock Installment Expense Repository
    mockInstallmentExpenseRepo = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // Default mocks needed by GetBudgetUseCase (both configured and unconfigured paths)
    vi.mocked(mockExpenseRepo.findByUserAndMonth).mockResolvedValue([]);
    vi.mocked(mockIncomeRepo.findByUserAndMonth).mockResolvedValue([]);

    // Mock Credit Card Invoice Repository
    mockCreditCardInvoiceRepo = {
      upsertForMonth: vi.fn().mockResolvedValue(undefined),
      findByUserAndMonth: vi.fn().mockResolvedValue([]),
      findExpensesByCardAndMonth: vi.fn().mockResolvedValue([]),
      markAsPaid: vi.fn(),
    };

    useCase = new CreateBudgetUseCase(
      mockBudgetRepo,
      mockIncomeRepo,
      mockExpenseRepo,
      mockCreditCardRepo,
      mockDailyExpenseRepo,
      mockInstallmentExpenseRepo,
      mockCreditCardInvoiceRepo,
    );
  });

  describe("Creating new budget", () => {
    it("should create a new budget configuration successfully", async () => {
      // Arrange
      const incomes: IncomeSource[] = [
        { name: "Salary", amount: 500000 },
        { name: "Freelance", amount: 100000 },
      ];

      const expenses: FixedExpense[] = [
        {
          name: "Rent",
          amount: 150000,
          dueDay: 5,
          type: "MANDATORY" as any,
          paid: false,
        },
        {
          name: "Internet",
          amount: 10000,
          dueDay: 10,
          type: "MANDATORY" as any,
          paid: false,
        },
      ];

      const creditCards: CreditCard[] = [
        { name: "Visa", dueDay: 15, limit: 500000, color: "#0000ff" },
      ];

      const allocation = {
        fixedPercent: 30,
        dailyPercent: 50,
        reservePercent: 20,
      };

      // Mock: budget creation
      const mockCreatedConfig: BudgetConfig = {
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 600000, // 6000 * 100 cents
        fixedPercent: 30,
        dailyPercent: 50,
        reservePercent: 20,
        remainingDailyBudget: 0,
        startDay: 1,
      };

      vi.mocked(mockBudgetRepo.create).mockResolvedValue(mockCreatedConfig);
      // First call (CreateBudgetUseCase): no existing budget; second call (GetBudgetUseCase): configured
      vi.mocked(mockBudgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockCreatedConfig)
        .mockResolvedValue(null);

      // Mock: no existing credit cards
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);

      // Mock: credit card creation
      vi.mocked(mockCreditCardRepo.create).mockResolvedValue({
        id: "card-123",
        userId: mockUserId,
        name: "Visa",
        dueDay: 15,
        limit: 500000, // 5000 * 100 cents
        color: "#0000ff",
      });

      // Mock: no daily expenses
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes,
        expenses,
        creditCards,
        allocation,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe("budget-123");
      expect(result.totalIncome).toBe(600000);
      expect(result.totalFixed).toBe(180000); // 600000 * 0.30
      expect(result.dailyBudget).toBe(300000); // 600000 * 0.50
      expect(result.reserveAmount).toBe(120000); // 600000 * 0.20
      expect(result.isConfigured).toBe(true);

      // Verify repository calls
      expect(mockBudgetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          month: mockMonth,
          year: mockYear,
          totalIncome: 600000,
          fixedPercent: 30,
          dailyPercent: 50,
          reservePercent: 20,
        }),
      );

      expect(mockIncomeRepo.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: "Salary", amount: 500000 }),
          expect.objectContaining({ name: "Freelance", amount: 100000 }),
        ]),
      );

      expect(mockExpenseRepo.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: "Rent", amount: 150000 }),
          expect.objectContaining({ name: "Internet", amount: 10000 }),
        ]),
      );

      expect(mockCreditCardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Visa",
          dueDay: 15,
          limit: 500000,
        }),
      );
    });

    it("should handle mid-month setup with targetRemaining", async () => {
      // Arrange
      const incomes: IncomeSource[] = [{ name: "Salary", amount: 600000 }];
      const expenses: FixedExpense[] = [];
      const creditCards: CreditCard[] = [];
      const allocation = {
        fixedPercent: 20,
        dailyPercent: 60,
        reservePercent: 20,
      };
      const targetRemaining = 200000; // User wants R$ 2000 remaining for daily expenses (in cents)

      const mockMidMonthConfig = {
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 600000,
        fixedPercent: 20,
        dailyPercent: 60,
        reservePercent: 20,
        remainingDailyBudget: 200000, // targetRemaining value
        startDay: 26, // Assuming current day is 26
      };
      vi.mocked(mockBudgetRepo.create).mockResolvedValue(mockMidMonthConfig);
      vi.mocked(mockBudgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockMidMonthConfig)
        .mockResolvedValue(null);
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes,
        expenses,
        creditCards,
        allocation,
        targetRemaining,
      });

      // Assert
      expect(result.remainingDailyBudget).toBe(200000); // targetRemaining (in cents)
      expect(mockBudgetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          remainingDailyBudget: 200000, // targetRemaining (in cents)
        }),
      );
    });
  });

  describe("Financial calculations", () => {
    it("should calculate allocation percentages correctly", async () => {
      // Arrange
      const creditCards: CreditCard[] = [
        { name: "Mastercard", dueDay: 10, limit: 3000, color: "#ff0000" },
        { name: "Amex", dueDay: 20, limit: 8000, color: "#00ff00" },
      ];

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 100000,
        fixedPercent: 0,
        dailyPercent: 50,
        reservePercent: 50,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockCreditCardRepo.create).mockResolvedValue({
        id: UUID_CARD_NEW,
        userId: mockUserId,
        name: "Mastercard",
        dueDay: 10,
        limit: 300000,
        color: "#ff0000",
      });
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Income", amount: 1000 }],
        expenses: [],
        creditCards,
        allocation: { fixedPercent: 0, dailyPercent: 50, reservePercent: 50 },
      });

      // Assert
      expect(mockCreditCardRepo.create).toHaveBeenCalledTimes(2);
      expect(mockCreditCardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Mastercard", limit: 3000 }),
      );
      expect(mockCreditCardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Amex", limit: 8000 }),
      );
    });

    it("should update existing credit cards", async () => {
      // Arrange
      const existingCard: CreditCard = {
        id: UUID_CARD_EXISTING,
        userId: mockUserId,
        name: "Old Name",
        dueDay: 5,
        limit: 2000,
        color: "#000000",
      };

      const updatedCards: CreditCard[] = [
        {
          id: UUID_CARD_EXISTING,
          name: "New Name",
          dueDay: 15,
          limit: 5000,
          color: "#ffffff",
        },
      ];

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 100000,
        fixedPercent: 0,
        dailyPercent: 50,
        reservePercent: 50,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([
        existingCard,
      ]);
      vi.mocked(mockCreditCardRepo.checkHasExpenses).mockResolvedValue(
        new Set(),
      );
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Income", amount: 1000 }],
        expenses: [],
        creditCards: updatedCards,
        allocation: { fixedPercent: 0, dailyPercent: 50, reservePercent: 50 },
      });

      // Assert
      expect(mockCreditCardRepo.bulkUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.arrayContaining([
          expect.objectContaining({
            id: UUID_CARD_EXISTING,
            name: "New Name",
            dueDay: 15,
            limit: 5000,
            color: "#ffffff",
          }),
        ]),
      );
    });

    it("should soft delete credit cards with expenses", async () => {
      // Arrange
      const existingCard: CreditCard = {
        id: "card-with-expenses",
        userId: mockUserId,
        name: "Card to Delete",
        dueDay: 10,
        limit: 3000,
        color: "#000000",
      };

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 100000,
        fixedPercent: 0,
        dailyPercent: 50,
        reservePercent: 50,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([
        existingCard,
      ]);
      vi.mocked(mockCreditCardRepo.checkHasExpenses).mockResolvedValue(
        new Set(["card-with-expenses"]),
      );
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Income", amount: 1000 }],
        expenses: [],
        creditCards: [], // No cards submitted = delete existing
        allocation: { fixedPercent: 0, dailyPercent: 50, reservePercent: 50 },
      });

      // Assert
      expect(mockCreditCardRepo.softDelete).toHaveBeenCalledWith(
        ["card-with-expenses"],
        mockUserId,
      );
      expect(mockCreditCardRepo.hardDelete).not.toHaveBeenCalled();
    });

    it("should hard delete credit cards without expenses", async () => {
      // Arrange
      const existingCard: CreditCard = {
        id: "card-without-expenses",
        userId: mockUserId,
        name: "Card to Delete",
        dueDay: 10,
        limit: 3000,
        color: "#000000",
      };

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 100000,
        fixedPercent: 0,
        dailyPercent: 50,
        reservePercent: 50,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([
        existingCard,
      ]);
      vi.mocked(mockCreditCardRepo.checkHasExpenses).mockResolvedValue(
        new Set(),
      );
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Income", amount: 1000 }],
        expenses: [],
        creditCards: [],
        allocation: { fixedPercent: 0, dailyPercent: 50, reservePercent: 50 },
      });

      // Assert
      expect(mockCreditCardRepo.hardDelete).toHaveBeenCalledWith(
        ["card-without-expenses"],
        mockUserId,
      );
      expect(mockCreditCardRepo.softDelete).not.toHaveBeenCalled();
    });

    it("should treat cards with temp- prefix as new cards", async () => {
      // Arrange
      const tempCardId = "temp-12345";
      const creditCards: CreditCard[] = [
        {
          id: tempCardId,
          name: "Temporary Card",
          dueDay: 5,
          limit: 2000,
          color: "#ff00ff",
        },
      ];

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 100000,
        fixedPercent: 0,
        dailyPercent: 50,
        reservePercent: 50,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockCreditCardRepo.create).mockResolvedValue({
        id: "card-new-123",
        userId: mockUserId,
        name: "Temporary Card",
        dueDay: 5,
        limit: 200000,
        color: "#ff00ff",
      });
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Income", amount: 1000 }],
        expenses: [],
        creditCards,
        allocation: { fixedPercent: 0, dailyPercent: 50, reservePercent: 50 },
      });

      // Assert
      expect(mockCreditCardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Temporary Card",
          dueDay: 5,
          limit: 2000,
        }),
      );
      expect(mockCreditCardRepo.bulkUpdate).not.toHaveBeenCalled();
    });

    it("should handle mix of existing, new, and temp cards", async () => {
      // Arrange
      const existingCard: CreditCard = {
        id: UUID_CARD_EXISTING_123,
        userId: mockUserId,
        name: "Existing Card",
        dueDay: 10,
        limit: 5000,
        color: "#000000",
      };

      const creditCards: CreditCard[] = [
        // Existing card (should update)
        {
          id: UUID_CARD_EXISTING_123,
          name: "Updated Existing",
          dueDay: 15,
          limit: 6000,
          color: "#111111",
        },
        // Temporary card (should create)
        {
          id: "temp-abc123",
          name: "Temp Card",
          dueDay: 5,
          limit: 2000,
          color: "#ff0000",
        },
        // New card without ID (should create)
        { name: "Brand New Card", dueDay: 20, limit: 3000, color: "#00ff00" },
      ];

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 100000,
        fixedPercent: 0,
        dailyPercent: 50,
        reservePercent: 50,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([
        existingCard,
      ]);
      vi.mocked(mockCreditCardRepo.create).mockResolvedValue({
        id: "card-created",
        userId: mockUserId,
        name: "Created",
        dueDay: 1,
        limit: 100000,
        color: "#ffffff",
      });
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Income", amount: 1000 }],
        expenses: [],
        creditCards,
        allocation: { fixedPercent: 0, dailyPercent: 50, reservePercent: 50 },
      });

      // Assert
      // Should update existing card
      expect(mockCreditCardRepo.bulkUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.arrayContaining([
          expect.objectContaining({
            id: UUID_CARD_EXISTING_123,
            name: "Updated Existing",
            dueDay: 15,
            limit: 6000,
          }),
        ]),
      );

      // Should create 2 new cards (temp + no ID)
      expect(mockCreditCardRepo.create).toHaveBeenCalledTimes(2);
      expect(mockCreditCardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Temp Card" }),
      );
      expect(mockCreditCardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Brand New Card" }),
      );
    });

    it("should not update card if it has temp- prefix even with matching ID in DB", async () => {
      // Arrange
      const existingCard: CreditCard = {
        id: "temp-should-not-match",
        userId: mockUserId,
        name: "This should never exist in DB",
        dueDay: 1,
        limit: 1000,
        color: "#000000",
      };

      const creditCards: CreditCard[] = [
        {
          id: "temp-should-not-match",
          name: "New Card",
          dueDay: 5,
          limit: 2000,
          color: "#ff0000",
        },
      ];

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 100000,
        fixedPercent: 0,
        dailyPercent: 50,
        reservePercent: 50,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([
        existingCard,
      ]);
      vi.mocked(mockCreditCardRepo.checkHasExpenses).mockResolvedValue(
        new Set(),
      );
      vi.mocked(mockCreditCardRepo.create).mockResolvedValue({
        id: UUID_CARD_NEW,
        userId: mockUserId,
        name: "New Card",
        dueDay: 5,
        limit: 200000,
        color: "#ff0000",
      });
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Income", amount: 1000 }],
        expenses: [],
        creditCards,
        allocation: { fixedPercent: 0, dailyPercent: 50, reservePercent: 50 },
      });

      // Assert
      // Should create new card (not update)
      expect(mockCreditCardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "New Card" }),
      );
      expect(mockCreditCardRepo.bulkUpdate).not.toHaveBeenCalled();

      // Should delete the old temp- card from DB since the submitted card
      // with the same ID will be treated as new (cards with temp- prefix are always treated as new)
      expect(mockCreditCardRepo.hardDelete).toHaveBeenCalledWith(
        ["temp-should-not-match"],
        mockUserId,
      );
    });
  });

  describe("Financial calculations", () => {
    it("should calculate allocation percentages correctly", async () => {
      // Arrange
      const totalIncome = 10000;
      const allocation = {
        fixedPercent: 30, // 3000
        dailyPercent: 50, // 5000
        reservePercent: 20, // 2000
      };

      const mockAllocationConfig = {
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: totalIncome, // 10000
        fixedPercent: 30,
        dailyPercent: 50,
        reservePercent: 20,
        remainingDailyBudget: 0,
        startDay: 1,
      };
      vi.mocked(mockBudgetRepo.create).mockResolvedValue(mockAllocationConfig);
      vi.mocked(mockBudgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockAllocationConfig)
        .mockResolvedValue(null);
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Salary", amount: totalIncome }],
        expenses: [],
        creditCards: [],
        allocation,
      });

      // Assert
      expect(result.dailyBudget).toBe(5000);
      expect(result.reserveAmount).toBe(2000);
      expect(result.dailyPercent).toBe(50);
      expect(result.reservePercent).toBe(20);
    });

    it("should calculate installment values correctly", async () => {
      // Arrange
      const expenses: FixedExpense[] = [
        {
          name: "Laptop",
          amount: 3000,
          dueDay: 1,
          type: "DISCRETIONARY" as any,
          paid: false,
          isInstallment: true,
          totalInstallments: 12,
          startInstallment: 1,
        },
      ];

      const mockInstallmentConfig1 = {
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 600000,
        fixedPercent: 30,
        dailyPercent: 50,
        reservePercent: 20,
        remainingDailyBudget: 0,
        startDay: 1,
      };
      vi.mocked(mockBudgetRepo.create).mockResolvedValue(
        mockInstallmentConfig1,
      );
      vi.mocked(mockBudgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockInstallmentConfig1)
        .mockResolvedValue(null);
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockInstallmentExpenseRepo.create).mockResolvedValue({
        id: "installment-test",
        userId: mockUserId,
        name: "Laptop",
        totalAmount: 300000,
        totalInstallments: 12,
        startInstallment: 1,
        startsAtMonthId: 202601,
        endsAtMonthId: 202612,
      });
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Salary", amount: 600000 }],
        expenses,
        creditCards: [],
        allocation: { fixedPercent: 30, dailyPercent: 50, reservePercent: 20 },
      });

      // Assert
      // totalFixed is calculated from allocation percentage: 600000 * 0.30 = 180000
      expect(result.totalFixed).toBe(180000);
    });

    it("should calculate installment with remainder correctly", async () => {
      // Arrange
      const expenses: FixedExpense[] = [
        {
          name: "Sofa",
          amount: 100000, // R$ 1000.00 in cents
          dueDay: 1,
          type: "DISCRETIONARY" as any,
          paid: false,
          isInstallment: true,
          totalInstallments: 6, // 6x
          startInstallment: 1,
        },
      ];

      const mockRemainderConfig = {
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 600000,
        fixedPercent: 30,
        dailyPercent: 50,
        reservePercent: 20,
        remainingDailyBudget: 0,
        startDay: 1,
      };
      vi.mocked(mockBudgetRepo.create).mockResolvedValue(mockRemainderConfig);
      vi.mocked(mockBudgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockRemainderConfig)
        .mockResolvedValue(null);
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockInstallmentExpenseRepo.create).mockResolvedValue({
        id: "installment-remainder",
        userId: mockUserId,
        name: "Sofa",
        totalAmount: 100000, // R$ 1000.00 in cents
        totalInstallments: 6,
        startInstallment: 1,
        startsAtMonthId: 202601,
        endsAtMonthId: 202606,
      });
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Salary", amount: 600000 }],
        expenses,
        creditCards: [],
        allocation: { fixedPercent: 30, dailyPercent: 50, reservePercent: 20 },
      });

      // Assert
      // totalFixed is calculated from allocation percentage: 600000 * 0.30 = 180000
      // (not from sum of expenses)
      expect(result.totalFixed).toBe(180000);

      // Verify installment expense was created with correct values
      expect(mockInstallmentExpenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Sofa",
          totalAmount: 100000, // R$ 1000 in cents
          totalInstallments: 6,
          startInstallment: 1,
        }),
      );

      // Verify 6 fixed expenses were created
      const bulkCreateCalls = vi.mocked(mockExpenseRepo.bulkCreate).mock.calls;
      const createdExpenses = bulkCreateCalls[0][0];
      expect(createdExpenses).toHaveLength(6);

      // Verify first installment has remainder
      expect(createdExpenses[0]).toMatchObject({
        name: "Sofa",
        amount: 16670, // First with remainder: floor(100000/6) + 4 = 16670
        currentInstallment: 1,
        totalInstallments: 6,
      });

      // Verify second installment is regular
      expect(createdExpenses[1]).toMatchObject({
        name: "Sofa",
        amount: 16666, // Regular installment: floor(100000/6) = 16666
        currentInstallment: 2,
        totalInstallments: 6,
      });
    });
  });

  describe("Daily history integration", () => {
    it("should include daily expenses in response", async () => {
      // Arrange
      const mockDailyExpenses: DailyExpense[] = [
        {
          id: "expense-1",
          userId: mockUserId,
          date: "2026-01-15",
          amount: 5000, // R$ 50 in cents
          description: "Lunch",
        },
        {
          id: "expense-2",
          userId: mockUserId,
          date: "2026-01-16",
          amount: 10000, // R$ 100 in cents
          description: "Shopping",
        },
      ];

      const mockDailyHistoryConfig = {
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 600000,
        fixedPercent: 0,
        dailyPercent: 50,
        reservePercent: 50,
        remainingDailyBudget: 0,
        startDay: 1,
      };
      vi.mocked(mockBudgetRepo.create).mockResolvedValue(
        mockDailyHistoryConfig,
      );
      vi.mocked(mockBudgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDailyHistoryConfig)
        .mockResolvedValue(null);
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        mockDailyExpenses,
      );

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Salary", amount: 600000 }],
        expenses: [],
        creditCards: [],
        allocation: { fixedPercent: 0, dailyPercent: 50, reservePercent: 50 },
      });

      // Assert
      expect(result.dailyHistory).toBeDefined();
      expect(result.dailyHistory.length).toBeGreaterThan(0);
      expect(result.totalSpent).toBe(15000); // R$ 50 + R$ 100 in cents
    });
  });

  describe("Edge cases", () => {
    it("should handle empty incomes array", async () => {
      // Arrange
      const mockZeroIncomeConfig = {
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 0,
        fixedPercent: 0,
        dailyPercent: 50,
        reservePercent: 50,
        remainingDailyBudget: 0,
        startDay: 1,
      };
      vi.mocked(mockBudgetRepo.create).mockResolvedValue(mockZeroIncomeConfig);
      // GetBudgetUseCase must see it as configured to trigger calculateAllocationValues(0,...) → ZodError
      vi.mocked(mockBudgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockZeroIncomeConfig)
        .mockResolvedValue(null);
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await expect(
        useCase.execute({
          userId: mockUserId,
          month: mockMonth,
          year: mockYear,
          incomes: [],
          expenses: [],
          creditCards: [],
          allocation: {
            fixedPercent: 0,
            dailyPercent: 50,
            reservePercent: 50,
          },
        }),
      ).rejects.toBeInstanceOf(ZodError);
    });

    it("should handle empty expenses array", async () => {
      // Arrange
      const mockEmptyExpensesConfig = {
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 500000,
        fixedPercent: 30,
        dailyPercent: 50,
        reservePercent: 20,
        remainingDailyBudget: 0,
        startDay: 1,
      };
      vi.mocked(mockBudgetRepo.create).mockResolvedValue(
        mockEmptyExpensesConfig,
      );
      vi.mocked(mockBudgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockEmptyExpensesConfig)
        .mockResolvedValue(null);
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses: [],
        creditCards: [],
        allocation: { fixedPercent: 30, dailyPercent: 50, reservePercent: 20 },
      });

      // Assert
      expect(result.totalFixed).toBe(150000); // 500000 * 0.30
      expect(mockExpenseRepo.bulkCreate).not.toHaveBeenCalled();
    });

    it("should handle zero targetRemaining", async () => {
      // Arrange
      const mockZeroRemainingConfig = {
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 600000,
        fixedPercent: 0,
        dailyPercent: 50,
        reservePercent: 50,
        remainingDailyBudget: 0, // No budget remaining (targetRemaining = 0)
        startDay: 26,
      };
      vi.mocked(mockBudgetRepo.create).mockResolvedValue(
        mockZeroRemainingConfig,
      );
      vi.mocked(mockBudgetRepo.findByUserAndMonth)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockZeroRemainingConfig)
        .mockResolvedValue(null);
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Salary", amount: 600000 }],
        expenses: [],
        creditCards: [],
        allocation: { fixedPercent: 0, dailyPercent: 50, reservePercent: 50 },
        targetRemaining: 0,
      });

      // Assert
      expect(result.remainingDailyBudget).toBe(0);
    });
  });

  describe("Installment expense management", () => {
    it("should create installment expense parent record and monthly installments", async () => {
      // Arrange
      const expenses: FixedExpense[] = [
        {
          name: "Laptop Purchase",
          amount: 120000, // R$ 1200 total in cents
          dueDay: 1,
          type: "DISCRETIONARY" as any,
          paid: false,
          isInstallment: true,
          totalInstallments: 3,
          startInstallment: 1,
        },
      ];

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 500000,
        fixedPercent: 30,
        dailyPercent: 50,
        reservePercent: 20,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockInstallmentExpenseRepo.create).mockResolvedValue({
        id: "installment-123",
        userId: mockUserId,
        name: "Laptop Purchase",
        totalAmount: 120000, // In cents
        totalInstallments: 3,
        startInstallment: 1,
        startsAtMonthId: 202601,
        endsAtMonthId: 202603,
      });
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses,
        creditCards: [],
        allocation: { fixedPercent: 30, dailyPercent: 50, reservePercent: 20 },
      });

      // Assert - installment_expenses record created
      expect(mockInstallmentExpenseRepo.create).toHaveBeenCalledWith({
        userId: mockUserId,
        name: "Laptop Purchase",
        creditCardId: undefined,
        totalAmount: 120000, // R$ 1200 in cents
        totalInstallments: 3,
        startInstallment: 1,
        startsAtMonthId: 202601,
        endsAtMonthId: 202603,
      });

      // Assert - 3 fixed_expenses created (one per month)
      expect(mockExpenseRepo.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId: mockUserId,
            monthId: "202601",
            name: "Laptop Purchase",
            amount: 40000, // 120000 / 3 = 40000 exato (sem resto)
            installmentExpenseId: "installment-123",
            isInstallment: true,
            currentInstallment: 1,
            totalInstallments: 3,
          }),
          expect.objectContaining({
            userId: mockUserId,
            monthId: "202602",
            name: "Laptop Purchase",
            amount: 40000, // Regular installment
            installmentExpenseId: "installment-123",
            isInstallment: true,
            currentInstallment: 2,
            totalInstallments: 3,
          }),
          expect.objectContaining({
            userId: mockUserId,
            monthId: "202603",
            name: "Laptop Purchase",
            amount: 40000, // Regular installment
            installmentExpenseId: "installment-123",
            isInstallment: true,
            currentInstallment: 3,
            totalInstallments: 3,
          }),
        ]),
      );
    });

    it("should handle installment starting mid-way (e.g., 3/12)", async () => {
      // Arrange
      const expenses: FixedExpense[] = [
        {
          name: "TV",
          amount: 240000, // R$ 2400 total in cents
          dueDay: 1,
          type: "DISCRETIONARY" as any,
          paid: false,
          isInstallment: true,
          totalInstallments: 12,
          startInstallment: 3, // Starting at 3rd installment
        },
      ];

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 500000,
        fixedPercent: 30,
        dailyPercent: 50,
        reservePercent: 20,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockInstallmentExpenseRepo.create).mockResolvedValue({
        id: "installment-456",
        userId: mockUserId,
        name: "TV",
        totalAmount: 240000,
        totalInstallments: 12,
        startInstallment: 3,
        startsAtMonthId: 202601,
        endsAtMonthId: 202610, // 10 months remaining (3 to 12)
      });
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses,
        creditCards: [],
        allocation: { fixedPercent: 30, dailyPercent: 50, reservePercent: 20 },
      });

      // Assert - 10 installments created (from 3rd to 12th)
      expect(mockExpenseRepo.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            currentInstallment: 3,
            amount: 20000, // Regular installment (first was already paid)
          }),
          expect.objectContaining({
            currentInstallment: 4,
          }),
          // ... continues until installment 12
        ]),
      );

      // Verify bulkCreate was called with 10 items
      const bulkCreateCalls = vi.mocked(mockExpenseRepo.bulkCreate).mock.calls;
      const installmentExpenses = bulkCreateCalls[0][0];
      expect(installmentExpenses).toHaveLength(10); // 3rd to 12th = 10 installments
    });

    it("should link installment expense to credit card", async () => {
      // Arrange
      const expenses: FixedExpense[] = [
        {
          name: "Sofa",
          amount: 3000,
          dueDay: 1,
          type: "DISCRETIONARY" as any,
          paid: false,
          isInstallment: true,
          totalInstallments: 6,
          startInstallment: 1,
          creditCardId: "card-999",
        },
      ];

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 500000,
        fixedPercent: 30,
        dailyPercent: 50,
        reservePercent: 20,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockInstallmentExpenseRepo.create).mockResolvedValue({
        id: "installment-789",
        userId: mockUserId,
        name: "Sofa",
        creditCardId: "card-999",
        totalAmount: 300000,
        totalInstallments: 6,
        startInstallment: 1,
        startsAtMonthId: 202601,
        endsAtMonthId: 202606,
      });
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses,
        creditCards: [],
        allocation: { fixedPercent: 30, dailyPercent: 50, reservePercent: 20 },
      });

      // Assert - installment linked to credit card
      expect(mockInstallmentExpenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          creditCardId: "card-999",
        }),
      );

      // Assert - all monthly expenses linked to same card
      expect(mockExpenseRepo.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            creditCardId: "card-999",
          }),
        ]),
      );
    });

    it("should skip creating installment if it already has installmentExpenseId", async () => {
      // Arrange - existing installment expense
      const expenses: FixedExpense[] = [
        {
          name: "Existing Installment",
          amount: 1000,
          dueDay: 1,
          type: "DISCRETIONARY" as any,
          paid: false,
          isInstallment: true,
          totalInstallments: 5,
          startInstallment: 2,
          installmentExpenseId: "existing-installment-123", // Already exists
        },
      ];

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 500000,
        fixedPercent: 30,
        dailyPercent: 50,
        reservePercent: 20,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses,
        creditCards: [],
        allocation: { fixedPercent: 30, dailyPercent: 50, reservePercent: 20 },
      });

      // Assert - should NOT create new installment_expenses
      expect(mockInstallmentExpenseRepo.create).not.toHaveBeenCalled();
    });

    it("should handle mix of regular and installment expenses", async () => {
      // Arrange
      const expenses: FixedExpense[] = [
        {
          name: "Rent",
          amount: 150000,
          dueDay: 5,
          type: "MANDATORY" as any,
          paid: false,
          // Not an installment
        },
        {
          name: "Phone",
          amount: 90000,
          dueDay: 10,
          type: "DISCRETIONARY" as any,
          paid: false,
          isInstallment: true,
          totalInstallments: 3,
          startInstallment: 1,
        },
      ];

      vi.mocked(mockBudgetRepo.findByUserAndMonth).mockResolvedValue(null);
      vi.mocked(mockBudgetRepo.create).mockResolvedValue({
        id: "budget-123",
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        monthId: "202601",
        totalIncome: 500000,
        fixedPercent: 30,
        dailyPercent: 50,
        reservePercent: 20,
        remainingDailyBudget: 0,
        startDay: 1,
      });
      vi.mocked(mockCreditCardRepo.findActiveByUser).mockResolvedValue([]);
      vi.mocked(mockInstallmentExpenseRepo.create).mockResolvedValue({
        id: "installment-mix",
        userId: mockUserId,
        name: "Phone",
        totalAmount: 90000,
        totalInstallments: 3,
        startInstallment: 1,
        startsAtMonthId: 202601,
        endsAtMonthId: 202603,
      });
      vi.mocked(mockDailyExpenseRepo.findByUserAndDateRange).mockResolvedValue(
        [],
      );

      // Act
      await useCase.execute({
        userId: mockUserId,
        month: mockMonth,
        year: mockYear,
        incomes: [{ name: "Salary", amount: 500000 }],
        expenses,
        creditCards: [],
        allocation: { fixedPercent: 30, dailyPercent: 50, reservePercent: 20 },
      });

      // Assert - bulkCreate should be called twice (once for regular, once for installments)
      expect(mockExpenseRepo.bulkCreate).toHaveBeenCalledTimes(2);

      // First call: regular expense
      const firstCall = vi.mocked(mockExpenseRepo.bulkCreate).mock.calls[0][0];
      expect(firstCall).toHaveLength(1);
      expect(firstCall[0]).toMatchObject({
        name: "Rent",
        amount: 150000,
      });

      // Second call: installment monthly expenses
      const secondCall = vi.mocked(mockExpenseRepo.bulkCreate).mock.calls[1][0];
      expect(secondCall).toHaveLength(3); // 3 monthly installments
      expect(secondCall[0]).toMatchObject({
        name: "Phone",
        installmentExpenseId: "installment-mix",
        currentInstallment: 1,
      });
    });
  });
});
