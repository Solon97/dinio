export type DiagnosticoStatus = "critical" | "warning" | "ok";

export interface DiagnosticoResult {
  fixedPercent: number;
  status: DiagnosticoStatus;
  available: number;
  reserve: number;
  variableBudget: number;
  dailyLimit: number;
}

const SEVERE_DAILY_LIMIT_THRESHOLD = 30;

export function calculateDiagnostico(
  income: number,
  fixedExpenses: number,
): DiagnosticoResult {
  // 1. Calculate fixed expenses percentage
  // Avoid division by zero
  const safeIncome = income <= 0 ? 1 : income;
  const fixedPercent = (fixedExpenses / safeIncome) * 100;

  // 2. Define status
  let status: DiagnosticoStatus = "ok";
  if (fixedPercent >= 70) {
    status = "critical";
  } else if (fixedPercent >= 50) {
    status = "warning";
  }

  // 3. Calculate available monthly amount
  const available = Math.max(0, income - fixedExpenses);

  // 4. Apply structural model (20% reserve, 80% variable)
  const reserve = available * 0.2;
  const variableBudget = available * 0.8;

  // 5. Calculate estimated daily limit
  const now = new Date();
  // Get total days in current month (0 gets the last day of previous month, so usually we use month+1 and day 0)
  // strict "daysInMonth = total de dias do mês atual"
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  const dailyLimit = variableBudget / daysInMonth;

  if (dailyLimit <= SEVERE_DAILY_LIMIT_THRESHOLD) {
    status = "critical";
  }

  return {
    fixedPercent,
    status,
    available,
    reserve,
    variableBudget,
    dailyLimit,
  };
}
