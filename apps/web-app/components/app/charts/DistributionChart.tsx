"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatBRL } from "@/libs/currency";

interface DistributionChartProps {
  fixed: number;
  daily: number;
  reserve: number;
}

const DistributionChart: React.FC<DistributionChartProps> = ({
  fixed,
  daily,
  reserve,
}) => {
  const data = [
    { name: "Gastos Fixos", value: fixed, color: "#0f766e" },
    { name: "Dia a Dia", value: daily, color: "#2dd4bf" },
    { name: "Reserva", value: reserve, color: "#fbbf24" },
  ];

  const total = fixed + daily + reserve;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
      <h3 className="text-gray-800 font-bold text-lg w-full text-left mb-2">
        Distribuição Planejada
      </h3>

      <div className="h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
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
          <span className="text-xs text-gray-400">Total</span>
          <span className="text-lg font-bold text-slate-800">
            {formatBRL(total)}
          </span>
        </div>
      </div>

      <div className="w-full mt-4 space-y-3">
        {data.map((item) => (
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
                {((item.value / total) * 100).toFixed(1)}%
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

export default DistributionChart;
