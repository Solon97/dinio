import { formatBRL } from "@/libs/currency";
import { InvoiceWithDetails, PaymentItem } from "@/types/budget";
import { FixedExpense } from "@/types/finance";
import { FixedExpenseEntryRow } from "./FixedExpenseRow";
import { InvoiceRow } from "./InvoiceRow";
import { RefundReceivableRow } from "./RefundReceivableRow";
import { InvoiceExpensesState, PaymentGroup } from "./utils";

interface PaymentGroupSectionProps {
  group: PaymentGroup;
  monthId: number;
  expandedInvoiceId: string | null;
  invoiceExpensesMap: Record<string, InvoiceExpensesState>;
  onToggleInvoicePaid: (invoice: InvoiceWithDetails) => void;
  onToggleFixedPaid: (expense: FixedExpense) => void;
  onToggleInvoiceExpenses: (invoice: InvoiceWithDetails) => void;
  onMarkRefundPaid: (expense: FixedExpense) => void;
}

export function PaymentGroupSection({
  group,
  monthId,
  expandedInvoiceId,
  invoiceExpensesMap,
  onToggleInvoicePaid,
  onToggleFixedPaid,
  onToggleInvoiceExpenses,
  onMarkRefundPaid,
}: PaymentGroupSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 py-1">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Dia {group.dueDay}
        </span>
        <span
          className={`text-xs font-bold ${
            group.total < 0 ? "text-emerald-600" : "text-slate-500"
          }`}
        >
          {group.total < 0 ? "+ " : ""}
          {formatBRL(Math.abs(group.total))}
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {group.items.map((item) =>
          item.kind === "invoice" ? (
            <InvoiceRow
              key={item.data.id}
              invoice={item.data}
              monthId={monthId}
              isExpanded={expandedInvoiceId === item.data.id}
              expenses={invoiceExpensesMap[item.data.id] ?? null}
              onTogglePaid={() => onToggleInvoicePaid(item.data)}
              onToggleExpenses={() => onToggleInvoiceExpenses(item.data)}
            />
          ) : item.kind === "refund" ? (
            <RefundReceivableRow
              key={`refund-${item.data.id}`}
              expense={item.data}
              onMarkPaid={() => onMarkRefundPaid(item.data)}
              monthId={monthId}
            />
          ) : (
            <FixedExpenseEntryRow
              key={item.data.id ?? item.data.name}
              expense={item.data}
              monthId={monthId}
              onTogglePaid={() => onToggleFixedPaid(item.data)}
            />
          ),
        )}
      </div>
    </div>
  );
}
