import { formatBRL } from "@/libs/currency";
import { FixedExpense } from "@/types/finance";
import { getPaymentStatus } from "./utils";
import { EntryRow } from "./EntryRow";

interface FixedExpenseEntryRowProps {
  expense: FixedExpense;
  monthId: number;
  onTogglePaid: () => void;
}

export function FixedExpenseEntryRow({
  expense,
  monthId,
  onTogglePaid,
}: FixedExpenseEntryRowProps) {
  const status = getPaymentStatus(monthId, expense.dueDay, expense.paid);

  const leading = (
    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-gray-400" />
  );

  const amount = (
    <span className="text-sm font-semibold text-slate-700 tabular-nums">
      {formatBRL(expense.amount)}
    </span>
  );

  return (
    <EntryRow
      isPaid={expense.paid}
      leading={leading}
      name={expense.name}
      status={status}
      amount={amount}
      onToggle={onTogglePaid}
    />
  );
}
