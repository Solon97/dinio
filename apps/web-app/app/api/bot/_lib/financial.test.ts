import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getBotFinancialStatus } from "./financial";
import {
  IBudgetRepository,
  IDailyExpenseRepository,
} from "@/app/api/budget/domain/repositories/IBudgetRepository";
import { DailyExpense } from "@/app/api/budget/domain/entities/BudgetConfig";

/**
 * Fixed reference date: March 11, 2026 at noon UTC.
 * In America/Sao_Paulo (UTC-3) this is 09:00, so:
 *   year=2026, month=2 (March, 0-indexed), day=11
 *   daysInMonth=31, daysLeft=20, monthId=202603
 */
const FIXED_DATE = new Date("2026-03-11T12:00:00Z");

const createMockBudgetRepository = (): IBudgetRepository => ({
  findByUserAndMonth: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
});

const createMockDailyExpenseRepository = (): IDailyExpenseRepository => ({
  findByUserAndDateRange: vi.fn().mockResolvedValue([]),
  createOpeningBalance: vi.fn(),
  createOpeningBalances: vi.fn(),
  findOpeningBalancesByDueMonth: vi.fn().mockResolvedValue([]),
  deleteOpeningBalancesByDueMonth: vi.fn(),
});

/**
 * Base budget config for tests.
 * Income=R$5000 (500000 cents), allocation: 40% fixed / 50% daily / 10% reserve
 * dailyBudgetCents = 500000 * 0.50 = 250000
 */
const BASE_CONFIG = {
  id: "config-1",
  userId: "user-123",
  monthId: "202603",
  month: 2,
  year: 2026,
  totalIncome: 500000,
  fixedPercent: 40,
  dailyPercent: 50,
  reservePercent: 10,
  remainingDailyBudget: 0,
  startDay: 1,
};

const makeExpense = (
  overrides: Partial<DailyExpense> & Pick<DailyExpense, "date" | "amount">,
): DailyExpense => ({
  id: "exp-default",
  userId: "user-123",
  time: "12:00",
  category: "food",
  description: "despesa",
  ...overrides,
});

