"use client";

import apiClient from "@/libs/api";
import { InvoiceExpenseItem, InvoiceWithDetails } from "@/types/budget";
import { useState } from "react";
import { InvoiceExpensesState } from "./utils";

interface UseInvoiceExpensesReturn {
  expandedInvoiceId: string | null;
  invoiceExpensesMap: Record<string, InvoiceExpensesState>;
  toggleInvoiceExpenses: (
    invoice: InvoiceWithDetails,
    monthId: number,
  ) => Promise<void>;
}

export function useInvoiceExpenses(): UseInvoiceExpensesReturn {
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(
    null,
  );
  const [invoiceExpensesMap, setInvoiceExpensesMap] = useState<
    Record<string, InvoiceExpensesState>
  >({});

  const toggleInvoiceExpenses = async (
    invoice: InvoiceWithDetails,
    monthId: number,
  ) => {
    if (expandedInvoiceId === invoice.id) {
      setExpandedInvoiceId(null);
      return;
    }

    setExpandedInvoiceId(invoice.id);

    const alreadyLoaded =
      invoiceExpensesMap[invoice.id] &&
      invoiceExpensesMap[invoice.id] !== "loading";

    if (alreadyLoaded) return;

    setInvoiceExpensesMap((prev) => ({ ...prev, [invoice.id]: "loading" }));

    try {
      const data: { expenses: InvoiceExpenseItem[] } = await apiClient.get(
        `/credit-card-invoices/expenses?month_id=${monthId}&credit_card_id=${invoice.creditCard.id}`,
      );
      setInvoiceExpensesMap((prev) => ({
        ...prev,
        [invoice.id]: data.expenses ?? [],
      }));
    } catch {
      setInvoiceExpensesMap((prev) => ({ ...prev, [invoice.id]: [] }));
    }
  };

  return { expandedInvoiceId, invoiceExpensesMap, toggleInvoiceExpenses };
}
