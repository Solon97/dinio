import { formatBRL } from "@/libs/currency";
import { FixedExpense } from "@/types/finance";
import { ArrowDownCircle } from "lucide-react";
import { getPaymentStatus } from "./utils";
import { EntryRow } from "./EntryRow";

interface RefundReceivableRowProps {
  expense: FixedExpense;
  monthId: number;
  onMarkPaid: () => void;
}

export function RefundReceivableRow({
  expense,
  onMarkPaid,
  monthId,
}: RefundReceivableRowProps) {
  const paid = !!expense.refundIncomeId;
  const status = getPaymentStatus(monthId, expense.dueDay, paid);

  const leading = (
    <ArrowDownCircle size={12} className="text-emerald-500 flex-shrink-0" />
  );

  const amount = (
    <span className="text-sm font-semibold text-emerald-600 tabular-nums">
      + {formatBRL(expense.amount)}
    </span>
  );

  return (
    <EntryRow
      isPaid={paid}
      leading={leading}
      name={`Reembolso: ${expense.name}`}
      status={status}
      amount={amount}
      onToggle={onMarkPaid}
      toggleVerb="recebido"
      isToggleDisabled={paid}
      disabledMessage="Para remover o reembolso, entre no setup do mês."
    />
  );
}
