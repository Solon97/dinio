"use client";

import { formatBRL } from "@/libs/currency";
import { DailyHistoryRecord } from "@/types/budget";
import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthBalanceProjectionChartProps {
  dailyHistory: DailyHistoryRecord[];
  currentDay: number;
  daysInMonth: number;
  remainingBalance: number;
  currentDailyAverage: number;
}

interface ProjectionPoint {
  day: number;
  actualBalance: number | null;
  projectedBalance: number | null;
}

function formatSignedBRL(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatBRL(Math.abs(value))}`;
}

function buildProjectionData({
  dailyHistory,
  currentDay,
  daysInMonth,
  remainingBalance,
  currentDailyAverage,
}: MonthBalanceProjectionChartProps): ProjectionPoint[] {
  const historyByDay = new Map<number, DailyHistoryRecord>();
  dailyHistory.forEach((record) => historyByDay.set(record.day, record));

  const currentRecord = historyByDay.get(currentDay);
  const currentCumulativeSpent = currentRecord?.cumulativeSpent ?? 0;

  const points: ProjectionPoint[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayRecord = historyByDay.get(day);

    let actualBalance: number | null = null;
    if (day <= currentDay && dayRecord) {
      actualBalance =
        remainingBalance +
        (currentCumulativeSpent - Number(dayRecord.cumulativeSpent || 0));
    }

    let projectedBalance: number | null = null;
    if (day >= currentDay) {
      projectedBalance =
        remainingBalance - currentDailyAverage * Math.max(0, day - currentDay);
    }

    points.push({
      day,
      actualBalance,
      projectedBalance,
    });
  }

  return points;
}

export default function MonthBalanceProjectionChart(
  props: MonthBalanceProjectionChartProps,
) {
  const data = React.useMemo(() => buildProjectionData(props), [props]);
  const finalProjectedBalance =
    props.remainingBalance -
    props.currentDailyAverage *
      Math.max(0, props.daysInMonth - props.currentDay);
  const isFinalProjectedPositive = finalProjectedBalance >= 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-gray-800 font-bold text-lg">
          Projeção de Saldo do Mês
        </h3>
        <p className="text-gray-400 text-sm">
          Histórico real até hoje e previsão para o fim do mês no ritmo atual.
        </p>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              interval={2}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(value) => formatBRL(value)}
              width={90}
            />
            <Tooltip
              formatter={(value: number | string, name: string) => [
                formatBRL(Number(value || 0)),
                name === "actualBalance" ? "Saldo real" : "Saldo projetado",
              ]}
              labelFormatter={(label) => `Dia ${label}`}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              wrapperStyle={{ fontSize: "12px", color: "#64748b" }}
            />

            <ReferenceLine
              y={0}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            <ReferenceLine
              x={props.currentDay}
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              label={{
                value: "Hoje",
                position: "top",
                fill: "#ef4444",
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            <Line
              type="monotone"
              dataKey="actualBalance"
              stroke="#0d9488"
              strokeWidth={3}
              dot={false}
              connectNulls={false}
              name="Saldo Real"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="projectedBalance"
              stroke="#3b82f6"
              strokeWidth={3}
              strokeDasharray="6 4"
              dot={false}
              connectNulls={false}
              name="Saldo Projetado"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