describe("getBotFinancialStatus", () => {
  const userId = "user-123";
  let budgetRepo: IBudgetRepository;
  let dailyExpenseRepo: IDailyExpenseRepository;

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    budgetRepo = createMockBudgetRepository();
    dailyExpenseRepo = createMockDailyExpenseRepository();
  });

  // ─── Budget not configured ────────────────────────────────────────────────

  describe("Budget not configured", () => {
    beforeEach(() => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(null);
    });

    it("returns isConfigured=false", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.isConfigured).toBe(false);
    });

    it("returns zeroed financial fields", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.recommendedTodayCents).toBe(0);
      expect(result.recommendedForFuture).toBe(0);
      expect(result.todaySpentCents).toBe(0);
      expect(result.monthBalanceCents).toBe(0);
      expect(result.monthProjectionCents).toBe(0);
    });

    it("returns correct daysLeft (31 - 11 = 20 for March 11)", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.daysLeft).toBe(20);
    });

    it("queries the correct monthId string", async () => {
      await getBotFinancialStatus(userId, budgetRepo, dailyExpenseRepo);
      expect(budgetRepo.findByUserAndMonth).toHaveBeenCalledWith(
        userId,
        "202603",
      );
    });

    it("does NOT query daily expenses", async () => {
      await getBotFinancialStatus(userId, budgetRepo, dailyExpenseRepo);
      expect(dailyExpenseRepo.findByUserAndDateRange).not.toHaveBeenCalled();
    });
  });

  // ─── Budget configured, no expenses ──────────────────────────────────────

  describe("Budget configured, no expenses", () => {
    beforeEach(() => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(BASE_CONFIG);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);
    });

    it("returns isConfigured=true", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.isConfigured).toBe(true);
    });

    it("returns todaySpentCents=0", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.todaySpentCents).toBe(0);
    });

    it("returns monthBalanceCents equal to full dailyBudget (250000)", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.monthBalanceCents).toBe(250000);
    });

    it("returns recommendedForFuture = floor(250000 / 20) = 12500", async () => {
      // remainingDaysExcludingToday = max(0, 31 - 11) = 20
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.recommendedForFuture).toBe(12500);
    });

    it("returns recommendedTodayCents = floor(250000 / 21) = 11904", async () => {
      // remainingDaysIncludingToday = 31 - 11 + 1 = 21
      // (remainingBalanceCents + todaySpent) / 21 = (250000 + 0) / 21
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.recommendedTodayCents).toBe(11904);
    });

    it("returns daysLeft=20", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.daysLeft).toBe(20);
    });

    it("queries daily expenses for the full month range", async () => {
      await getBotFinancialStatus(userId, budgetRepo, dailyExpenseRepo);
      expect(dailyExpenseRepo.findByUserAndDateRange).toHaveBeenCalledWith(
        userId,
        "2026-03-01",
        "2026-03-31",
      );
    });
  });

  // ─── Budget configured, expense on current day ───────────────────────────

  describe("Budget configured, expense on current day (day 11)", () => {
    beforeEach(() => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(BASE_CONFIG);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([
        makeExpense({ id: "exp-today", date: "2026-03-11", amount: 5000 }),
      ]);
    });

    it("returns todaySpentCents=5000", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.todaySpentCents).toBe(5000);
    });

    it("deducts today's expense from monthBalanceCents", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.monthBalanceCents).toBe(245000); // 250000 - 5000
    });

    it("updates recommendedForFuture after spending", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      // floor(245000 / 20) = 12250
      expect(result.recommendedForFuture).toBe(12250);
    });

    it("accounts for today's expense in recommendedTodayCents", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      // (remainingBalanceCents + todaySpent) / remainingDaysIncludingToday
      // = (245000 + 5000) / 21 = floor(250000 / 21) = 11904
      expect(result.recommendedTodayCents).toBe(11904);
    });
  });

  // ─── Budget configured, expense on a past day ────────────────────────────

  describe("Budget configured, expense on a past day (day 5)", () => {
    beforeEach(() => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(BASE_CONFIG);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([
        makeExpense({ id: "exp-past", date: "2026-03-05", amount: 8000 }),
      ]);
    });

    it("returns todaySpentCents=0 (expense was not today)", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.todaySpentCents).toBe(0);
    });

    it("deducts past expense from monthBalanceCents", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.monthBalanceCents).toBe(242000); // 250000 - 8000
    });
  });

  // ─── Multiple expenses on different days ─────────────────────────────────

  describe("Budget configured, multiple expenses across days", () => {
    beforeEach(() => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(BASE_CONFIG);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([
        makeExpense({ id: "exp-1", date: "2026-03-05", amount: 4000 }),
        makeExpense({ id: "exp-2", date: "2026-03-08", amount: 3000 }),
        makeExpense({ id: "exp-3", date: "2026-03-11", amount: 2000 }),
      ]);
    });

    it("returns todaySpentCents only for today's expenses", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.todaySpentCents).toBe(2000);
    });

    it("deducts all expenses from monthBalanceCents", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.monthBalanceCents).toBe(241000); // 250000 - 4000 - 3000 - 2000
    });
  });

  // ─── Mid-month setup (remainingDailyBudget > 0) ───────────────────────────

  describe("Mid-month budget setup (remainingDailyBudget > 0)", () => {
    const midMonthConfig = {
      ...BASE_CONFIG,
      remainingDailyBudget: 100000, // R$1000 remaining from initial allocation
      startDay: 11,
    };

    beforeEach(() => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(
        midMonthConfig,
      );
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);
    });

    it("uses remainingDailyBudget as adjusted budget (monthBalanceCents=100000)", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.monthBalanceCents).toBe(100000);
    });

    it("computes recommendedForFuture from adjusted budget", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      // floor(100000 / 20) = 5000
      expect(result.recommendedForFuture).toBe(5000);
    });

    it("returns isConfigured=true", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.isConfigured).toBe(true);
    });
  });

  // ─── Simulation via extraExpenseCents ─────────────────────────────────────

  describe("Simulation via extraExpenseCents", () => {
    beforeEach(() => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(BASE_CONFIG);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);
    });

    it("adds extraExpenseCents to todaySpentCents", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
        3000,
      );
      expect(result.todaySpentCents).toBe(3000);
    });

    it("deducts extraExpenseCents from monthBalanceCents", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
        3000,
      );
      expect(result.monthBalanceCents).toBe(247000); // 250000 - 3000
    });

    it("combines real expenses with simulated expense", async () => {
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([
        makeExpense({ id: "exp-real", date: "2026-03-11", amount: 2000 }),
      ]);

      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
        5000,
      );

      expect(result.todaySpentCents).toBe(7000); // 2000 real + 5000 simulated
      expect(result.monthBalanceCents).toBe(243000); // 250000 - 7000
    });

    it("does not add simulated expense when extraExpenseCents=0 (default)", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.todaySpentCents).toBe(0);
      expect(result.monthBalanceCents).toBe(250000);
    });
  });

  // ─── Last day of month ────────────────────────────────────────────────────

  describe("Last day of month (March 31, 2026)", () => {
    beforeEach(() => {
      vi.setSystemTime(new Date("2026-03-31T12:00:00Z"));
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(BASE_CONFIG);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([]);
    });

    afterEach(() => {
      vi.setSystemTime(FIXED_DATE);
    });

    it("returns daysLeft=0", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.daysLeft).toBe(0);
    });

    it("returns recommendedForFuture=0 (no days remaining after today)", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.recommendedForFuture).toBe(0);
    });
  });

  // ─── Negative balance (over budget) ──────────────────────────────────────

  describe("Over-budget scenario", () => {
    beforeEach(() => {
      vi.mocked(budgetRepo.findByUserAndMonth).mockResolvedValue(BASE_CONFIG);
      vi.mocked(dailyExpenseRepo.findByUserAndDateRange).mockResolvedValue([
        makeExpense({ id: "exp-huge", date: "2026-03-10", amount: 999999 }),
      ]);
    });

    it("returns recommendedTodayCents >= 0 even when over budget", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.recommendedTodayCents).toBe(0);
    });

    it("returns recommendedForFuture >= 0 even when over budget", async () => {
      const result = await getBotFinancialStatus(
        userId,
        budgetRepo,
        dailyExpenseRepo,
      );
      expect(result.recommendedForFuture).toBe(0);
    });
  });
});
