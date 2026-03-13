import { describe, expect, it } from "vitest";

import { computeInvoiceDueMonthIdForDate } from "dinio-shared";
import {getOpenInvoiceDueMonthId} from "./creditCardInvoice";

describe("computeInvoiceDueMonthIdForDate", () => {
  it("keeps same due month when purchase is on or before same-month closing day", () => {
    const result = computeInvoiceDueMonthIdForDate({
      expenseDate: new Date(2026, 2, 3),
      dueDay: 10,
      closingDay: 3,
    });

    expect(result).toBe(202603);
  });

  it("moves to next due month when purchase is after same-month closing day", () => {
    const result = computeInvoiceDueMonthIdForDate({
      expenseDate: new Date(2026, 2, 4),
      dueDay: 10,
      closingDay: 3,
    });

    expect(result).toBe(202604);
  });

  it("supports previous-month closing and maps early-month purchases to next due month", () => {
    const result = computeInvoiceDueMonthIdForDate({
      expenseDate: new Date(2026, 2, 5),
      dueDay: 7,
      closingDay: 28,
    });

    expect(result).toBe(202604);
  });

  it("supports previous-month closing and can map to month+2 after closing", () => {
    const result = computeInvoiceDueMonthIdForDate({
      expenseDate: new Date(2026, 2, 29),
      dueDay: 7,
      closingDay: 28,
    });

    expect(result).toBe(202605);
  });

  it("handles year rollover when previous-month closing pushes to month+2", () => {
    const result = computeInvoiceDueMonthIdForDate({
      expenseDate: new Date(2026, 11, 29),
      dueDay: 7,
      closingDay: 28,
    });

    expect(result).toBe(202702);
  });

  it("uses fallback closing day when closing day is missing", () => {
    const result = computeInvoiceDueMonthIdForDate({
      expenseDate: new Date(2026, 2, 2),
      dueDay: 7,
    });

    expect(result).toBe(202604);
  });
});

describe("getOpenInvoiceDueMonthId", () => {
  it("returns the open due month using the same cycle logic", () => {
    const result = getOpenInvoiceDueMonthId({
      referenceDate: new Date(2026, 2, 29),
      dueDay: 7,
      closingDay: 28,
    });

    expect(result).toBe(202605);
  });
});
