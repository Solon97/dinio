import {
  calculateDailyHistory,
  calculateFinancialMetrics,
  getCurrentDate,
  normalizeExpenseDueDays,
} from "@/app/api/budget/helpers";
import { DailyExpenseRow, DailyHistoryRecord } from "@/types/budget";
import { CreditCard, ExpenseType, FixedExpense } from "@/types/finance";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("getCurrentDate (timezone-aware)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns last day for a past month", () => {
    // Jan 2026 current; check December 2025 -> should return 31
    const day = getCurrentDate(11, 2025);
    expect(day).toBe(31);
  });

  it("returns 0 for a future month", () => {
    // Far future
    const day = getCurrentDate(0, 2030);
    expect(day).toBe(0);
  });

  it("returns the current day considering timezone (fixed date)", () => {
    // Use a fixed system time so the test is deterministic across environments.
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    const fixed = new Date("2026-01-15T12:00:00Z");
    const tzDay = getCurrentDate(fixed.getMonth(), fixed.getFullYear());
    // 2026-01-15T12:00:00Z corresponds to Jan 15 in the Sao_Paulo timezone used by helpers
    expect(tzDay).toBe(15);
  });

  it("handles midnight edge case in Sao Paulo (23:30 UTC = 20:30 BRT, same day)", () => {
    // 2026-01-15T23:30:00Z = 2026-01-15 20:30 in America/Sao_Paulo (UTC-3)
    // Should still be Jan 15 in Sao Paulo timezone
    vi.setSystemTime(new Date("2026-01-15T23:30:00Z"));
    const day = getCurrentDate(0, 2026); // Jan 2026
    expect(day).toBe(15);
  });

  it("handles midnight edge case in Sao Paulo (02:30 UTC = next day in BRT)", () => {
    // 2026-01-16T02:30:00Z = 2026-01-15 23:30 in America/Sao_Paulo (UTC-3)
    // Should be Jan 15 in Sao Paulo timezone
    vi.setSystemTime(new Date("2026-01-16T02:30:00Z"));
    const day = getCurrentDate(0, 2026); // Jan 2026
    expect(day).toBe(15);
  });

  it("handles exact midnight UTC (should be previous day in Sao Paulo)", () => {
    // 2026-01-15T00:00:00Z = 2026-01-14 21:00 in America/Sao_Paulo (UTC-3)
    // Should be Jan 14 in Sao Paulo timezone
    vi.setSystemTime(new Date("2026-01-15T00:00:00Z"));
    const day = getCurrentDate(0, 2026); // Jan 2026
    expect(day).toBe(14);
  });

  it("handles month boundary at midnight (end of Jan in Sao Paulo)", () => {
    // 2026-02-01T02:59:59Z = 2026-01-31 23:59:59 in America/Sao_Paulo (UTC-3)
    // Should still be Jan 31 in Sao Paulo timezone
    vi.setSystemTime(new Date("2026-02-01T02:59:59Z"));
    const day = getCurrentDate(0, 2026); // Jan 2026
    expect(day).toBe(31);
  });

  it("handles month transition (start of Feb in Sao Paulo)", () => {
    // 2026-02-01T03:00:00Z = 2026-02-01 00:00 in America/Sao_Paulo (UTC-3)
    // Now it's Feb 1 in Sao Paulo timezone, so getCurrentDate for Jan should return 31 (past month)
    vi.setSystemTime(new Date("2026-02-01T03:00:00Z"));
    const day = getCurrentDate(0, 2026); // Jan 2026
    expect(day).toBe(31); // Past month, return last day
  });
});

