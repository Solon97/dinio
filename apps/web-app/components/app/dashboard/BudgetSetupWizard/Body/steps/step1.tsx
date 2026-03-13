import { Plus, Trash2 } from "lucide-react";
import { useBudgetSetupWizard } from "../../Context";
import { MoneyInput } from "@/components/shared/MoneyInput";

export function Step1() {
  const { incomes, addIncome, removeIncome, updateIncome, totalIncome } =
    useBudgetSetupWizard();

  return (
    <div
      id="onboarding-wizard-step-1"
      className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300"
    >
      <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 mb-4">
        <h3 className="font-bold text-teal-800 text-lg mb-1">
          1. Receitas Fixas
        </h3>
        <p className="text-teal-600 text-sm">
          Quanto dinheiro vai entrar neste mês?
        </p>
      </div>

      <div className="space-y-3">
        {incomes.map((income) => (
          <div
            key={income.id}
            className="flex gap-2 md:gap-3 items-center bg-white p-3 rounded-xl shadow-sm"
          >
            <input
              type="text"
              placeholder="Nome"
              value={income.name}
              onChange={(e) => updateIncome(income.id, "name", e.target.value)}
              className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm md:text-base"
            />
            <div className="w-36 md:w-44 shrink-0">
              <MoneyInput
                value={income.amount}
                onChange={(value) => updateIncome(income.id, "amount", value)}
                placeholder="0,00"
                className="p-3 text-sm md:text-base pl-8"
              />
            </div>
            <button
              onClick={() => removeIncome(income.id)}
              className="p-3 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addIncome}
        className="w-full py-3 border-2 border-dashed border-teal-200 text-teal-600 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all flex items-center justify-center gap-2 font-medium bg-white"
      >
        <Plus size={20} /> Adicionar Receita
      </button>

      <div className="flex justify-end pt-4 border-t border-slate-100 mt-8">
        <div className="text-right">
          <p className="text-slate-400 text-xs uppercase font-bold">
            Total Receitas
          </p>
          <p className="text-2xl font-bold text-teal-600">
            R$ {totalIncome.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>
    </div>
  );
}
