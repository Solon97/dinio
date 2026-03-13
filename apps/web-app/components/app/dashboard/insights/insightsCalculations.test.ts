import { describe, it, expect } from "vitest";
import { DailyRecord, FinancialStatus } from "@/types/finance";
import {
  calculateWeeklyAnalysis,
  calculateMonthProjection,
  analyzeFixedExpenses,
  analyzeReserve,
  getProjectionDisplay,
  getWeeklyDisplay,
  MonthProjection,
  WeeklyAnalysis,
  buildInsights,
} from "./insightsCalculations";

// Helper to create daily records for testing
function createDailyRecords(days: number, spentPerDay: number): DailyRecord[] {
  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    limit: 100,
    spent: spentPerDay,
    cumulativeSpent: spentPerDay * (i + 1),
    breakdown: {},
  }));
}

describe("calculateWeeklyAnalysis", () => {
  it("should calculate weekly spending correctly for full week", () => {
    const dailyHistory = createDailyRecords(30, 50);
    const currentDay = 15;
    const availableBudget = 3000;

    const result = calculateWeeklyAnalysis(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.weeklySpent).toBe(350); // 7 days * 50
    expect(result.weeklyPercentage).toBe(12); // (350/3000) * 100 rounded
    expect(result.isOverBudget).toBe(false);
    expect(result.status).toBe("positive");
  });

  it("should return negative status when over 25% of budget", () => {
    const dailyHistory = createDailyRecords(30, 150);
    const currentDay = 10;
    const availableBudget = 3000;

    const result = calculateWeeklyAnalysis(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.weeklySpent).toBe(1050); // 7 days * 150
    expect(result.weeklyPercentage).toBe(35);
    expect(result.isOverBudget).toBe(true);
    expect(result.status).toBe("negative");
  });

  it("should handle partial week at beginning of month", () => {
    const dailyHistory = createDailyRecords(30, 100);
    const currentDay = 3;
    const availableBudget = 2000;

    const result = calculateWeeklyAnalysis(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.weeklySpent).toBe(300); // 3 days * 100
    expect(result.weeklyPercentage).toBe(15);
    expect(result.isOverBudget).toBe(false);
    expect(result.status).toBe("positive");
  });

  it("should return zero percentage when budget is zero", () => {
    const dailyHistory = createDailyRecords(30, 50);
    const currentDay = 10;
    const availableBudget = 0;

    const result = calculateWeeklyAnalysis(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.weeklyPercentage).toBe(0);
  });

  it("should handle empty daily history", () => {
    const dailyHistory: DailyRecord[] = [];
    const currentDay = 1;
    const availableBudget = 1000;

    const result = calculateWeeklyAnalysis(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.weeklySpent).toBe(0);
    expect(result.weeklyPercentage).toBe(0);
    expect(result.isOverBudget).toBe(false);
    expect(result.status).toBe("positive");
  });

  it("should be exactly 25% at boundary (not over budget)", () => {
    const dailyHistory: DailyRecord[] = [
      { day: 1, limit: 100, spent: 250, cumulativeSpent: 250, breakdown: {} },
    ];
    const currentDay = 1;
    const availableBudget = 1000;

    const result = calculateWeeklyAnalysis(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.weeklyPercentage).toBe(25);
    expect(result.isOverBudget).toBe(false);
    expect(result.status).toBe("positive");
  });
});