describe("calculateDailyHistory (edge cases)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("properly groups expenses that fall on month boundary using Sao Paulo timezone", () => {
    const month = 0; // Jan
    const year = 2026;
    const currentDay = 31; // Assume viewing past month
    // Use noon UTC to ensure dates are interpreted correctly in Sao Paulo (UTC-3)
    const expenses: DailyExpenseRow[] = [
      {
        id: "1",
        user_id: "test-user",
        month_id: 202601,
        date: "2026-01-01",
        amount: 1000,
        description: "Test expense",
        category: "Outros",
        time: null,
        created_at: "2026-01-01T12:00:00Z",
        updated_at: "2026-01-01T12:00:00Z",
      },
      {
        id: "2",
        user_id: "test-user",
        month_id: 202601,
        date: "2026-01-15",
        amount: 2000,
        description: "Test expense 2",
        category: "Outros",
        time: null,
        created_at: "2026-01-15T12:00:00Z",
        updated_at: "2026-01-15T12:00:00Z",
      },
    ];
    const history = calculateDailyHistory(
      month,
      year,
      100000,
      expenses,
      1,
      currentDay,
    );
    // Ensure day 1 and day 15 exist and sums match
    expect(history.find((h) => h.day === 1)?.spent).toBe(1000);
    expect(history.find((h) => h.day === 15)?.spent).toBe(2000);
  });

  it("handles an empty expenses list and computes limits across days", () => {
    const month = 1; // Feb
    const year = 2026;
    const currentDay = 15;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const history = calculateDailyHistory(
      month,
      year,
      10000,
      [],
      1,
      currentDay,
    );
    expect(history.length).toBe(daysInMonth);
    // When no expenses, spent is 0 and limits are non-negative
    history.forEach((h) => {
      expect(h.spent).toBe(0);
      expect(h.limit).toBeGreaterThanOrEqual(0);
    });
  });

  it("correctly groups expenses near midnight in Sao Paulo timezone", () => {
    const month = 0; // Jan
    const year = 2026;
    const currentDay = 31; // Viewing past month
    // Use noon UTC to ensure dates are interpreted correctly in Sao Paulo (UTC-3)
    const expenses: DailyExpenseRow[] = [
      {
        id: "1",
        user_id: "test-user",
        month_id: 202601,
        date: "2026-01-02",
        amount: 5000,
        description: "Test expense",
        category: "Outros",
        time: null,
        created_at: "2026-01-02T12:00:00Z",
        updated_at: "2026-01-02T12:00:00Z",
      },
      {
        id: "2",
        user_id: "test-user",
        month_id: 202601,
        date: "2026-01-02",
        amount: 3000,
        description: "Test expense 2",
        category: "Outros",
        time: null,
        created_at: "2026-01-02T12:00:00Z",
        updated_at: "2026-01-02T12:00:00Z",
      },
    ];
    const history = calculateDailyHistory(
      month,
      year,
      100000,
      expenses,
      1,
      currentDay,
    );
    // Both expenses should be grouped on day 2
    expect(history.find((h) => h.day === 2)?.spent).toBe(8000);
    expect(history.find((h) => h.day === 1)?.spent).toBe(0);
  });

  it("handles expense on last day of month correctly in Sao Paulo timezone", () => {
    const month = 0; // Jan (31 days)
    const year = 2026;
    const currentDay = 31;
    const expenses: DailyExpenseRow[] = [
      {
        id: "1",
        user_id: "test-user",
        month_id: 202601,
        date: "2026-01-31",
        amount: 10000,
        description: "Test expense",
        category: "Outros",
        time: null,
        created_at: "2026-01-31T12:00:00Z",
        updated_at: "2026-01-31T12:00:00Z",
      },
    ];
    const history = calculateDailyHistory(
      month,
      year,
      100000,
      expenses,
      1,
      currentDay,
    );
    // Expense should be on day 31
    expect(history.find((h) => h.day === 31)?.spent).toBe(10000);
    expect(history.length).toBe(31);
  });

  describe("future expense handling", () => {
    it("should reduce budget from day 1 when future expense exists", () => {
      // Fix system time so tests don't depend on the machine clock
      vi.setSystemTime(new Date("2026-02-11T12:00:00Z"));

      const month = 1; // Feb (28 days in 2026)
      const year = 2026;
      const currentDay = 11; // Today is Feb 11
      const budgetCents = 280000; // 2800 reais for the month
      const futureExpenseCents = 30000; // 300 reais on day 20

      const expenses: DailyExpenseRow[] = [
        {
          id: "1",
          user_id: "test-user",
          month_id: 202602,
          date: "2026-02-20", // Future date
          amount: futureExpenseCents,
          description: "Future expense",
          category: "Alimentação",
          time: null,
          created_at: "2026-02-11T12:00:00Z",
          updated_at: "2026-02-11T12:00:00Z",
        },
      ];

      const history = calculateDailyHistory(
        month,
        year,
        budgetCents,
        expenses,
        1,
        currentDay,
      );

      // Day 1: remaining budget = 280000 - 30000 = 250000, remaining days = 28
      // Expected limit = Math.floor(250000 / 28) = 8928
      const day1 = history.find((h) => h.day === 1);
      const expectedDay1Limit = Math.floor(
        (budgetCents - futureExpenseCents) / 28,
      );
      expect(day1!.limit).toBe(expectedDay1Limit);

      // Day 11: remaining budget = 250000 (no spending), remaining days = 18
      // Expected limit = Math.floor(250000 / 18) = 13888
      const day11 = history.find((h) => h.day === 11);
      const expectedDay11Limit = Math.floor(
        (budgetCents - futureExpenseCents) / (28 - 11 + 1),
      );
      expect(day11!.limit).toBe(expectedDay11Limit);

      // Verify that future commitment reduced the budget across all days
      expect(expectedDay1Limit).toBeLessThan(Math.floor(budgetCents / 28));
    });

    it("should handle multiple future expenses on different days", () => {
      // Fix system time so tests don't depend on the machine clock
      vi.setSystemTime(new Date("2026-02-11T12:00:00Z"));

      const month = 1; // Feb (28 days)
      const year = 2026;
      const currentDay = 11;
      const budgetCents = 280000;

      const expenses: DailyExpenseRow[] = [
        {
          id: "1",
          user_id: "test-user",
          month_id: 202602,
          date: "2026-02-15",
          amount: 10000,
          description: "Future expense 1",
          category: "Alimentação",
          time: null,
          created_at: "2026-02-11T12:00:00Z",
          updated_at: "2026-02-11T12:00:00Z",
        },
        {
          id: "2",
          user_id: "test-user",
          month_id: 202602,
          date: "2026-02-20",
          amount: 20000,
          description: "Future expense 2",
          category: "Transporte",
          time: null,
          created_at: "2026-02-11T12:00:00Z",
          updated_at: "2026-02-11T12:00:00Z",
        },
      ];

      const history = calculateDailyHistory(
        month,
        year,
        budgetCents,
        expenses,
        1,
        currentDay,
      );

      // Total future expenses: 30000
      // Available for daily: 280000 - 30000 = 250000
      // Daily limit: 250000 / 28 ≈ 8928
      const expectedLimit = Math.floor((budgetCents - 30000) / 28);

      const day1 = history.find((h) => h.day === 1);
      expect(day1!.limit).toBe(expectedLimit);

      // Both future days should have transactions but 0 spent
      const day15 = history.find((h) => h.day === 15);
      expect(day15!.spent).toBe(0);
      expect(day15!.transactions.length).toBe(1);

      const day20 = history.find((h) => h.day === 20);
      expect(day20!.spent).toBe(0);
      expect(day20!.transactions.length).toBe(1);
    });

    it("should handle future expense on the last day of month", () => {
      // Fix system time so tests don't depend on the machine clock
      vi.setSystemTime(new Date("2026-02-11T12:00:00Z"));

      const month = 1; // Feb (28 days)
      const year = 2026;
      const currentDay = 11;

      const expenses: DailyExpenseRow[] = [
        {
          id: "1",
          user_id: "test-user",
          month_id: 202602,
          date: "2026-02-28", // Last day
          amount: 50000,
          description: "Future expense on last day",
          category: "Outros",
          time: null,
          created_at: "2026-02-11T12:00:00Z",
          updated_at: "2026-02-11T12:00:00Z",
        },
      ];

      const history = calculateDailyHistory(
        month,
        year,
        100000,
        expenses,
        1,
        currentDay,
      );

      const day28 = history.find((h) => h.day === 28);
      expect(day28).toBeDefined();
      expect(day28!.spent).toBe(0);
      expect(day28!.transactions.length).toBe(1);
      expect(day28!.transactions[0].amount).toBe(50000);
    });
  });
});

