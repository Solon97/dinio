import { FixedExpense } from "@/types/finance";
import { AlertCircle, Circle, Trash2 } from "lucide-react";

interface InstallmentDeleteModalProps {
  expense: FixedExpense;
  onDeleteCurrent: () => void;
  onDeleteAllFuture: () => void;
  onCancel: () => void;
}

export function InstallmentDeleteModal({
  expense,
  onDeleteCurrent,
  onDeleteAllFuture,
  onCancel,
}: InstallmentDeleteModalProps) {
  const remainingInstallments =
    (expense.totalInstallments || 0) - (expense.currentInstallment || 0) + 1;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-amber-50 p-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Excluir Parcelamento</h3>
              <p className="text-xs text-slate-600">
                Esta é uma parcela {expense.currentInstallment}/
                {expense.totalInstallments}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">{expense.name}</span> é
            uma despesa parcelada. O que você deseja fazer?
          </p>

          <div className="space-y-2">
            <button
              onClick={onDeleteCurrent}
              className="w-full p-4 text-left rounded-xl border-2 border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-100 group-hover:bg-teal-500 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                  <Circle
                    size={16}
                    className="text-slate-600 group-hover:text-white"
                  />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    Excluir apenas esta parcela
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Remove apenas a parcela {expense.currentInstallment} deste
                    mês. As demais parcelas continuam ativas.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={onDeleteAllFuture}
              className="w-full p-4 text-left rounded-xl border-2 border-rose-200 hover:border-rose-500 hover:bg-rose-50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-rose-100 group-hover:bg-rose-500 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                  <Trash2
                    size={16}
                    className="text-rose-600 group-hover:text-white"
                  />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    Excluir esta e todas as futuras
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Cancela este parcelamento a partir de agora. Remove{" "}
                    {remainingInstallments} parcela(s).
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-slate-600 hover:bg-white rounded-lg transition-colors font-medium text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
