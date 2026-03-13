"use client";

import { DailyHistoryRecord } from "@/types/budget";
import { formatBRL } from "@/libs/currency";
import React from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getCategoryColor } from "@/constants/categories";
import { HelpCircle } from "lucide-react";

interface DailyLimitChartProps {
  data: DailyHistoryRecord[];
  currentDay: number;
  onDayClick: (_dayRecord: DailyHistoryRecord) => void;
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  name: string;
  fill: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

const DailyLimitChart: React.FC<DailyLimitChartProps> = ({
  data,
  currentDay,
  onDayClick,
}) => {
  // Enrich data with isFuture flag for visual distinction
  const enrichedData = data.map((d) => ({
    ...d,
    isFuture: d.day > currentDay,
  }));

  // Extract all unique categories from the data
  const categories = React.useMemo(() => {
    const categoriesSet = new Set<string>();
    data.forEach((day) => {
      Object.keys(day.breakdown).forEach((category) => {
        categoriesSet.add(category);
      });
    });
    return Array.from(categoriesSet).sort();
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const dayData = enrichedData.find((d) => d.day === label);
      const isFuture = dayData?.isFuture || false;

      const limit = payload.find((p) => p.dataKey === "limit")?.value || 0;
      const stackItems = payload.filter((p) => p.dataKey !== "limit");
      const totalSpent = stackItems.reduce(
        (acc, curr) => acc + (curr.value || 0),
        0,
      );

      return (
        <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg text-sm z-50 min-w-[150px]">
          <p className="font-bold text-slate-700 mb-1 border-b border-slate-100 pb-1">
            Dia {label}
            {isFuture && (
              <span className="ml-2 text-[10px] text-amber-600 font-normal">
                (Futuro)
              </span>
            )}
          </p>

          <div className="flex justify-between items-center mb-2">
            <span className="text-teal-600 font-bold">Teto</span>
            <span className="text-teal-700">{formatBRL(limit)}</span>
          </div>

          <div className="space-y-1 mb-2">
            {stackItems.map(
              (item) =>
                item.value > 0 && (
                  <div
                    key={item.name}
                    className="flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      ></div>
                      <span className="text-slate-500">{item.name}</span>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {formatBRL(item.value)}
                    </span>
                  </div>
                ),
            )}
          </div>

          <div
            className={`flex justify-between items-center pt-2 border-t border-slate-100 font-bold ${
              totalSpent > limit ? "text-rose-500" : "text-slate-600"
            }`}
          >
            <span>Total Gasto</span>
            <span>{formatBRL(totalSpent)}</span>
          </div>

          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide text-center">
            Clique para detalhes
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-gray-800 font-bold text-lg">
              Evolução do Teto Diário
            </h3>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-slate-400 hover:text-teal-600 cursor-help transition-colors" />
              <div className="absolute left-0 top-6 w-64 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
                <p className="leading-relaxed">
                  💡 O teto inicial já inclui os gastos futuros do mês,
                  ajustando seu limite desde o primeiro dia e evitando surpresas
                  no planejamento.
                </p>
                <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-800 transform rotate-45"></div>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Gastos por categoria vs. Limite
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full cursor-pointer relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={enrichedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={(state) => {
              const chartState = state as {
                activePayload?: { payload: DailyHistoryRecord }[];
              };
              if (
                chartState &&
                chartState.activePayload &&
                chartState.activePayload.length
              ) {
                onDayClick(chartState.activePayload[0].payload);
              }
            }}
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
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#f0fdfa" }}
              wrapperStyle={{ pointerEvents: "none" }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", color: "#64748b" }}
            />

            {/* Reference line for current day */}
            <ReferenceLine
              x={currentDay}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: "Hoje",
                position: "top",
                fill: "#ef4444",
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            {/* Dynamic category bars */}
            {categories.map((category, idx) => {
              const isLastCategory = idx === categories.length - 1;
              return (
                <Bar
                  key={category}
                  dataKey={`breakdown.${category}`}
                  name={category}
                  stackId="a"
                  fill={getCategoryColor(category)}
                  barSize={12}
                  radius={isLastCategory ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                >
                  {enrichedData.map((entry, index) => (
                    <Cell
                      key={`cell-${category}-${index}`}
                      fillOpacity={entry.isFuture ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              );
            })}

            <Line
              type="monotone"
              dataKey="limit"
              stroke="#0d9488"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: "#0d9488",
                stroke: "#fff",
                strokeWidth: 2,
              }}
              name="Teto Calculado"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyLimitChart;
