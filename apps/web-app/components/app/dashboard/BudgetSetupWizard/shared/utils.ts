import { FixedExpense } from "@/types/finance";

const TOTAL_STEPS = 3;

const CARD_COLORS = [
  "#820ad1", // Nubank purple
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#1e293b", // Slate dark
];

/**
 * Get expenses associated with a specific credit card (excluding marked for deletion)
 */
function getCardExpenses(
  expenses: FixedExpense[],
  cardId: string,
): FixedExpense[] {
  return expenses.filter(
    (e) => e.creditCardId === cardId && !e.markedForDeletion,
  );
}

/**
 * Get standalone expenses (not linked to any credit card, excluding marked for deletion)
 */
function getStandaloneExpenses(expenses: FixedExpense[]): FixedExpense[] {
  return expenses.filter((e) => !e.creditCardId && !e.markedForDeletion);
}

/**
 * Parses bulk expense text into name/amount pairs.
 * Format: one expense per line, "Nome, Valor" (comma separator).
 * Supports decimal comma (e.g. "40,50" when no space after comma).
 * Ignores empty or malformed lines.
 */
function parseExpenseBulkText(text: string): {
  name: string;
  amount: number;
  isInstallment?: boolean;
  totalInstallments?: number;
  startInstallment?: number;
}[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const parts = line.split(";").map((p) => p.trim());
      if (parts.length < 2) return [];

      const name = parts[0];
      const rawValue = parts[1].replace(",", ".");
      let amount = parseFloat(rawValue);

      if (!name || isNaN(amount) || amount <= 0) return [];

      let isInstallment = false;
      let totalInstallments = undefined;
      let startInstallment = undefined;

      if (parts.length >= 3) {
        // Try parsing X/Y format or just Y
        const installmentsStr = parts[2];
        let parsedTotal = NaN;
        let parsedStart = NaN;

        if (installmentsStr.includes("/")) {
          const [startStr, totalStr] = installmentsStr.split("/");
          parsedStart = parseInt(startStr, 10);
          parsedTotal = parseInt(totalStr, 10);
        } else {
          parsedTotal = parseInt(installmentsStr, 10);
          parsedStart = 1;
        }

        if (!isNaN(parsedTotal) && parsedTotal > 1) {
          isInstallment = true;
          totalInstallments = parsedTotal;
          if (
            !isNaN(parsedStart) &&
            parsedStart >= 1 &&
            parsedStart <= parsedTotal
          ) {
            startInstallment = parsedStart;
          } else {
            startInstallment = 1;
          }

          if (parts.length >= 4) {
            const inputType = parts[3].charAt(0).toUpperCase();
            if (inputType === "P") {
              amount = amount * totalInstallments;
            }
          }
        }
      }

      return [
        { name, amount, isInstallment, totalInstallments, startInstallment },
      ];
    });
}

export {
  TOTAL_STEPS,
  CARD_COLORS,
  getCardExpenses,
  getStandaloneExpenses,
  parseExpenseBulkText,
};