describe("normalizeExpenseDueDays", () => {
  it("should override expense dueDay with card dueDay when creditCardId is set", () => {
    const creditCards: CreditCard[] = [
      {
        id: "card-1",
        name: "Nubank",
        dueDay: 15,
        limit: 500000,
        color: "#8A05BE",
      },
      {
        id: "card-2",
        name: "Inter",
        dueDay: 25,
        limit: 300000,
        color: "#FF7A00",
      },
    ];

    const expenses: FixedExpense[] = [
      {
        id: "exp-1",
        name: "Netflix",
        amount: 5000,
        dueDay: 1, // Wrong dueDay
        type: ExpenseType.DISCRETIONARY,
        paid: false,
        creditCardId: "card-1", // Should use card-1 dueDay = 15
      },
      {
        id: "exp-2",
        name: "Spotify",
        amount: 3000,
        dueDay: 10, // Wrong dueDay
        type: ExpenseType.DISCRETIONARY,
        paid: false,
        creditCardId: "card-2", // Should use card-2 dueDay = 25
      },
    ];

    const normalized = normalizeExpenseDueDays(expenses, creditCards);

    expect(normalized[0].dueDay).toBe(15); // Netflix uses Nubank dueDay
    expect(normalized[1].dueDay).toBe(25); // Spotify uses Inter dueDay
  });

  it("should keep original dueDay for expenses without creditCardId", () => {
    const creditCards: CreditCard[] = [
      {
        id: "card-1",
        name: "Nubank",
        dueDay: 15,
        limit: 500000,
        color: "#8A05BE",
      },
    ];

    const expenses: FixedExpense[] = [
      {
        id: "exp-1",
        name: "Rent",
        amount: 150000,
        dueDay: 5,
        type: ExpenseType.MANDATORY,
        paid: false,
        // No creditCardId
      },
    ];

    const normalized = normalizeExpenseDueDays(expenses, creditCards);

    expect(normalized[0].dueDay).toBe(5); // Keep original dueDay
  });

  it("should keep expense as-is when creditCardId points to non-existent card", () => {
    const creditCards: CreditCard[] = [
      {
        id: "card-1",
        name: "Nubank",
        dueDay: 15,
        limit: 500000,
        color: "#8A05BE",
      },
    ];

    const expenses: FixedExpense[] = [
      {
        id: "exp-1",
        name: "Old subscription",
        amount: 2000,
        dueDay: 10,
        type: ExpenseType.DISCRETIONARY,
        paid: false,
        creditCardId: "card-deleted", // Card doesn't exist
      },
    ];

    const normalized = normalizeExpenseDueDays(expenses, creditCards);

    expect(normalized[0].dueDay).toBe(10); // Keep original when card not found
    expect(normalized[0].creditCardId).toBe("card-deleted");
  });

  it("should handle mixed expenses (with and without cards)", () => {
    const creditCards: CreditCard[] = [
      {
        id: "card-1",
        name: "Nubank",
        dueDay: 20,
        limit: 500000,
        color: "#8A05BE",
      },
    ];

    const expenses: FixedExpense[] = [
      {
        name: "Rent",
        amount: 150000,
        dueDay: 5,
        type: ExpenseType.MANDATORY,
        paid: false,
      },
      {
        name: "Netflix",
        amount: 5000,
        dueDay: 1,
        type: ExpenseType.DISCRETIONARY,
        paid: false,
        creditCardId: "card-1",
      },
      {
        name: "Internet",
        amount: 10000,
        dueDay: 10,
        type: ExpenseType.MANDATORY,
        paid: false,
      },
    ];

    const normalized = normalizeExpenseDueDays(expenses, creditCards);

    expect(normalized[0].dueDay).toBe(5); // Rent keeps original
    expect(normalized[1].dueDay).toBe(20); // Netflix uses card dueDay
    expect(normalized[2].dueDay).toBe(10); // Internet keeps original
  });
});

