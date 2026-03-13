import { parseMonthId } from "@/libs/monthId";
import { InvoiceExpenseItem, PaymentItem } from "@/types/budget";

export type InvoiceExpensesState = InvoiceExpenseItem[] | "loading";

export interface PaymentGroup {
  dueDay: number;
  items: PaymentItem[];
  total: number;
}

export const statusConfig = {
  paid: { text: "Pago", bgColor: "bg-teal-100", textColor: "text-teal-700" },
  pending: {
    text: "Pendente",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
  },
  overdue: {
    text: "Em atraso",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
  },
};

export function getPaymentStatus(
  monthId: number,
  dueDay: number,
  isPaid: boolean,
): "paid" | "pending" | "overdue" {
  if (isPaid) return "paid";

  const { year, month } = parseMonthId(monthId);
  const dueDate = new Date(year, month, dueDay);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today > dueDate) return "overdue";
  return "pending";
}

export function buildPaymentGroups(payments: PaymentItem[]): PaymentGroup[] {
  const groupMap = new Map<number, PaymentItem[]>();

  for (const item of payments) {
    const day =
      item.kind === "invoice" ? item.data.creditCard.dueDay : item.data.dueDay;
    const existing = groupMap.get(day) ?? [];
    existing.push(item);
    groupMap.set(day, existing);
  }

  return Array.from(groupMap.entries())
    .map(([dueDay, items]) => ({
      dueDay,
      items,
      // Net total: payables positive, receivable refunds negative
      total: items.reduce((sum, item) => {
        if (item.kind === "invoice") return sum + item.data.totalAmount;
        if (item.kind === "refund") return sum - item.data.amount;
        return sum + item.data.amount;
      }, 0),
    }))
    .sort((a, b) => a.dueDay - b.dueDay);
}
