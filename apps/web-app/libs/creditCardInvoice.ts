import { addMonths, computeMonthIdFromDate } from "@/libs/monthId";
import {
  computeInvoiceDueMonthIdForDate,
  formatMonthIdLabel,
  getEffectiveClosingDay,
} from "dinio-shared";

export interface InvoiceMonthOption {
  value: string;
  label: string;
}

/**
 * Get the open (current/next) invoice due month for a credit card.
 * This is a thin wrapper around computeInvoiceDueMonthIdForDate.
 */
export const getOpenInvoiceDueMonthId = ({
  referenceDate = new Date(),
  dueDay,
  closingDay,
}: {
  referenceDate?: Date;
  dueDay?: number;
  closingDay?: number;
}): number => {
  return computeInvoiceDueMonthIdForDate({
    expenseDate: referenceDate,
    dueDay,
    closingDay,
  });
};

/**
 * Keep backward-compatible fallback behavior for callers that only have due day.
 */
export const getFallbackClosingDay = (dueDay?: number): number => {
  return getEffectiveClosingDay({ dueDay });
};

export const buildInvoiceMonthOptions = ({
  referenceDate = new Date(),
  extraMonthIds = [],
}: {
  referenceDate?: Date;
  extraMonthIds?: number[];
}): InvoiceMonthOption[] => {
  const monthIds = new Set<number>([
    computeMonthIdFromDate(referenceDate),
    addMonths(computeMonthIdFromDate(referenceDate), 1),
    ...extraMonthIds,
  ]);

  return [...monthIds]
    .sort((a, b) => a - b)
    .map((monthId) => ({
      value: String(monthId),
      label: formatMonthIdLabel(monthId),
    }));
};
