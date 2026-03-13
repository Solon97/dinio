"use client";

import { CreditCard as CardIcon } from "lucide-react";
import { FixedExpense, ExpenseType, CreditCard } from "@/types/finance";
import { formatBRL } from "@/libs/currency";
import { useMemo } from "react";

interface FixedExpensesListProps {
  expenses: FixedExpense[];
  creditCards?: CreditCard[];
}

export default function FixedExpensesList({
  expenses,
  creditCards = [],
}: FixedExpensesListProps) {
  const sortedExpenses = [...expenses].sort(
    (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
  );

  const getCard = (id?: string) => creditCards.find((c) => c.id === id);

  const {
    mandatoryCount,
    discretionaryCount,
    mandatoryTotal,
    discretionaryTotal,
  } = useMemo(() => {
    const mandatory = expenses.filter((e) => e.type === ExpenseType.MANDATORY);
    const discretionary = expenses.filter(
      (e) => e.type === ExpenseType.DISCRETIONARY,
    );
    return {
      mandatoryCount: mandatory.length,
      discretionaryCount: discretionary.length,
      mandatoryTotal: mandatory.reduce((acc, e) => acc + e.amount, 0),
      discretionaryTotal: discretionary.reduce((acc, e) => acc + e.amount, 0),
    };
  }, [expenses]);

  const isMandatory = (type: ExpenseType) => type === ExpenseType.MANDATORY;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h3 className="text-gray-800 font-bold text-lg">Gastos Fixos</h3>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded-md font-medium">
            {mandatoryCount} obrigatórios · {formatBRL(mandatoryTotal)}
          </span>
          <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-md font-medium">
            {discretionaryCount} dispensáveis · {formatBRL(discretionaryTotal)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto pr-3">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-xs text-slate-600 border-b border-slate-200">
              <th className="font-medium py-1">Nome</th>
              <th className="font-medium py-1 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((expense) => {
              const card = getCard(expense.creditCardId);
              const mandatory = isMandatory(expense.type);
              return (
                <tr
                  key={expense.id}
                  className={`group transition-colors text-sm`}
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-slate-700`}>
                        {expense.name}
                      </span>
                      {expense.isInstallment && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                          {expense.currentInstallment}/
                          {expense.totalInstallments}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                          mandatory
                            ? "bg-rose-100 text-rose-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {mandatory ? "Obrigatório" : "Dispensável"}
                      </span>
                      {card && (
                        <div
                          className="flex items-center gap-1 text-[10px] bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100"
                          style={{ color: card.color }}
                        >
                          <CardIcon size={10} />
                          <span className="font-semibold">{card.name}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium text-slate-700">
                    {formatBRL(expense.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
