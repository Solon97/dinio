"use client";

import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Activity,
  PiggyBank,
  Target,
  CalendarClock,
  CalendarRange,
} from "lucide-react";
import type { ComponentType } from "react";
import { DashboardInsight, DashboardInsightIcon } from "./insightsCalculations";
import { getStatusColor } from "./status";

interface InsightsPanelProps {
  insights: DashboardInsight[];
  title?: string;
  accentColorClassName?: string;
}

const ICON_BY_KEY: Record<
  DashboardInsightIcon,
  ComponentType<{ className?: string }>
> = {
  activity: Activity,
  "alert-triangle": AlertTriangle,
  "calendar-clock": CalendarClock,
  "calendar-range": CalendarRange,
  "piggy-bank": PiggyBank,
  target: Target,
  "trending-up": TrendingUp,
};

export default function InsightsPanel({
  insights,
  title = "Dinio Insights",
  accentColorClassName = "bg-teal-500",
}: InsightsPanelProps) {
  return (
    <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden h-full flex flex-col">
      {/* Decorative bg shape */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 ${accentColorClassName} rounded-full blur-3xl opacity-20`}
      ></div>

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Lightbulb className="w-5 h-5 text-teal-300" />
        <h3 className="font-bold text-lg">{title}</h3>
      </div>

      <div className="space-y-3 relative z-10 flex-1">
        {insights.map((insight) => (
          <InsightRow key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}

function InsightRow({ insight }: { insight: DashboardInsight }) {
  const statusColor = getStatusColor(insight.status);
  const Icon = ICON_BY_KEY[insight.icon];

  return (
    <div className="flex gap-3 items-start bg-slate-700/50 p-3 rounded-xl border border-slate-600">
      <div className="mt-1">
        <Icon className={`w-4 h-4 ${statusColor}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{insight.title}</p>
          <span className={`text-xs font-bold ${statusColor}`}>
            {insight.badge}
          </span>
        </div>
        <p className="text-xs text-slate-300 mt-1">{insight.message}</p>
        {insight.details ? (
          <p className="text-[10px] text-slate-400 mt-1">{insight.details}</p>
        ) : null}
      </div>
    </div>
  );
}
