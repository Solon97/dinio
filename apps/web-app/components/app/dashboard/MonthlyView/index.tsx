"use client";

import { DistributionChart } from "@/components/app/charts";
import { DailyHistoryRecord } from "@/types/budget";
import { PaymentItem } from "@/types/budget";
import { CreditCard, FinancialStatus, FixedExpense } from "@/types/finance";
import FixedExpensesList from "../FixedExpensesList";
import FinancialAgenda from "../FinancialAgenda";
import InsightsPanel from "../insights";
import { buildInsights } from "../insights/insightsCalculations";
import { MonthlyViewSkeleton } from "./skeleton";

interface MonthlyViewSummary {
  income: number;
  totalFixed: number;
  reserveGoal: number;
  dailyHistory: DailyHistoryRecord[];
  currentDay: number;
  expenses: FixedExpense[];
  creditCards: CreditCard[];
  payments: PaymentItem[];
}

interface MonthlyViewProps {
  summary: MonthlyViewSummary;
  initialAvailable: number;
  status: FinancialStatus;
  monthId: number;
  isLoading?: boolean;
}

export default function MonthlyView({
  summary,
  initialAvailable,
  status,
  monthId,
  isLoading = false,
}: MonthlyViewProps) {
  if (isLoading) {
    return <MonthlyViewSkeleton />;
  }

  const monthlyInsights = buildInsights("monthly", {
    dailyHistory: summary.dailyHistory,
    currentDay: summary.currentDay,
    availableBudget: initialAvailable,
    income: summary.income,
    totalFixed: summary.totalFixed,
    reserveGoal: summary.reserveGoal,
    status,
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* BLOCO 1 — Planejamento do M\u00eas */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div id="onboarding-monthly-distribution" className="h-full">
            <div className="h-full min-h-[350px]">
              <DistributionChart
                fixed={summary.totalFixed}
                daily={initialAvailable}
                reserve={summary.reserveGoal}
              />
            </div>
          </div>

          <div id="onboarding-monthly-insights" className="h-full">
            <div className="h-full min-h-[350px]">
              <InsightsPanel
                insights={monthlyInsights}
                title="Dinio Insights"
              />
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO 2 — Compromissos do Mês */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div id="onboarding-monthly-expenses" className="h-full">
            <FixedExpensesList
              expenses={summary.expenses}
              creditCards={summary.creditCards}
            />
          </div>
          <div id="onboarding-monthly-agenda" className="h-full">
            <FinancialAgenda monthId={monthId} payments={summary.payments} />
          </div>
        </div>
      </section>
    </div>
  );
}
