"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MonthYearlyRecord } from "@/types/finance";
import { formatBRL } from "@/libs/currency";

interface YearlyChartProps {
  data: MonthYearlyRecord[];
}

const YearlyChart: React.FC<YearlyChartProps> = ({ data }) => {
  const legendOrder = [
    "income",
    "fixedMandatory",
    "fixedDiscretionary",
    "dailySpent",
    "plannedSavings",
    "realSavings",
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="mb-6">
        <h3 className="text-gray-800 font-bold text-lg">Visão Anual</h3>
        <p className="text-gray-400 text-sm">
          Comparativo de Renda vs. Gastos vs. Economia (Planejada e Real)
        </p>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="monthName"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => formatBRL(value)}
              itemSorter={(item) => legendOrder.indexOf(item.dataKey as string)}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend
              itemSorter={(item) => legendOrder.indexOf(item.dataKey as string)}
              wrapperStyle={{ paddingTop: "20px" }}
            />

            <Bar
              dataKey="income"
              stackId="income"
              name="Renda"
              fill="#0E7B4A"
              barSize={16}
              radius={[4, 4, 0, 0]}
            />

            <Bar
              dataKey="fixedMandatory"
              stackId="expenses"
              name="Gastos Fixos Obrigatórios"
              fill="#DC2626"
              barSize={16}
            />
            <Bar
              dataKey="fixedDiscretionary"
              stackId="expenses"
              name="Gastos Fixos Dispensáveis"
              fill="#CD5F04"
              barSize={16}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="dailySpent"
              stackId="dailySpent"
              name="Gastos Diários"
              fill="#D99C00"
              barSize={16}
              radius={[4, 4, 0, 0]}
            />

            <Bar
              dataKey="plannedSavings"
              stackId="plannedSavings"
              name="Economia Planejada"
              fill="#0E3F7B"
              barSize={16}
              radius={[4, 4, 0, 0]}
            />

            <Bar
              dataKey="realSavings"
              stackId="realSavings"
              name="Economia Real"
              fill="#3F7B0E"
              barSize={16}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default YearlyChart;
