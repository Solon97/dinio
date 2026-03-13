import { MoneyInput } from "@/components/shared/MoneyInput";
import { ArrowRight } from "lucide-react";
import React from "react";

export function DiagnosisStep1({
  income,
  setIncome,
  onSubmit,
}: {
  income: number;
  setIncome: (value: number) => void;
  onSubmit: (e: React.FormEvent<Element>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-xl md:text-2xl font-bold text-slate-800 mb-2">
          Qual é sua renda mensal?
        </label>
        <p className="text-base text-slate-500 mb-6">
          Somente o que cai na sua conta todo mês.
        </p>
        <MoneyInput
          value={income}
          onChange={setIncome}
          placeholder="0,00"
          className="w-full text-2xl p-4 bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl transition-all font-semibold text-slate-800"
          autoFocus
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full btn bg-teal-600 hover:bg-teal-700 text-white border-none btn-lg rounded-xl font-bold text-lg shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02]"
        >
          Continuar
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </form>
  );
}
