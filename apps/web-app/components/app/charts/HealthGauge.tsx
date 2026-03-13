"use client";

import React from "react";
import { FinancialStatus } from "@/types/finance";
import { formatBRL } from "@/libs/currency";

interface HealthGaugeProps {
  fixedExpenses: number;
  income: number;
  status: FinancialStatus;
}

const HealthGauge: React.FC<HealthGaugeProps> = ({
  fixedExpenses,
  income,
  status,
}) => {
  const percentage = Math.min(Math.round((fixedExpenses / income) * 100), 100);

  let colorClass = "bg-teal-500";
  let textColor = "text-teal-700";
  let bgColor = "bg-teal-50";

  if (status === FinancialStatus.WARNING) {
    colorClass = "bg-amber-500";
    textColor = "text-amber-700";
    bgColor = "bg-amber-50";
  } else if (status === FinancialStatus.CRITICAL) {
    colorClass = "bg-rose-500";
    textColor = "text-rose-700";
    bgColor = "bg-rose-50";
  }

  return (
    <div
      className={`p-6 rounded-2xl ${bgColor} border border-opacity-50 border-gray-200 shadow-sm`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">
            Diagnóstico Mensal
          </h3>
          <p className={`text-2xl font-bold mt-1 ${textColor}`}>{status}</p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold bg-white bg-opacity-60 ${textColor}`}
        >
          {percentage}% Comprometido
        </div>
      </div>

      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${30}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white opacity-50 left-[50%]"
          title="Limite Saudável (50%)"
        ></div>
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white opacity-50 left-[70%]"
          title="Limite Crítico (70%)"
        ></div>
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>0%</span>
        <span className="ml-8">50% (Ideal)</span>
        <span className="mr-8">70% (Crítico)</span>
        <span>100%</span>
      </div>

      <p className="mt-4 text-sm text-gray-600 leading-relaxed">
        Seus gastos fixos somam <strong>{formatBRL(fixedExpenses)}</strong> de
        uma renda de <strong>{formatBRL(income)}</strong>.
      </p>
    </div>
  );
};

export default HealthGauge;
