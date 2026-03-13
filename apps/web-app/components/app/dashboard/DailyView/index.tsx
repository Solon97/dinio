"use client";

import {
  CategoryChart,
  MonthBalanceProjectionChart,
} from "@/components/app/charts";
import ExpenseList from "@/components/app/dashboard/ExpenseList";
import { formatBRL } from "@/libs/currency";
import { CategoryRecord } from "@/types/finance";
import { DailyHistoryRecord } from "@/types/budget";
import { CalendarDays, Target, Wallet } from "lucide-react";
import InsightsPanel from "../insights";
import { buildInsights } from "../insights/insightsCalculations";
import { DailyViewSkeleton } from "./skeleton";

interface DailyViewSummary {
  currentDay: number;
  daysInMonth: number;
  dailyHistory: DailyHistoryRecord[];
}

interface DailyViewProps {
  summary: DailyViewSummary;
  initialAvailable: number;
  recommendedDailyAverage: number;
  currentDailyAverage: number;
  remainingBalance: number;
  balanceProgress: number;
  projectedBudgetDurationDays: number;
  categoryData: CategoryRecord[];
  month: number;
  year: number;
  isLoading?: boolean;
}

export default function DailyView({
  summary,
  initialAvailable,
  recommendedDailyAverage,
  currentDailyAverage,
  remainingBalance,
  balanceProgress,
  projectedBudgetDurationDays,
  categoryData,
  month,
  year,
  isLoading = false,
}: DailyViewProps) {
  if (isLoading) {
    return <DailyViewSkeleton />;
  }
  const paceDeltaPercent =
    recommendedDailyAverage > 0
      ? Math.round(
          ((currentDailyAverage - recommendedDailyAverage) /
            recommendedDailyAverage) *
            100,
        )
      : 0;
  const isAboveRecommended = paceDeltaPercent > 0;

  const dailyInsights = buildInsights("daily", {
    dailyHistory: summary.dailyHistory,
    currentDay: summary.currentDay,
    availableBudget: initialAvailable,
    recommendedDailyAverage,
    currentDailyAverage,
    projectedBudgetDurationDays,
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top: Key Metrics */}
      <div className="md:col-span-12 grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6">
        {/* Recommended Daily Average */}
        <div
          id="onboarding-daily-limit"
          className="col-span-2 sm:col-span-1 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl md:rounded-2xl p-4 md:p-5 text-white shadow-lg shadow-teal-100 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CalendarDays className="w-10 h-10 md:w-12 md:h-12" />
          </div>
          <p className="text-teal-50 text-xs md:text-sm font-medium mb-0.5 md:mb-1">
            Média de gastos ideal
          </p>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
            {formatBRL(recommendedDailyAverage)}
          </h2>
        </div>

        {/* Current Daily Average */}
        <div
          id="onboarding-daily-spent"
          className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px] md:min-h-0"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="text-slate-400 text-xs md:text-sm font-medium truncate">
                Média Atual
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-slate-700">
                {formatBRL(currentDailyAverage)}
              </h2>
            </div>
            <div
              className={`p-1.5 md:p-2 rounded-lg shrink-0 ${
                isAboveRecommended ? "bg-rose-50" : "bg-teal-50"
              }`}
            >
              <Wallet
                className={`w-4 h-4 md:w-5 md:h-5 ${
                  isAboveRecommended ? "text-rose-500" : "text-teal-500"
                }`}
              />
            </div>
          </div>
          <p
            className={`text-[10px] md:text-xs mt-2 md:mt-4 font-medium ${
              isAboveRecommended ? "text-rose-500" : "text-teal-500"
            }`}
          >
            {paceDeltaPercent === 0
              ? "No ritmo recomendado."
              : `${Math.abs(paceDeltaPercent)}% ${paceDeltaPercent > 0 ? "acima" : "abaixo"} da média recomendada.`}
          </p>
        </div>

        {/* Month Balance */}
        <div
          id="onboarding-daily-balance"
          className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px] md:min-h-0"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="text-slate-400 text-xs md:text-sm font-medium truncate">
                Saldo do Mês
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-slate-700 truncate">
                {formatBRL(remainingBalance)}
              </h2>
            </div>
            <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg shrink-0">
              <Target className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 md:h-2 rounded-full mt-2 md:mt-4">
            <div
              className="bg-blue-400 h-1.5 md:h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(0, Math.min(100, balanceProgress))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Center: Projection + Insights */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <div
          id="onboarding-daily-chart"
          className="md:col-span-6 h-[400px] md:h-[500px] min-w-0 overflow-hidden"
        >
          <MonthBalanceProjectionChart
            dailyHistory={summary.dailyHistory}
            currentDay={summary.currentDay}
            daysInMonth={summary.daysInMonth}
            remainingBalance={remainingBalance}
            currentDailyAverage={currentDailyAverage}
          />
        </div>

        <div className="md:col-span-6 h-[520px] md:h-[500px] min-w-0">
          <InsightsPanel
            insights={dailyInsights}
            title="Insights do Dia"
            accentColorClassName="bg-sky-500"
          />
        </div>
      </div>

      {/* Base: Expense list + categories */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <div className="md:col-span-6 h-[480px] md:h-[500px] min-w-0 overflow-hidden">
          <CategoryChart data={categoryData} />
        </div>
        <div className="md:col-span-6 h-[400px] md:h-[500px] min-w-0 overflow-hidden">
          <ExpenseList month={month} year={year} />
        </div>
      </div>
    </div>
  );
}
