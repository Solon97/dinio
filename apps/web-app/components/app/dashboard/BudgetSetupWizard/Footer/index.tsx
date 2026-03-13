import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useBudgetSetupWizard } from "../Context";
import { TOTAL_STEPS } from "../shared/utils";

interface FooterProps {
  onFinish: () => void;
}

export function BudgetSetupWizardFooter({ onFinish }: FooterProps) {
  const { step, setStep, totalIncome, creditCards, expenses } =
    useBudgetSetupWizard();

  const activeExpenses = expenses.filter((e) => !e.markedForDeletion);
  const isNextDisabled =
    (step === 1 && totalIncome === 0) ||
    (step === 2 && creditCards.some((c) => !c.name.trim())) ||
    (step === 3 &&
      activeExpenses.some((e) => !e.name.trim() || !e.amount));

  const nextTitle =
    step === 2 && creditCards.some((c) => !c.name.trim())
      ? "Dê um nome a todos os cartões antes de continuar"
      : step === 3 && activeExpenses.some((e) => !e.name.trim() || !e.amount)
        ? "Preencha nome e valor de todos os gastos fixos antes de continuar"
        : undefined;

  return (
    <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex justify-between shrink-0">
      {step > 1 ? (
        <button
          onClick={() => setStep(step - 1)}
          className="px-4 md:px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm md:text-base"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
      ) : (
        <div />
      )}

      {step < TOTAL_STEPS ? (
        <button
          onClick={() => setStep(step + 1)}
          disabled={isNextDisabled}
          title={nextTitle}
          className="px-6 md:px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
        >
          Próximo <ArrowRight size={18} />
        </button>
      ) : (
        <button
          onClick={onFinish}
          className="px-6 md:px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 text-sm md:text-base"
        >
          <CheckCircle2 size={18} /> Concluir
        </button>
      )}
    </div>
  );
}
