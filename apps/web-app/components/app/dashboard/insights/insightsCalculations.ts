import { FinancialStatus } from "@/types/finance";
import { DailyHistoryRecord } from "@/types/budget";
import { financialStatusToInsightStatus, InsightStatus } from "./status";

export type InsightContext = "daily" | "monthly";

export type DashboardInsightId =
  | "fixed-expenses"
  | "weekly-summary"
  | "month-end-projection"
  | "reserve-projection"
  | "spending-pace"
  | "today-feedback"
  | "budget-duration";

export type DashboardInsightIcon =
  | "activity"
  | "trending-up"
  | "alert-triangle"
  | "target"
  | "piggy-bank"
  | "calendar-clock"
  | "calendar-range";

export interface DashboardInsight {
  id: DashboardInsightId;
  title: string;
  status: InsightStatus;
  badge: string;
  message: string;
  icon: DashboardInsightIcon;
  details?: string;
}

export interface BuildInsightsInput {
  dailyHistory: DailyHistoryRecord[];
  currentDay: number;
  availableBudget: number;
  income?: number;
  totalFixed?: number;
  reserveGoal?: number;
  status?: FinancialStatus;
  recommendedDailyAverage?: number;
  currentDailyAverage?: number;
  projectedBudgetDurationDays?: number;
}

export interface InsightsInput {
  dailyHistory: DailyHistoryRecord[];
  currentDay: number;
  income: number;
  totalFixed: number;
  reserveGoal: number;
  availableBudget: number;
  status: FinancialStatus;
}

export interface WeeklyAnalysis {
  weeklySpent: number;
  weeklyPercentage: number;
  isOverBudget: boolean;
  status: InsightStatus;
}

export interface MonthProjection {
  totalDaysInMonth: number;
  daysPassed: number;
  daysRemaining: number;
  totalSpentToDate: number;
  dailyAverage: number;
  projectedTotalSpending: number;
  projectedBalance: number;
  status: InsightStatus;
  extraForReserve: number;
  shortfall: number;
}

export interface FixedExpensesAnalysis {
  fixedPercentage: number;
  status: InsightStatus;
}

export interface ReserveAnalysis {
  reservePercentage: number;
  projectedReserve: number;
  projectedReservePercentage: number;
  amountUsedFromReserve: number;
  status: InsightStatus;
  message: string;
  badge: string;
}

export interface ProjectionDisplay {
  status: InsightStatus;
  message: string;
  badge: string;
}

export interface WeeklyDisplay {
  status: InsightStatus;
  message: string;
}

interface InsightDefinition {
  id: DashboardInsightId;
  contexts: InsightContext[];
  build: (input: BuildInsightsInput) => DashboardInsight | null;
}

// Calculate weekly spending analysis
export function calculateWeeklyAnalysis(
  dailyHistory: DailyHistoryRecord[],
  currentDay: number,
  availableBudget: number,
): WeeklyAnalysis {
  const recentDays = dailyHistory.filter(
    (d) => d.day <= currentDay && d.day > currentDay - 7,
  );

  const weeklySpent = recentDays.reduce((acc, day) => acc + day.spent, 0);
  const weeklyPercentage =
    availableBudget > 0 ? Math.round((weeklySpent / availableBudget) * 100) : 0;
  const isOverBudget = weeklyPercentage > 25;
  const status: InsightStatus = isOverBudget ? "negative" : "positive";

  return { weeklySpent, weeklyPercentage, isOverBudget, status };
}

// Calculate end of month projection
export function calculateMonthProjection(
  dailyHistory: DailyHistoryRecord[],
  currentDay: number,
  availableBudget: number,
): MonthProjection {
  const totalDaysInMonth = dailyHistory.length;
  const daysPassed = currentDay;
  const daysRemaining = totalDaysInMonth - daysPassed;

  const totalSpentToDate = dailyHistory
    .filter((d) => d.day <= currentDay)
    .reduce((acc, day) => acc + day.spent, 0);

  const dailyAverage = daysPassed > 0 ? totalSpentToDate / daysPassed : 0;

  const projectedTotalSpending = dailyAverage * totalDaysInMonth;
  const projectedBalance = availableBudget - projectedTotalSpending;

  const getStatus = (): InsightStatus => {
    if (projectedBalance > 0) return "positive";
    if (projectedBalance < 0) return "negative";
    return "neutral";
  };

  const status = getStatus();
  const extraForReserve = projectedBalance > 0 ? projectedBalance : 0;
  const shortfall = projectedBalance < 0 ? Math.abs(projectedBalance) : 0;

  return {
    totalDaysInMonth,
    daysPassed,
    daysRemaining,
    totalSpentToDate,
    dailyAverage,
    projectedTotalSpending,
    projectedBalance,
    status,
    extraForReserve,
    shortfall,
  };
}

