"use client";

import { YearlyChart } from "@/components/app/charts";
import { formatBRL } from "@/libs/currency";
import { SkeletonChart, SkeletonBase } from "@/components/shared/skeletons";
import { YearlyViewSkeleton } from "./skeleton";

interface YearSummaryItem {
  monthName: string;
  income: number;
  fixedMandatory: number;
  fixedDiscretionary: number;
  dailySpent: number;
  plannedSavings: number;
  realSavings: number;
}

interface YearlyTotals {
  income: number;
  fixedMandatory: number;
  fixedDiscretionary: number;
  dailySpent: number;
  plannedSavings: number;
  realSavings: number;
}

interface YearlyViewProps {
  yearSummary: YearSummaryItem[];
  totals: YearlyTotals;
  isLoading?: boolean;
}

export default function YearlyView({
  yearSummary,
  totals,
  isLoading = false,
}: YearlyViewProps) {
  if (isLoading) {
    return <YearlyViewSkeleton />;
  }
  const totalExpenses =
    totals.fixedMandatory + totals.fixedDiscretionary + totals.dailySpent;

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div id="onboarding-yearly-chart">
        <YearlyChart data={yearSummary} />
      </div>

      <div id="onboarding-yearly-summary" className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Year Summary Cards */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm mb-1">Renda Anual Total</p>
          <p className="text-2xl md:text-3xl font-bold text-green-500">
            {formatBRL(totals.income)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm mb-1">Gastos Totais</p>
          <p className="text-2xl md:text-3xl font-bold text-rose-500">
            {formatBRL(totalExpenses)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm mb-1">Saldo Acumulado</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-500">
            {formatBRL(totals.realSavings)}
          </p>
        </div>
      </div>
    </div>
  );
}
