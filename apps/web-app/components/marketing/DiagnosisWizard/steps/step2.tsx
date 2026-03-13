import { formatBRL } from "@/libs/currency";
import { CheckCircle } from "lucide-react";
import React from "react";

export function DiagnosisStep2({
  income,
  fixedExpensesPercent,
  setFixedExpensesPercent,
  onSubmit,
}: {
  income: number;
  fixedExpensesPercent: number;
  setFixedExpensesPercent: (value: number) => void;
  onSubmit: (e: React.FormEvent<Element>) => void;
}) {
  // Calcula o valor em reais baseado na porcentagem escolhida
  const fixedExpensesValue = Math.round(income * (fixedExpensesPercent / 100));

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-xl md:text-2xl font-bold text-slate-800 mb-2">
          Quanto você paga em contas fixas por mês?
        </label>
        <p className="text-base text-slate-500 mb-6">
          Aluguel, contas, luz, assinaturas e parcelas...
        </p>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-3xl font-bold text-teal-600">
                {fixedExpensesPercent}%
              </span>
              <span className="text-slate-500 ml-2 font-medium">da renda</span>
            </div>
            <div className="text-right">
              <span className="block text-sm text-slate-500 font-medium">
                Aproximadamente:
              </span>
              <span className="text-xl font-bold text-slate-800">
                {formatBRL(fixedExpensesValue)}
              </span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={fixedExpensesPercent}
            onChange={(e) => setFixedExpensesPercent(Number(e.target.value))}
            className="range range-accent w-full"
          />

          <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <button
          type="submit"
          className="w-full btn bg-teal-600 hover:bg-teal-700 text-white border-none btn-lg rounded-xl font-bold text-lg shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02]"
        >
          Ver meu diagnóstico
          <CheckCircle className="w-5 h-5 ml-2" />
        </button>

        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <CheckCircle className="w-4 h-4 text-teal-500" />
          <span>Resultado imediato</span>
        </div>
      </div>
    </form>
  );
}