describe("calculateMonthProjection", () => {
  it("should project positive balance when spending is under budget", () => {
    const dailyHistory = createDailyRecords(30, 50);
    const currentDay = 15;
    const availableBudget = 3000;

    const result = calculateMonthProjection(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.totalDaysInMonth).toBe(30);
    expect(result.daysPassed).toBe(15);
    expect(result.daysRemaining).toBe(15);
    expect(result.totalSpentToDate).toBe(750); // 15 * 50
    expect(result.dailyAverage).toBe(50);
    expect(result.projectedTotalSpending).toBe(1500); // 50 * 30
    expect(result.projectedBalance).toBe(1500); // 3000 - 1500
    expect(result.status).toBe("positive");
    expect(result.extraForReserve).toBe(1500);
    expect(result.shortfall).toBe(0);
  });

  it("should project negative balance when overspending", () => {
    const dailyHistory = createDailyRecords(30, 150);
    const currentDay = 10;
    const availableBudget = 3000;

    const result = calculateMonthProjection(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.dailyAverage).toBe(150);
    expect(result.projectedTotalSpending).toBe(4500); // 150 * 30
    expect(result.projectedBalance).toBe(-1500); // 3000 - 4500
    expect(result.status).toBe("negative");
    expect(result.extraForReserve).toBe(0);
    expect(result.shortfall).toBe(1500);
  });

  it("should return neutral status when exactly on budget", () => {
    const dailyHistory = createDailyRecords(30, 100);
    const currentDay = 15;
    const availableBudget = 3000; // 100 * 30 = 3000

    const result = calculateMonthProjection(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.projectedBalance).toBe(0);
    expect(result.status).toBe("neutral");
    expect(result.extraForReserve).toBe(0);
    expect(result.shortfall).toBe(0);
  });

  it("should handle first day of month", () => {
    const dailyHistory = createDailyRecords(30, 100);
    const currentDay = 1;
    const availableBudget = 3000;

    const result = calculateMonthProjection(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.totalSpentToDate).toBe(100);
    expect(result.dailyAverage).toBe(100);
    expect(result.projectedTotalSpending).toBe(3000);
  });

  it("should handle zero spending", () => {
    const dailyHistory = createDailyRecords(30, 0);
    const currentDay = 10;
    const availableBudget = 3000;

    const result = calculateMonthProjection(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.totalSpentToDate).toBe(0);
    expect(result.dailyAverage).toBe(0);
    expect(result.projectedTotalSpending).toBe(0);
    expect(result.projectedBalance).toBe(3000);
    expect(result.status).toBe("positive");
  });

  it("should return zero daily average when daysPassed is zero", () => {
    const dailyHistory = createDailyRecords(30, 100);
    const currentDay = 0;
    const availableBudget = 3000;

    const result = calculateMonthProjection(
      dailyHistory,
      currentDay,
      availableBudget,
    );

    expect(result.dailyAverage).toBe(0);
    expect(result.projectedTotalSpending).toBe(0);
  });
});

describe("analyzeFixedExpenses", () => {
  it("should calculate percentage correctly for healthy status", () => {
    const result = analyzeFixedExpenses(1500, 5000, FinancialStatus.HEALTHY);

    expect(result.fixedPercentage).toBe(30);
    expect(result.status).toBe("positive");
  });

  it("should return warning status for warning financial status", () => {
    const result = analyzeFixedExpenses(3500, 5000, FinancialStatus.WARNING);

    expect(result.fixedPercentage).toBe(70);
    expect(result.status).toBe("warning");
  });

  it("should return negative status for critical financial status", () => {
    const result = analyzeFixedExpenses(4500, 5000, FinancialStatus.CRITICAL);

    expect(result.fixedPercentage).toBe(90);
    expect(result.status).toBe("negative");
  });

  it("should cap percentage at 100", () => {
    const result = analyzeFixedExpenses(6000, 5000, FinancialStatus.CRITICAL);

    expect(result.fixedPercentage).toBe(100);
  });

  it("should handle zero income gracefully", () => {
    // Note: This will result in Infinity, then Math.min with 100
    const result = analyzeFixedExpenses(1000, 0, FinancialStatus.CRITICAL);

    expect(result.fixedPercentage).toBe(100);
  });
});

describe("analyzeReserve", () => {
  it("should return positive status when projected balance is positive", () => {
    const result = analyzeReserve(500, 200, 5000);

    expect(result.reservePercentage).toBe(10);
    expect(result.projectedReserve).toBe(700); // 500 + 200
    expect(result.projectedReservePercentage).toBe(14);
    expect(result.status).toBe("positive");
    expect(result.message).toContain("14%");
    expect(result.badge).toContain("% da renda");
  });

  it("should return warning status when using partial reserve", () => {
    const result = analyzeReserve(500, -200, 5000);

    expect(result.projectedReserve).toBe(300); // 500 - 200
    expect(result.amountUsedFromReserve).toBe(200);
    expect(result.status).toBe("warning");
    expect(result.message).toContain("Atenção");
    expect(result.message).toContain("200");
  });

  it("should return negative status when using all reserve and more", () => {
    const result = analyzeReserve(500, -800, 5000);

    expect(result.projectedReserve).toBe(-300); // 500 - 800
    expect(result.amountUsedFromReserve).toBe(500); // capped at reserveGoal
    expect(result.status).toBe("negative");
    expect(result.message).toContain("totalmente usada");
    expect(result.badge).toContain("-");
  });

  it("should handle zero projected balance as warning (breaking even)", () => {
    const result = analyzeReserve(500, 0, 5000);

    expect(result.projectedReserve).toBe(500);
    // Zero projected balance means breaking even - function treats this as warning
    // because projectedBalance <= 0 && abs(projectedBalance) < reserveGoal
    expect(result.status).toBe("warning");
    expect(result.badge).toContain("% da renda");
  });

  it("should handle zero income", () => {
    const result = analyzeReserve(500, 100, 0);

    expect(result.projectedReservePercentage).toBe(0);
  });
});

