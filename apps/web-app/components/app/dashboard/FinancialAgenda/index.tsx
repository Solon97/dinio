"use client";

import { useBudget } from "@/contexts/BudgetContext";
import { InvoiceWithDetails, PaymentItem } from "@/types/budget";
import { Info } from "lucide-react";
import { useMemo } from "react";
import { PaymentGroupSection } from "./PaymentGroupSection";
import { useInvoiceExpenses } from "./useInvoiceExpenses";
import { buildPaymentGroups } from "./utils";

interface FinancialAgendaProps {
  monthId: number;
  payments: PaymentItem[];
}

export default function FinancialAgenda({
  monthId,
  payments,
}: FinancialAgendaProps) {
  const {
    markInvoiceAsPaid,
    markFixedExpensePaid,
    markFixedExpenseRefundPaid,
  } = useBudget();
  const { expandedInvoiceId, invoiceExpensesMap, toggleInvoiceExpenses } =
    useInvoiceExpenses();

  const groups = useMemo(() => buildPaymentGroups(payments), [payments]);

  const handleToggleInvoiceExpenses = (invoice: InvoiceWithDetails) => {
    toggleInvoiceExpenses(invoice, monthId);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-gray-800 font-bold text-lg">Agenda Financeira</h3>
        <AgendaInfoTooltip />
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">
          Nenhum pagamento com vencimento neste mês.
        </p>
      ) : (
        <div className="space-y-5 max-h-96 overflow-y-auto pr-3">
          {groups.map((group) => (
            <PaymentGroupSection
              key={group.dueDay}
              group={group}
              monthId={monthId}
              expandedInvoiceId={expandedInvoiceId}
              invoiceExpensesMap={invoiceExpensesMap}
              onToggleInvoicePaid={(invoice) =>
                markInvoiceAsPaid(invoice.id, !invoice.isPaid)
              }
              onToggleFixedPaid={(expense) =>
                expense.id && markFixedExpensePaid(expense.id, !expense.paid)
              }
              onToggleInvoiceExpenses={handleToggleInvoiceExpenses}
              onMarkRefundPaid={(expense) =>
                expense.id && markFixedExpenseRefundPaid(expense.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AgendaInfoTooltip() {
  return (
    <div className="group relative">
      <Info size={14} className="text-slate-400 cursor-help" />
      <div className="absolute right-0 top-6 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 hidden group-hover:block z-10 shadow-lg leading-relaxed pointer-events-none">
        <ul className="list-disc pl-4 space-y-1">
          <li>
            Faturas, gastos fixos e reembolsos agrupados por dia de vencimento.
          </li>
          <li>
            Os valores a pagar já estão inclusos no planejamento do mês, marcar
            como pago é apenas para facilitar o controle de pagamentos.
          </li>
          <li>
            Ao marcar um reembolso como recebido, é criada uma entrada de
            receita e o valor é distribuído automaticamente entre Dia a Dia e
            Reserva.
          </li>
        </ul>
      </div>
    </div>
  );
}
