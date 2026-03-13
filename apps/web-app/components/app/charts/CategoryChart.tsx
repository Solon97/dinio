"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CategoryRecord } from "@/types/finance";
import { formatBRL } from "@/libs/currency";

interface CategoryChartProps {
  data: CategoryRecord[];
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const displayableCategories = data.filter((d) => d.name !== "Outros");
  const other = data.find((d) => d.name === "Outros");
  // Sort categories by value (descending) and group smaller ones
  displayableCategories.sort((a, b) => b.value - a.value);
  const topCategories = displayableCategories.slice(0, 4);
  const otherCategories = displayableCategories.slice(4);

  // Calculate "Outros" total
  const otherTotal =
    otherCategories.reduce((acc, curr) => acc + curr.value, 0) +
    (other ? other.value : 0);

  // Build final data array
  const chartData =
    otherTotal > 0
      ? [
          ...topCategories,
          {
            name: "Outros",
            value: otherTotal,
            color: "#94a3b8", // slate-400
          },
        ]
      : topCategories;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center h-full">
      <h3 className="text-gray-800 font-bold text-lg w-full text-left mb-2">
        Gastos por Categoria
      </h3>

      <div className="h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatBRL(value)}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-400">Total Variável</span>
          <span className="text-lg font-bold text-slate-800">
            {formatBRL(total)}
          </span>
        </div>
      </div>

      <div className="w-full mt-4 space-y-3">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="flex justify-between items-center text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-slate-600">{item.name}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-semibold text-slate-700">
                {total > 0 ? Math.round((item.value / total) * 100) : 0}%
              </span>
              <span className="text-xs text-slate-400">
                {formatBRL(item.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryChart;