describe("getProjectionDisplay", () => {
  it("should return positive message for positive projection", () => {
    const projection: MonthProjection = {
      totalDaysInMonth: 30,
      daysPassed: 15,
      daysRemaining: 15,
      totalSpentToDate: 1000,
      dailyAverage: 66.67,
      projectedTotalSpending: 2000,
      projectedBalance: 500,
      status: "positive",
      extraForReserve: 500,
      shortfall: 0,
    };

    const result = getProjectionDisplay(projection);

    expect(result.status).toBe("positive");
    expect(result.message).toContain("economizar");
    expect(result.message).toContain("500");
    expect(result.badge).toContain("+");
  });

  it("should return negative message for negative projection", () => {
    const projection: MonthProjection = {
      totalDaysInMonth: 30,
      daysPassed: 15,
      daysRemaining: 15,
      totalSpentToDate: 2000,
      dailyAverage: 133.33,
      projectedTotalSpending: 4000,
      projectedBalance: -1000,
      status: "negative",
      extraForReserve: 0,
      shortfall: 1000,
    };

    const result = getProjectionDisplay(projection);

    expect(result.status).toBe("negative");
    expect(result.message).toContain("Atenção");
    expect(result.message).toContain("estourar");
    expect(result.badge).toContain("-");
  });

  it("should return neutral message for exact budget", () => {
    const projection: MonthProjection = {
      totalDaysInMonth: 30,
      daysPassed: 15,
      daysRemaining: 15,
      totalSpentToDate: 1500,
      dailyAverage: 100,
      projectedTotalSpending: 3000,
      projectedBalance: 0,
      status: "neutral",
      extraForReserve: 0,
      shortfall: 0,
    };

    const result = getProjectionDisplay(projection);

    expect(result.status).toBe("neutral");
    expect(result.message).toContain("exatamente no limite");
    expect(result.badge).toBe("R$ 0");
  });
});

describe("getWeeklyDisplay", () => {
  it("should return positive message when under budget", () => {
    const weekly: WeeklyAnalysis = {
      weeklySpent: 500,
      weeklyPercentage: 20,
      isOverBudget: false,
      status: "positive",
    };

    const result = getWeeklyDisplay(weekly);

    expect(result.status).toBe("positive");
    expect(result.message).toContain("Ótimo ritmo");
    expect(result.message).toContain("20%");
    expect(result.message).toContain("menos de 25%");
  });

  it("should return negative message when over budget", () => {
    const weekly: WeeklyAnalysis = {
      weeklySpent: 1000,
      weeklyPercentage: 35,
      isOverBudget: true,
      status: "negative",
    };

    const result = getWeeklyDisplay(weekly);

    expect(result.status).toBe("negative");
    expect(result.message).toContain("Atenção");
    expect(result.message).toContain("35%");
    expect(result.message).toContain("Ideal é menos de 25%");
  });
});

describe("buildInsights", () => {
  it("should build monthly insights with expected order and no duplicates", () => {
    const insights = buildInsights("monthly", {
      dailyHistory: createDailyRecords(30, 80),
      currentDay: 10,
      availableBudget: 3000,
      income: 5000,
      totalFixed: 1500,
      reserveGoal: 500,
      status: FinancialStatus.HEALTHY,
    });

    expect(insights.map((insight) => insight.id)).toEqual([
      "fixed-expenses",
      "weekly-summary",
      "month-end-projection",
      "reserve-projection",
    ]);

    const uniqueIds = new Set(insights.map((insight) => insight.id));
    expect(uniqueIds.size).toBe(insights.length);
  });

  it("should build daily insights with shared month projection and weekly summary", () => {
    const insights = buildInsights("daily", {
      dailyHistory: createDailyRecords(31, 100),
      currentDay: 10,
      availableBudget: 2000,
      recommendedDailyAverage: 100,
      currentDailyAverage: 120,
      projectedBudgetDurationDays: 2,
    });

    expect(insights.map((insight) => insight.id)).toEqual([
      "month-end-projection",
      "spending-pace",
      "today-feedback",
      "weekly-summary",
    ]);

    const projectionInsights = insights.filter(
      (insight) => insight.id === "month-end-projection",
    );
    expect(projectionInsights).toHaveLength(1);

    const spendingPace = insights.find(
      (insight) => insight.id === "spending-pace",
    );
    expect(spendingPace?.status).toBe("warning");
    expect(spendingPace?.badge).toBe("+20%");
  });
});
