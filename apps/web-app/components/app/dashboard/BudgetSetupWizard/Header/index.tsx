import { X } from "lucide-react";
import { useBudgetSetupWizard } from "../Context";
import { TOTAL_STEPS } from "../shared/utils";

interface HeaderProps {
  onCancel: () => void;
}

export function BudgetSetupWizardHeader({ onCancel }: HeaderProps) {
  const { monthName, step } = useBudgetSetupWizard();
  return (
    <div className="bg-teal-600 p-4 md:p-6 text-white flex justify-between items-center shrink-0">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">
          Configurar {monthName}
        </h2>
        <p className="text-teal-100 text-xs md:text-sm">
          Etapa {step} de {TOTAL_STEPS}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="text-teal-100 hover:text-white p-2 hover:bg-teal-500 rounded-lg transition-colors"
      >
        <X size={24} />
      </button>
    </div>
  );
}