// Analyze fixed expenses
export function analyzeFixedExpenses(
  totalFixed: number,
  income: number,
  financialStatus: FinancialStatus,
): FixedExpensesAnalysis {
  const fixedPercentage = Math.min(
    Math.round((totalFixed / income) * 100),
    100,
  );

  const status = financialStatusToInsightStatus(financialStatus);

  return {
    fixedPercentage,
    status,
  };
}

// Analyze reserve projection
export function analyzeReserve(
  reserveGoal: number,
  projectedBalance: number,
  income: number,
): ReserveAnalysis {
  const reservePercentage = Math.round((reserveGoal / income) * 100);
  const projectedReserve = reserveGoal + projectedBalance;
  const projectedReservePercentage =
    income > 0 ? Math.round((projectedReserve / income) * 100) : 0;
  const amountUsedFromReserve = Math.min(
    Math.abs(projectedBalance),
    reserveGoal,
  );

  const getStatus = (): InsightStatus => {
    //? Reserva projetada maior que zero = positive
    if (projectedBalance > 0) return "positive";
    //? Reserva projetada menor ou igual a zero e menor que reserveGoal = warning
    if (projectedBalance <= 0 && Math.abs(projectedBalance) < reserveGoal)
      return "warning";
    return "negative";
  };

  const getMessage = (): string => {
    //? Reserva projetada maior que zero
    if (projectedBalance > 0) {
      return `Se mantiver a média de gastos, sua reserva pode chegar a ${projectedReservePercentage}% (R$ ${Math.round(
        projectedReserve,
      ).toLocaleString("pt-BR")}).`;
    }
    //? Reserva projetada menor ou igual a zero e menor que reserveGoal
    if (projectedBalance <= 0 && Math.abs(projectedBalance) < reserveGoal) {
      return `Atenção! Se mantiver a média de gastos, R$ ${Math.round(
        amountUsedFromReserve,
      ).toLocaleString(
        "pt-BR",
      )} da reserva serão usados. Restam R$ ${Math.round(
        projectedReserve,
      ).toLocaleString("pt-BR")}.`;
    }

    if (projectedBalance < 0) {
      return `Atenção! Se mantiver a média de gastos, a reserva será totalmente usada e ainda faltarão R$ ${Math.abs(
        Math.round(projectedReserve),
      ).toLocaleString("pt-BR")}.`;
    }

    return `Reserva planejada de ${reservePercentage}% (R$ ${reserveGoal.toLocaleString(
      "pt-BR",
    )}).`;
  };

  const getBadge = (): string => {
    //? Reserva projetada maior que zero
    if (projectedBalance >= 0) {
      return `${projectedReservePercentage}% da renda`;
    }
    if (projectedBalance < 0) {
      //? Se usar toda a reserva, mostrar com sinal de menos
      const usedAllReserve = Math.abs(projectedBalance) > reserveGoal;
      return `${usedAllReserve ? "-" : ""}R$ ${Math.round(
        Math.abs(projectedReserve),
      ).toLocaleString("pt-BR")}`;
    }
    return `${projectedReservePercentage}% da renda`;
  };

  return {
    reservePercentage,
    projectedReserve,
    projectedReservePercentage,
    amountUsedFromReserve,
    status: getStatus(),
    message: getMessage(),
    badge: getBadge(),
  };
}

// Get projection display properties
export function getProjectionDisplay(
  projection: MonthProjection,
): ProjectionDisplay {
  const getMessage = (): string => {
    if (projection.status === "positive") {
      return `Com base na média de gastos, no ritmo atual você pode economizar R$ ${Math.round(
        projection.extraForReserve,
      ).toLocaleString("pt-BR")} para a reserva!`;
    }
    if (projection.status === "negative") {
      return `Atenção! Com base na média de gastos, no ritmo atual você pode estourar R$ ${Math.round(
        projection.shortfall,
      ).toLocaleString("pt-BR")} do orçamento.`;
    }
    return "De acordo com a média de gastos, no ritmo atual você deve fechar o mês exatamente no limite.";
  };

  const getBadge = (): string => {
    const sign =
      projection.status === "positive"
        ? "+"
        : projection.status === "negative"
          ? "-"
          : "";
    return `${sign}R$ ${Math.abs(
      Math.round(projection.projectedBalance),
    ).toLocaleString("pt-BR")}`;
  };

  return {
    status: projection.status,
    message: getMessage(),
    badge: getBadge(),
  };
}