describe("calculateFinancialMetrics", () => {
  it("should calculate metrics correctly for full-month configuration", () => {
    // Arrange: Full month with no mid-month adjustment
    const dailyBudgetCents = 100000; // R$ 1000 daily budget
    const adjustedDailyBudgetCents = 100000; // Same as dailyBudget (no adjustment)
    const remainingDailyBudgetCents = 0; // No mid-month setup
    const daysInMonth = 31;
    const budgetStartDay = 1;

    // Simulated history: spent 20000 total
    const dailyHistory: DailyHistoryRecord[] = [
      {
        day: 1,
        date: "2026-01-01",
        limit: 3225,
        spent: 5000,
        cumulativeSpent: 5000,
        breakdown: {},
        transactions: [],
      },
      {
        day: 2,
        date: "2026-01-02",
        limit: 3166,
        spent: 10000,
        cumulativeSpent: 15000,
        breakdown: {},
        transactions: [],
      },
      {
        day: 3,
        date: "2026-01-03",
        limit: 2931,
        spent: 5000,
        cumulativeSpent: 20000,
        breakdown: {},
        transactions: [],
      },
    ];

    // Act
    const metrics = calculateFinancialMetrics({
      dailyBudgetCents,
      adjustedDailyBudgetCents,
      remainingDailyBudgetCents,
      dailyHistory,
      daysInMonth,
      budgetStartDay,
      currentDay: 3,
    });

    // Assert
    expect(metrics.initialAvailableCents).toBe(100000); // Full allocation
    expect(metrics.initialLimitCents).toBe(Math.floor(100000 / 31)); // 3225
    expect(metrics.totalSpentCents).toBe(20000); // Sum of spent
    expect(metrics.remainingBalanceCents).toBe(80000); // 100000 - 20000
    expect(metrics.balanceProgress).toBe(80); // 80000 / 100000 * 100
    expect(metrics.recommendedDailyAverageCents).toBe(2931); // (80000 + 5000) / 29
    expect(metrics.currentDailyAverageCents).toBe(6666); // 20000 / 3
    expect(metrics.projectedMonthEndBalanceCents).toBe(-106648);
    expect(metrics.projectedBudgetDurationDays).toBe(12);
  });

  it("should calculate metrics correctly for mid-month configuration", () => {
    // Arrange: Mid-month setup on day 15 (17 days remaining)
    const dailyBudgetCents = 100000; // R$ 1000 daily budget (percentage-based)
    const remainingDailyBudgetCents = 60000; // User wants R$ 600 remaining
    const adjustedDailyBudgetCents = 60000; // Equals remainingDailyBudget
    const daysInMonth = 31;
    const budgetStartDay = 15; // Started on day 15

    // Simulated history: spent 20000 from the 60000 available
    const dailyHistory: DailyHistoryRecord[] = [
      {
        day: 15,
        date: "2026-01-15",
        limit: 3529,
        spent: 10000,
        cumulativeSpent: 10000,
        breakdown: {},
        transactions: [],
      },
      {
        day: 16,
        date: "2026-01-16",
        limit: 3125,
        spent: 10000,
        cumulativeSpent: 20000,
        breakdown: {},
        transactions: [],
      },
    ];

    // Act
    const metrics = calculateFinancialMetrics({
      dailyBudgetCents,
      adjustedDailyBudgetCents,
      remainingDailyBudgetCents,
      dailyHistory,
      daysInMonth,
      budgetStartDay,
      currentDay: 16,
    });

    // Assert
    expect(metrics.initialAvailableCents).toBe(100000); // FULL allocation (not adjusted)
    expect(metrics.initialLimitCents).toBe(Math.floor(60000 / 17)); // 3529 (adjusted / days)
    expect(metrics.totalSpentCents).toBe(20000);
    expect(metrics.remainingBalanceCents).toBe(40000); // 60000 - 20000
    // Balance progress relative to FULL budget: 40000 / 100000 = 40%
    // This shows user has used 60% of the full allocation (40% as mid-month setup, 20% as actual spending)
    expect(metrics.balanceProgress).toBe(40);
    expect(metrics.recommendedDailyAverageCents).toBe(3125); // (40000 + 10000) / 16
    expect(metrics.currentDailyAverageCents).toBe(10000); // 20000 / 2 days since budget start
    expect(metrics.projectedMonthEndBalanceCents).toBe(-110000); // 40000 - (10000 * 15)
    expect(metrics.projectedBudgetDurationDays).toBe(4); // floor(40000 / 10000)
  });

  it("should handle zero budget correctly", () => {
    // Arrange
    const dailyBudgetCents = 0;
    const adjustedDailyBudgetCents = 0;
    const remainingDailyBudgetCents = 0;
    const daysInMonth = 31;
    const budgetStartDay = 1;
    const dailyHistory: DailyHistoryRecord[] = [];

    // Act
    const metrics = calculateFinancialMetrics({
      dailyBudgetCents,
      adjustedDailyBudgetCents,
      remainingDailyBudgetCents,
      dailyHistory,
      daysInMonth,
      budgetStartDay,
      currentDay: 1,
    });

    // Assert
    expect(metrics.initialAvailableCents).toBe(0);
    expect(metrics.initialLimitCents).toBe(0);
    expect(metrics.totalSpentCents).toBe(0);
    expect(metrics.remainingBalanceCents).toBe(0);
    expect(metrics.balanceProgress).toBe(0);
    expect(metrics.recommendedDailyAverageCents).toBe(0);
    expect(metrics.currentDailyAverageCents).toBe(0);
    expect(metrics.projectedMonthEndBalanceCents).toBe(0);
    expect(metrics.projectedBudgetDurationDays).toBe(31);
  });

  it("should show negative balance progress when overspent in mid-month scenario", () => {
    // Arrange: Mid-month with 60000 remaining, but spent 80000
    const dailyBudgetCents = 100000;
    const remainingDailyBudgetCents = 60000;
    const adjustedDailyBudgetCents = 60000;
    const daysInMonth = 31;
    const budgetStartDay = 15;

    const dailyHistory: DailyHistoryRecord[] = [
      {
        day: 15,
        date: "2026-01-15",
        limit: 3529,
        spent: 40000,
        cumulativeSpent: 40000,
        breakdown: {},
        transactions: [],
      },
      {
        day: 16,
        date: "2026-01-16",
        limit: 0,
        spent: 40000,
        cumulativeSpent: 80000,
        breakdown: {},
        transactions: [],
      },
    ];

    // Act
    const metrics = calculateFinancialMetrics({
      dailyBudgetCents,
      adjustedDailyBudgetCents,
      remainingDailyBudgetCents,
      dailyHistory,
      daysInMonth,
      budgetStartDay,
      currentDay: 16,
    });

    // Assert
    expect(metrics.initialAvailableCents).toBe(100000);
    expect(metrics.totalSpentCents).toBe(80000);
    expect(metrics.remainingBalanceCents).toBe(-20000); // 60000 - 80000
    // Negative balance progress: -20000 / 100000 = -20%
    expect(metrics.balanceProgress).toBe(-20);
    expect(metrics.recommendedDailyAverageCents).toBe(1250); // (-20000 + 40000) / 16
    expect(metrics.currentDailyAverageCents).toBe(40000); // 80000 / 2 days since budget start
    expect(metrics.projectedBudgetDurationDays).toBe(0);
  });

  it("should preserve initialAvailable as full allocation even in mid-month", () => {
    // This test specifically ensures initialAvailable is NOT affected by mid-month adjustments
    const dailyBudgetCents = 200000; // R$ 2000
    const remainingDailyBudgetCents = 50000; // Only R$ 500 remaining
    const adjustedDailyBudgetCents = 50000;
    const daysInMonth = 30;
    const budgetStartDay = 20;

    const dailyHistory: DailyHistoryRecord[] = [];

    // Act
    const metrics = calculateFinancialMetrics({
      dailyBudgetCents,
      adjustedDailyBudgetCents,
      remainingDailyBudgetCents,
      dailyHistory,
      daysInMonth,
      budgetStartDay,
      currentDay: 20,
    });

    // Assert: initialAvailable must ALWAYS be the full dailyBudget
    expect(metrics.initialAvailableCents).toBe(200000); // NOT 50000!
    expect(metrics.initialLimitCents).toBe(Math.floor(50000 / 11)); // 4545 (adjusted)
    expect(metrics.remainingBalanceCents).toBe(50000); // From adjusted budget
    expect(metrics.balanceProgress).toBe(25); // 50000 / 200000 = 25%
    expect(metrics.recommendedDailyAverageCents).toBe(4545); // 50000 / 11
    expect(metrics.currentDailyAverageCents).toBe(0);
    expect(metrics.projectedMonthEndBalanceCents).toBe(50000);
    expect(metrics.projectedBudgetDurationDays).toBe(11);
  });

  it("should calculate remaining balance including future expenses", () => {
    const dailyBudgetCents = 100000;
    const adjustedDailyBudgetCents = 100000;
    const remainingDailyBudgetCents = 0;
    const daysInMonth = 31;
    const budgetStartDay = 1;

    const dailyHistory: DailyHistoryRecord[] = [
      {
        day: 1,
        date: "2026-01-01",
        limit: 3225,
        spent: 10000,
        cumulativeSpent: 10000,
        breakdown: {},
        transactions: [
          {
            __type: "ExpenseResponse",
            id: "past-expense",
            date: "2026-01-01",
            amount: 10000,
            description: "Past expense",
            category: "food",
            createdAt: "2026-01-01T12:00:00.000Z",
          },
        ],
      },
      {
        day: 2,
        date: "2026-01-02",
        limit: 3225,
        spent: 5000,
        cumulativeSpent: 15000,
        breakdown: {},
        transactions: [
          {
            __type: "ExpenseResponse",
            id: "today-expense",
            date: "2026-01-02",
            amount: 5000,
            description: "Today expense",
            category: "food",
            createdAt: "2026-01-02T12:00:00.000Z",
          },
        ],
      },
      {
        day: 3,
        date: "2026-01-03",
        limit: 3225,
        spent: 0,
        cumulativeSpent: 15000,
        breakdown: {},
        transactions: [
          {
            __type: "ExpenseResponse",
            id: "future-expense",
            date: "2026-01-03",
            amount: 15000,
            description: "Future expense",
            category: "food",
            createdAt: "2026-01-03T12:00:00.000Z",
          },
        ],
      },
    ];

    const metrics = calculateFinancialMetrics({
      dailyBudgetCents,
      adjustedDailyBudgetCents,
      remainingDailyBudgetCents,
      dailyHistory,
      daysInMonth,
      budgetStartDay,
      currentDay: 2,
    });

    // remainingBalance = 100000 - (10000 + 5000 + 15000)
    expect(metrics.remainingBalanceCents).toBe(70000);
    // recommendedDailyAverage = (70000 + 5000) / 30
    expect(metrics.recommendedDailyAverageCents).toBe(2500);
  });

  describe("idealDailyAverageCents (fixed monthly pace)", () => {
    it("equals adjustedDailyBudgetCents / daysInMonth for a full-month configuration", () => {
      // R$ 1000 budget across 31 days = R$ 32.25/day
      const metrics = calculateFinancialMetrics({
        dailyBudgetCents: 100000,
        adjustedDailyBudgetCents: 100000,
        remainingDailyBudgetCents: 0,
        dailyHistory: [],
        daysInMonth: 31,
        budgetStartDay: 1,
        currentDay: 1,
      });

      expect(metrics.idealDailyAverageCents).toBe(Math.floor(100000 / 31)); // 3225
    });

    it("remains constant regardless of how much was spent during the month", () => {
      const adjustedDailyBudgetCents = 100000;
      const daysInMonth = 31;
      const expectedIdeal = Math.floor(adjustedDailyBudgetCents / daysInMonth); // 3225

      const spentHistory: DailyHistoryRecord[] = [
        {
          day: 1,
          date: "2026-01-01",
          limit: 3225,
          spent: 20000,
          cumulativeSpent: 20000,
          breakdown: {},
          transactions: [],
        },
        {
          day: 2,
          date: "2026-01-02",
          limit: 3225,
          spent: 15000,
          cumulativeSpent: 35000,
          breakdown: {},
          transactions: [],
        },
        {
          day: 3,
          date: "2026-01-03",
          limit: 3225,
          spent: 5000,
          cumulativeSpent: 40000,
          breakdown: {},
          transactions: [],
        },
      ];

      const earlyMetrics = calculateFinancialMetrics({
        dailyBudgetCents: adjustedDailyBudgetCents,
        adjustedDailyBudgetCents,
        remainingDailyBudgetCents: 0,
        dailyHistory: spentHistory.slice(0, 1),
        daysInMonth,
        budgetStartDay: 1,
        currentDay: 1,
      });

      const laterMetrics = calculateFinancialMetrics({
        dailyBudgetCents: adjustedDailyBudgetCents,
        adjustedDailyBudgetCents,
        remainingDailyBudgetCents: 0,
        dailyHistory: spentHistory,
        daysInMonth,
        budgetStartDay: 1,
        currentDay: 3,
      });

      expect(earlyMetrics.idealDailyAverageCents).toBe(expectedIdeal);
      expect(laterMetrics.idealDailyAverageCents).toBe(expectedIdeal);
    });

    it("uses adjustedDailyBudgetCents (not dailyBudgetCents) in mid-month setup", () => {
      // Full allocation is R$ 1000 but user set a mid-month budget of R$ 600
      // Ideal daily pace references the actual remaining budget, not the full allocation
      const metrics = calculateFinancialMetrics({
        dailyBudgetCents: 100000,
        adjustedDailyBudgetCents: 60000,
        remainingDailyBudgetCents: 60000,
        dailyHistory: [],
        daysInMonth: 31,
        budgetStartDay: 15,
        currentDay: 15,
      });

      expect(metrics.idealDailyAverageCents).toBe(Math.floor(60000 / 31)); // 1935
    });

    it("is 0 when budget is 0", () => {
      const metrics = calculateFinancialMetrics({
        dailyBudgetCents: 0,
        adjustedDailyBudgetCents: 0,
        remainingDailyBudgetCents: 0,
        dailyHistory: [],
        daysInMonth: 31,
        budgetStartDay: 1,
        currentDay: 1,
      });

      expect(metrics.idealDailyAverageCents).toBe(0);
    });
  });
});
