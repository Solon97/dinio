import { calculateInstallmentValues } from "@/libs/currency";
import { ExpenseType, FixedExpense } from "@/types/finance";
import { Trash2 } from "lucide-react";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { useState } from "react";

interface ExpenseItemProps {
  expense: FixedExpense;
  updateExpense: (
    id: string | undefined,
    field: keyof FixedExpense,
    value: string | number | boolean | undefined,
  ) => void;
  removeExpense: (id?: string) => void;
  isCardExpense: boolean;
  isEditing?: boolean;
  expenseDate?: Date;
}

export function ExpenseItem({
  expense,
  updateExpense,
  removeExpense,
  isCardExpense,
  expenseDate,
}: ExpenseItemProps) {
  const [installmentInputMode, setInstallmentInputMode] = useState<
    "total" | "installment"
  >("total");

  // Check if this is an existing installment (has id and installmentExpenseId)
  const isExistingInstallment = !!expense.id && !!expense.installmentExpenseId;

  // Calculate installment amounts matching backend logic
  const totalAmountCents = Math.round((expense.amount || 0) * 100);
  const totalInstallments = expense.totalInstallments || 1;
  const startInstallment = expense.startInstallment || 1;

  const {
    remainder,
    firstInstallmentAmount: firstInstallmentAmountCents,
    regularInstallmentAmount: regularInstallmentAmountCents,
  } = calculateInstallmentValues(totalAmountCents, totalInstallments);

  const firstInstallmentAmount = firstInstallmentAmountCents / 100;
  const regularInstallmentAmount = regularInstallmentAmountCents / 100;

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm hover:border-teal-200 transition-colors">
      <div className="flex gap-2 md:gap-3">
        <input
          type="text"
          placeholder="Ex: Aluguel, Internet..."
          value={expense.name}
          onChange={(e) => updateExpense(expense.id, "name", e.target.value)}
          className={`flex-1 p-3 bg-slate-50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm ${
            !isExistingInstallment && !expense.name.trim()
              ? "border-rose-400 ring-1 ring-rose-200"
              : "border-slate-200"
          }`}
          disabled={isExistingInstallment}
        />
        <div
          className={`w-32 md:w-36 shrink-0 ${!isExistingInstallment && !expense.amount ? "ring-1 ring-rose-300 rounded-lg" : ""}`}
        >
          <MoneyInput
            value={
              installmentInputMode === "installment" && expense.isInstallment
                ? (expense.amount || 0) / (expense.totalInstallments || 1)
                : expense.amount || 0
            }
            onChange={(value) => {
              if (
                installmentInputMode === "installment" &&
                expense.isInstallment
              ) {
                updateExpense(
                  expense.id,
                  "amount",
                  value * (expense.totalInstallments || 1),
                );
              } else {
                updateExpense(expense.id, "amount", value);
              }
            }}
            placeholder="0,00"
            className="p-3 text-sm bg-slate-50 rounded-lg border-slate-200 focus:ring-1 pl-6"
            title={
              isExistingInstallment
                ? "Somente o valor da parcela atual pode ser editado"
                : installmentInputMode === "installment"
                  ? "Valor de cada parcela"
                  : "Valor total do gasto"
            }
          />
        </div>
        <button
          onClick={() => removeExpense(expense.id)}
          className="text-slate-400 hover:text-rose-500 p-2 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {isExistingInstallment && (
        <div className="bg-teal-50 px-3 py-2 rounded-lg border border-teal-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-teal-700">
              📋 Parcela {expense.currentInstallment}/
              {expense.totalInstallments}
            </span>
            <span className="text-xs font-bold text-teal-800"></span>
          </div>
        </div>
      )}

      {!isExistingInstallment && (
        <>
          <div className="flex flex-wrap gap-3 text-sm items-center">
            {!isCardExpense && (
              <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-200 w-24 shrink-0">
                <span className="text-slate-400 text-xs">Dia</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={expense.dueDay}
                  onChange={(e) =>
                    updateExpense(
                      expense.id,
                      "dueDay",
                      parseInt(e.target.value) || 1,
                    )
                  }
                  className="w-full text-center bg-transparent focus:outline-none font-bold text-slate-700"
                />
              </div>
            )}

            <select
              value={expense.type}
              onChange={(e) =>
                updateExpense(expense.id, "type", e.target.value as ExpenseType)
              }
              className="bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-600 focus:outline-none text-xs md:text-sm font-medium"
            >
              <option value={ExpenseType.MANDATORY}>Obrigatório</option>
              <option value={ExpenseType.DISCRETIONARY}>Dispensável</option>
            </select>

            {isCardExpense && !expense.isInstallment && (
              <span className="text-xs text-slate-400 italic">
                Vencimento automático (Fatura)
              </span>
            )}
          </div>

          {/* Installment Section - Only for NEW expenses */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={expense.isInstallment || false}
                onChange={(e) => {
                  const isInstallment = e.target.checked;
                  updateExpense(expense.id, "isInstallment", isInstallment);
                  if (!isInstallment) {
                    // Clear installment fields when unchecked
                    updateExpense(expense.id, "totalInstallments", undefined);
                    updateExpense(expense.id, "startInstallment", undefined);
                    setInstallmentInputMode("total");
                  } else {
                    // Set default values when checked
                    updateExpense(expense.id, "totalInstallments", 12);
                    updateExpense(expense.id, "startInstallment", 1);
                  }
                }}
                className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-slate-600">
                É parcelamento?
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={expense.isRefundable || false}
                onChange={(e) =>
                  updateExpense(expense.id, "isRefundable", e.target.checked)
                }
                className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-slate-600">
                É reembolsável?
              </span>
            </label>

            {expense.isInstallment && (
              <div className="mt-3 space-y-2 bg-teal-50/50 p-3 rounded-lg border border-teal-100">
                <div className="mb-3">
                  <label className="text-xs text-slate-500 font-medium block mb-1">
                    Como deseja informar o valor?
                  </label>
                  <div className="flex bg-white rounded-lg p-1 border border-teal-200">
                    <button
                      type="button"
                      onClick={() => setInstallmentInputMode("total")}
                      className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                        installmentInputMode === "total"
                          ? "bg-teal-100 text-teal-800"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Valor Total
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallmentInputMode("installment")}
                      className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                        installmentInputMode === "installment"
                          ? "bg-teal-100 text-teal-800"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Valor da Parcela
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">
                      Parcela inicial
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={expense.totalInstallments || 48}
                      value={expense.startInstallment || 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        updateExpense(
                          expense.id,
                          "startInstallment",
                          Math.max(
                            1,
                            Math.min(val, expense.totalInstallments || 48),
                          ),
                        );
                      }}
                      className="w-full p-2 text-center bg-white rounded-lg border border-teal-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold text-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">
                      Total de parcelas
                    </label>
                    <input
                      type="number"
                      min={expense.startInstallment || 1}
                      max="48"
                      value={expense.totalInstallments || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const newTotal = Math.max(
                          expense.startInstallment || 1,
                          Math.min(val, 48),
                        );

                        if (installmentInputMode === "installment") {
                          const currentInstallmentAmount =
                            (expense.amount || 0) /
                            (expense.totalInstallments || 1);
                          updateExpense(
                            expense.id,
                            "amount",
                            currentInstallmentAmount * newTotal,
                          );
                        }

                        updateExpense(
                          expense.id,
                          "totalInstallments",
                          newTotal,
                        );
                      }}
                      className="w-full p-2 text-center bg-white rounded-lg border border-teal-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold text-slate-700 text-sm"
                    />
                  </div>
                </div>

                {expense.totalInstallments && expense.totalInstallments > 0 && (
                  <div className="space-y-1">
                    {startInstallment === 1 && remainder > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Parcela 1:</span>
                          <span className="font-bold text-teal-700">
                            R$ {firstInstallmentAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">
                            Demais parcelas:
                          </span>
                          <span className="font-bold text-teal-700">
                            R$ {regularInstallmentAmount.toFixed(2)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          Valor por parcela:
                        </span>
                        <span className="font-bold text-teal-700">
                          R$ {regularInstallmentAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Parcelas a criar:</span>
                      <span className="font-bold text-teal-700">
                        {expense.totalInstallments -
                          (expense.startInstallment || 1) +
                          1}
                        x
                      </span>
                    </div>
                    <p className="text-xs text-teal-600 italic mt-2">
                      Serão criadas{" "}
                      {expense.totalInstallments -
                        (expense.startInstallment || 1) +
                        1}{" "}
                      parcelas automaticamente, a partir{" "}
                      {expenseDate?.toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      }) || "do mês atual"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