// Get weekly analysis display properties
export function getWeeklyDisplay(weekly: WeeklyAnalysis): WeeklyDisplay {
  const message = weekly.isOverBudget
    ? `Atenção! Nos últimos 7 dias, você gastou ${weekly.weeklyPercentage}% do orçamento mensal. Ideal é menos de 25% por semana.`
    : `Ótimo ritmo! Nos últimos 7 dias, você gastou ${weekly.weeklyPercentage}% do orçamento mensal (menos de 25%).`;

  return { status: weekly.status, message };
}

function formatCurrency(value: number): string {
  return `R$ ${Math.round(Math.abs(value)).toLocaleString("pt-BR")}`;
}

function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatCurrency(value)}`;
}

function getDeltaStatus(delta: number): InsightStatus {
  if (delta < 0) return "positive";
  if (delta > 0) return "warning";
  return "positive";
}

function buildFixedExpensesInsight(
  input: BuildInsightsInput,
): DashboardInsight | null {
  if (
    typeof input.income !== "number" ||
    typeof input.totalFixed !== "number" ||
    typeof input.status === "undefined"
  ) {
    return null;
  }

  const fixedExpenses = analyzeFixedExpenses(
    input.totalFixed,
    input.income,
    input.status,
  );

  return {
    id: "fixed-expenses",
    title: "Gastos Fixos",
    status: fixedExpenses.status,
    badge: `${fixedExpenses.fixedPercentage}% da renda`,
    message:
      fixedExpenses.fixedPercentage >= 50
        ? "Priorize renegociar ou cortar gastos fixos nos próximos meses."
        : "Os gastos fixos estão sob controle. Continue assim.",
    icon: "activity",
  };
}

function buildWeeklySummaryInsight(
  input: BuildInsightsInput,
): DashboardInsight | null {
  const weekly = calculateWeeklyAnalysis(
    input.dailyHistory,
    input.currentDay,
    input.availableBudget,
  );
  const weeklyDisplay = getWeeklyDisplay(weekly);

  return {
    id: "weekly-summary",
    title: "Resumo da Semana",
    status: weeklyDisplay.status,
    badge: `${weekly.weeklyPercentage}% do orçamento`,
    message: weeklyDisplay.message,
    icon: weekly.isOverBudget ? "alert-triangle" : "trending-up",
  };
}

function buildMonthEndProjectionInsight(
  input: BuildInsightsInput,
): DashboardInsight | null {
  const projection = calculateMonthProjection(
    input.dailyHistory,
    input.currentDay,
    input.availableBudget,
  );
  const projectionDisplay = getProjectionDisplay(projection);

  return {
    id: "month-end-projection",
    title: "Projeção de Fim de Mês",
    status: projectionDisplay.status,
    badge: projectionDisplay.badge,
    message: projectionDisplay.message,
    icon: "target",
    details: `Média diária: ${formatCurrency(Math.round(projection.dailyAverage))} · ${projection.daysRemaining} dias restantes`,
  };
}

function buildReserveProjectionInsight(
  input: BuildInsightsInput,
): DashboardInsight | null {
  if (
    typeof input.reserveGoal !== "number" ||
    typeof input.income !== "number"
  ) {
    return null;
  }

  const projection = calculateMonthProjection(
    input.dailyHistory,
    input.currentDay,
    input.availableBudget,
  );
  const reserve = analyzeReserve(
    input.reserveGoal,
    projection.projectedBalance,
    input.income,
  );

  return {
    id: "reserve-projection",
    title: "Reserva Projetada",
    status: reserve.status,
    badge: reserve.badge,
    message: reserve.message,
    icon: "piggy-bank",
  };
}

function buildSpendingPaceInsight(
  input: BuildInsightsInput,
): DashboardInsight | null {
  if (
    typeof input.recommendedDailyAverage !== "number" ||
    typeof input.currentDailyAverage !== "number"
  ) {
    return null;
  }

  const paceDeltaPercent =
    input.recommendedDailyAverage > 0
      ? Math.round(
          ((input.currentDailyAverage - input.recommendedDailyAverage) /
            input.recommendedDailyAverage) *
            100,
        )
      : 0;

  return {
    id: "spending-pace",
    title: "Ritmo de gasto",
    status:
      paceDeltaPercent > 0
        ? "warning"
        : paceDeltaPercent < 0
          ? "positive"
          : "positive",
    badge:
      paceDeltaPercent === 0
        ? "0%"
        : `${paceDeltaPercent > 0 ? "+" : "-"}${Math.abs(paceDeltaPercent)}%`,
    message:
      paceDeltaPercent === 0
        ? "Seu ritmo de gasto está alinhado com a média recomendada."
        : `Seu ritmo de gasto está ${Math.abs(paceDeltaPercent)}% ${
            paceDeltaPercent > 0 ? "acima" : "abaixo"
          } da média recomendada.`,
    icon: "trending-up",
  };
}

function buildTodayFeedbackInsight(
  input: BuildInsightsInput,
): DashboardInsight | null {
  if (typeof input.recommendedDailyAverage !== "number") {
    return null;
  }

  const todayRecord = input.dailyHistory.find(
    (record) => record.day === input.currentDay,
  );
  const todaySpent = todayRecord?.spent ?? 0;
  const todayDelta = todaySpent - input.recommendedDailyAverage;

  return {
    id: "today-feedback",
    title: "Comportamento de hoje",
    status: getDeltaStatus(todayDelta),
    badge: formatSignedCurrency(todayDelta),
    message:
      todayDelta === 0
        ? "Hoje você está exatamente na média recomendada."
        : `Hoje você está ${formatCurrency(todayDelta)} ${
            todayDelta > 0 ? "acima" : "abaixo"
          } da média recomendada.`,
    icon: "calendar-clock",
  };
}

function buildBudgetDurationInsight(
  input: BuildInsightsInput,
): DashboardInsight | null {
  if (typeof input.projectedBudgetDurationDays !== "number") {
    return null;
  }

  const durationDays = input.projectedBudgetDurationDays;
  const status: InsightStatus =
    durationDays <= 0 ? "negative" : durationDays <= 3 ? "warning" : "positive";

  return {
    id: "budget-duration",
    title: "Duração do orçamento",
    status,
    badge: `${Math.max(0, durationDays)} dias`,
    message:
      durationDays <= 0
        ? "No ritmo atual, seu orçamento já estourou."
        : `No ritmo atual, seu orçamento dura ${durationDays} dias.`,
    icon: "calendar-range",
  };
}

const INSIGHT_DEFINITIONS: InsightDefinition[] = [
  {
    id: "fixed-expenses",
    contexts: ["monthly"],
    build: buildFixedExpensesInsight,
  },
  {
    id: "weekly-summary",
    contexts: ["monthly", "daily"],
    build: buildWeeklySummaryInsight,
  },
  {
    id: "month-end-projection",
    contexts: ["monthly", "daily"],
    build: buildMonthEndProjectionInsight,
  },
  {
    id: "reserve-projection",
    contexts: ["monthly"],
    build: buildReserveProjectionInsight,
  },
  {
    id: "spending-pace",
    contexts: ["daily"],
    build: buildSpendingPaceInsight,
  },
  {
    id: "today-feedback",
    contexts: ["daily"],
    build: buildTodayFeedbackInsight,
  },
  {
    id: "budget-duration",
    contexts: ["daily"],
    build: buildBudgetDurationInsight,
  },
];

const CONTEXT_INSIGHT_ORDER: Record<InsightContext, DashboardInsightId[]> = {
  monthly: [
    "fixed-expenses",
    "weekly-summary",
    "month-end-projection",
    "reserve-projection",
  ],
  daily: [
    "month-end-projection",
    "spending-pace",
    "today-feedback",
    "weekly-summary",
  ],
};

export function buildInsights(
  context: InsightContext,
  input: BuildInsightsInput,
): DashboardInsight[] {
  const byId = new Map<DashboardInsightId, InsightDefinition>(
    INSIGHT_DEFINITIONS.map((definition) => [definition.id, definition]),
  );
  const seen = new Set<DashboardInsightId>();
  const insights: DashboardInsight[] = [];

  for (const insightId of CONTEXT_INSIGHT_ORDER[context]) {
    if (seen.has(insightId)) {
      continue;
    }

    const definition = byId.get(insightId);
    if (!definition || !definition.contexts.includes(context)) {
      continue;
    }

    const insight = definition.build(input);
    if (!insight) {
      continue;
    }

    seen.add(insightId);
    insights.push(insight);
  }

  return insights;
}
