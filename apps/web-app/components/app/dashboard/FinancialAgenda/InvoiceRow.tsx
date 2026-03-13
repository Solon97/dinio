import { formatBRL } from "@/libs/currency";
import { InvoiceExpenseItem, InvoiceWithDetails } from "@/types/budget";
import { ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { getPaymentStatus, InvoiceExpensesState } from "./utils";
import { EntryRow } from "./EntryRow";

interface InvoiceRowProps {
  invoice: InvoiceWithDetails;
  monthId: number;
  isExpanded: boolean;
  expenses: InvoiceExpensesState | null;
  onTogglePaid: () => void;
  onToggleExpenses: () => void;
}

export function InvoiceRow({
  invoice,
  monthId,
  isExpanded,
  expenses,
  onTogglePaid,
  onToggleExpenses,
}: InvoiceRowProps) {
  const isLoading = expenses === "loading";
  const status = getPaymentStatus(
    monthId,
    invoice.creditCard.dueDay,
    invoice.isPaid,
  );

  const leading = (
    <div
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: invoice.creditCard.color }}
    />
  );

  const amount = (
    <span className="text-sm font-semibold text-slate-700 tabular-nums">
      {formatBRL(invoice.totalAmount)}
    </span>
  );

  const footer = (
    <>
      <button
        type="button"
        onClick={onToggleExpenses}
        className="mt-1 flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition-colors ml-5"
      >
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        Ver despesas
      </button>

      {isExpanded && (
        <div className="mt-2 ml-5 space-y-0.5">
          {isLoading ? (
            <p className="text-xs text-slate-400 py-2">Carregando...</p>
          ) : Array.isArray(expenses) && expenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              Nenhuma despesa encontrada.
            </p>
          ) : (
            Array.isArray(expenses) &&
            expenses.map((exp) => (
              <InvoiceExpenseRow key={exp.id} expense={exp} />
            ))
          )}
        </div>
      )}
    </>
  );

  return (
    <EntryRow
      isPaid={invoice.isPaid}
      leading={leading}
      name={`Fatura: ${invoice.creditCard.name}`}
      status={status}
      amount={amount}
      onToggle={onTogglePaid}
      footer={footer}
    />
  );
}

function InvoiceExpenseRow({ expense }: { expense: InvoiceExpenseItem }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <ShoppingBag size={10} className="text-slate-300 flex-shrink-0" />
        <span className="text-slate-600 truncate">{expense.description}</span>
      </div>
      <span className="text-slate-700 font-medium tabular-nums flex-shrink-0">
        {formatBRL(expense.amount)}
      </span>
    </div>
  );
}
