import { useCallback, useState } from "react";
import { CATEGORY_OPTIONS } from "@/constants/categories";
import { ExpenseType } from "@/types/finance";
import {
  DailyEntryErrors,
  DailyEntryState,
  EntryMode,
  EntryStatus,
  ExpenseEntry,
  FixedEntryErrors,
  FixedEntryState,
} from "./types";

export const MAX_EXPENSE_ENTRIES = 10;

function createEntryId(): string {
  return `temp-${Date.now()}-${Math.random()}`;
}

function getDefaultDateValue(): string {
  return new Date().toISOString().split("T")[0];
}

function getDefaultTargetMonthValue(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
}

function createDailyState(amount = 0): DailyEntryState {
  return {
    amount,
    description: "",
    category: CATEGORY_OPTIONS[0]?.value ?? "Outros",
    isRefund: false,
    date: getDefaultDateValue(),
    cardId: "",
    invoiceMonthId: "",
  };
}

function createFixedState(amount = 0): FixedEntryState {
  return {
    name: "",
    amount,
    dueDay: 1,
    type: ExpenseType.DISCRETIONARY,
    paid: false,
    isInstallment: false,
    totalInstallments: undefined,
    startInstallment: undefined,
    isRefundable: false,
    paymentType: "debit",
    cardId: "",
    targetMonth: getDefaultTargetMonthValue(),
  };
}

function createInitialEntry(id = createEntryId()): ExpenseEntry {
  return {
    id,
    mode: "daily",
    status: "idle",
    daily: createDailyState(),
    fixed: createFixedState(),
    errors: {},
  };
}

function validateDailyForm(
  values: DailyEntryState,
  minDate: string,
): DailyEntryErrors {
  const errors: DailyEntryErrors = {};

  if (!values.amount || values.amount === 0) {
    errors.amount = "Informe um valor maior que zero";
  } else if (Math.abs(values.amount) > 999999.99) {
    errors.amount = "Valor máximo é R$ 999.999,99";
  }

  const trimmedDescription = values.description.trim();
  if (trimmedDescription.length < 3) {
    errors.description = "Descrição obrigatória (mínimo 3 caracteres)";
  } else if (trimmedDescription.length > 120) {
    errors.description = "Descrição deve ter no máximo 120 caracteres";
  }

  if (!values.date) {
    errors.date = "Informe a data";
  } else if (values.date < minDate) {
    errors.date = "Data inválida para o período configurado";
  }

  if (values.cardId && !values.invoiceMonthId) {
    errors.card = "Selecione a fatura do cartão escolhido";
  }

  return errors;
}

function validateFixedForm(values: FixedEntryState): FixedEntryErrors {
  const errors: FixedEntryErrors = {};

  const trimmedName = values.name.trim();
  if (trimmedName.length < 3) {
    errors.name = "Nome obrigatório (mínimo 3 caracteres)";
  } else if (trimmedName.length > 120) {
    errors.name = "Nome deve ter no máximo 120 caracteres";
  }

  if (!values.amount || values.amount <= 0) {
    errors.amount = "Informe um valor maior que zero";
  } else if (values.amount > 999999.99) {
    errors.amount = "Valor máximo é R$ 999.999,99";
  }

  if (values.paymentType === "card" && !values.cardId) {
    errors.card = "Selecione um cartão de crédito";
  }

  if (
    values.isInstallment &&
    (!values.totalInstallments || values.totalInstallments < 2)
  ) {
    errors.installments = "Informe o número de parcelas (mínimo 2)";
  }

  return errors;
}

export function useExpenseEntries() {
  const [entries, setEntries] = useState<ExpenseEntry[]>([createInitialEntry()]);

  const addEntry = useCallback((): string | null => {
    const nextEntry = createInitialEntry();
    setEntries((prev) => {
      if (prev.length >= MAX_EXPENSE_ENTRIES) return prev;
      return [...prev, nextEntry];
    });

    return nextEntry.id;
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((entry) => entry.id !== id);
    });
  }, []);

  const updateEntryMode = useCallback((id: string, mode: EntryMode) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id || entry.mode === mode) return entry;

        if (mode === "daily") {
          return {
            ...entry,
            mode,
            status: entry.status === "error" ? "idle" : entry.status,
            daily: createDailyState(entry.fixed.amount),
            errors: {},
          };
        }

        return {
          ...entry,
          mode,
          status: entry.status === "error" ? "idle" : entry.status,
          fixed: createFixedState(entry.daily.amount),
          errors: {},
        };
      }),
    );
  }, []);

  const updateEntryField = useCallback(
    (
      id: string,
      mode: EntryMode,
      field: string,
      value: string | number | boolean | undefined,
    ) => {
      setEntries((prev) =>
        prev.map((entry) => {
          if (entry.id !== id) return entry;

          const nextEntry: ExpenseEntry = {
            ...entry,
            status: entry.status === "error" ? "idle" : entry.status,
            errors: {
              ...entry.errors,
              [field]: undefined,
              general: undefined,
            },
          };

          if (mode === "daily") {
            return {
              ...nextEntry,
              daily: {
                ...entry.daily,
                [field]: value,
              },
            };
          }

          return {
            ...nextEntry,
            fixed: {
              ...entry.fixed,
              [field]: value,
            },
          };
        }),
      );
    },
    [],
  );

  const setEntryStatus = useCallback(
    (id: string, status: EntryStatus, errorMessage?: string) => {
      setEntries((prev) =>
        prev.map((entry) => {
          if (entry.id !== id) return entry;

          return {
            ...entry,
            status,
            errors:
              status === "error"
                ? { ...entry.errors, general: errorMessage ?? "Erro inesperado" }
                : { ...entry.errors, general: undefined },
          };
        }),
      );
    },
    [],
  );

  const validateAll = useCallback(
    (minDate: string): { valid: boolean; firstInvalidId?: string } => {
      let firstInvalidId: string | undefined;

      setEntries((prev) =>
        prev.map((entry) => {
          if (entry.status === "success") {
            return { ...entry, errors: {} };
          }

          const errors =
            entry.mode === "daily"
              ? validateDailyForm(entry.daily, minDate)
              : validateFixedForm(entry.fixed);

          if (!firstInvalidId && Object.keys(errors).length > 0) {
            firstInvalidId = entry.id;
          }

          return {
            ...entry,
            status:
              Object.keys(errors).length > 0 && entry.status !== "submitting"
                ? "error"
                : entry.status,
            errors,
          };
        }),
      );

      return {
        valid: !firstInvalidId,
        firstInvalidId,
      };
    },
    [],
  );

  const resetEntries = useCallback(() => {
    setEntries([createInitialEntry()]);
  }, []);

  return {
    entries,
    addEntry,
    removeEntry,
    updateEntryField,
    updateEntryMode,
    setEntryStatus,
    validateAll,
    resetEntries,
    getDefaultTargetMonth: getDefaultTargetMonthValue,
    getDefaultDate: getDefaultDateValue,
  };
}
