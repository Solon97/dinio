"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { computeMonthId } from "@/libs/monthId";
import {
  buildInvoiceMonthOptions,
  getOpenInvoiceDueMonthId,
} from "@/libs/creditCardInvoice";
import { CreditCard } from "@/types/finance";
import { ExpenseEntryCard } from "./CaptureMenu/ExpenseEntryCard";
import { MAX_EXPENSE_ENTRIES, useExpenseEntries } from "./CaptureMenu/useExpenseEntries";
import { ExpenseEntry } from "./CaptureMenu/types";

function extractApiError(err: unknown, fallback: string): string {
  if (err !== null && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { error?: string } } }).response;
    if (response?.data?.error) return response.data.error;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

interface CaptureMenuProps {
  onTextCapture?: () => void;
  onPhotoCapture?: () => void;
  onAudioCapture?: () => void;
  onGalleryCapture?: () => void;
}

export default function CaptureMenu({ onTextCapture }: CaptureMenuProps) {
  const { addExpense, createFixedExpense, fetchCreditCards, currentConfig } =
    useBudget();

  const [showTextModal, setShowTextModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const {
    entries,
    addEntry,
    removeEntry,
    updateEntryField,
    updateEntryMode,
    setEntryStatus,
    validateAll,
    resetEntries,
  } = useExpenseEntries();

  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const getDefaultInvoiceMonthIdForCard = useCallback(
    (cardId: string): string => {
      const card = creditCards.find((item) => item.id === cardId);
      if (!card) return "";

      return String(
        getOpenInvoiceDueMonthId({
          referenceDate: new Date(),
          dueDay: card.dueDay,
          closingDay: card.closingDay,
        }),
      );
    },
    [creditCards],
  );

  useEffect(() => {
    if (showTextModal && creditCards.length === 0) {
      fetchCreditCards().then(setCreditCards);
    }
  }, [showTextModal, fetchCreditCards, creditCards.length]);

  useEffect(() => {
    if (entries.length === 0) {
      setExpandedEntryId(null);
      return;
    }

    if (expandedEntryId && entries.some((entry) => entry.id === expandedEntryId)) {
      return;
    }

    setExpandedEntryId(entries[entries.length - 1]?.id ?? null);
  }, [entries, expandedEntryId]);

  const handleTextClick = () => {
    setShowTextModal(true);
    onTextCapture?.();
  };

  const handleCloseModal = useCallback(() => {
    setShowTextModal(false);
    setIsSubmitting(false);
    setBatchProgress(null);
    setExpandedEntryId(null);
    resetEntries();
  }, [resetEntries]);

  const handleAddEntry = useCallback(() => {
    const createdEntryId = addEntry();
    if (createdEntryId) {
      setExpandedEntryId(createdEntryId);
    }
  }, [addEntry]);

  const getMinDate = useCallback(() => {
    if (currentConfig?.isPreviousMonthConfigured) {
      const today = new Date();
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return prevMonth.toISOString().split("T")[0];
    }
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentMonth.toISOString().split("T")[0];
  }, [currentConfig?.isPreviousMonthConfigured]);

  const minDate = getMinDate();

  const getDailyInvoiceMonthOptions = useCallback(
    (entry: ExpenseEntry) => {
      const extraMonthIds: number[] = [];
      if (entry.daily.invoiceMonthId) {
        extraMonthIds.push(parseInt(entry.daily.invoiceMonthId));
      }
      if (entry.daily.cardId) {
        const defaultMonthId = getDefaultInvoiceMonthIdForCard(entry.daily.cardId);
        if (defaultMonthId) extraMonthIds.push(parseInt(defaultMonthId));
      }

      return buildInvoiceMonthOptions({
        referenceDate: new Date(),
        extraMonthIds,
      });
    },
    [getDefaultInvoiceMonthIdForCard],
  );

  const targetMonthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const target = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
      const label = target.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      options.push({ value, label });
    }
    return options;
  }, []);

  const handleBatchSubmit = async () => {
    if (isSubmitting) return;

    const validation = validateAll(minDate);
    if (!validation.valid) {
      if (validation.firstInvalidId) {
        const invalidEntry = entryRefs.current[validation.firstInvalidId];
        if (invalidEntry) {
          requestAnimationFrame(() => {
            invalidEntry.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
      }
      return;
    }

    const pendingEntries = entries.filter((entry) => entry.status !== "success");
    if (pendingEntries.length === 0) {
      handleCloseModal();
      return;
    }

    setIsSubmitting(true);

    for (let index = 0; index < pendingEntries.length; index++) {
      const entry = pendingEntries[index];
      setBatchProgress({ current: index + 1, total: pendingEntries.length });
      setEntryStatus(entry.id, "submitting");

      try {
        if (entry.mode === "daily") {
          const now = new Date();
          const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          const finalAmount = entry.daily.isRefund
            ? -Math.abs(entry.daily.amount)
            : entry.daily.amount;

          await addExpense({
            date: entry.daily.date,
            amount: finalAmount,
            description: entry.daily.description.trim(),
            category: entry.daily.category,
            time,
            creditCardId: entry.daily.cardId || null,
            invoiceDueMonthId: entry.daily.invoiceMonthId
              ? parseInt(entry.daily.invoiceMonthId)
              : null,
          });
        } else {
          const [yearStr, monthStr] = entry.fixed.targetMonth.split("-");
          const targetMonthId = computeMonthId(
            parseInt(yearStr),
            parseInt(monthStr) - 1,
          );

          await createFixedExpense({
            name: entry.fixed.name.trim(),
            amount: entry.fixed.amount,
            dueDay:
              entry.fixed.paymentType === "debit" ? entry.fixed.dueDay : undefined,
            type: entry.fixed.type,
            creditCardId:
              entry.fixed.paymentType === "card"
                ? entry.fixed.cardId || undefined
                : undefined,
            isInstallment: entry.fixed.isInstallment,
            totalInstallments: entry.fixed.isInstallment
              ? entry.fixed.totalInstallments
              : undefined,
            startInstallment: entry.fixed.isInstallment
              ? entry.fixed.startInstallment
              : undefined,
            targetMonthId,
            isRefundable: entry.fixed.isRefundable,
          });
        }

        setEntryStatus(entry.id, "success");
      } catch (err) {
        const fallbackMessage =
          entry.mode === "daily" ? "Erro ao salvar gasto" : "Erro ao salvar gasto fixo";
        setEntryStatus(entry.id, "error", extractApiError(err, fallbackMessage));
        setIsSubmitting(false);
        setBatchProgress(null);
        return;
      }
    }

    handleCloseModal();
  };

  const submitLabel = batchProgress
    ? `Adicionando ${batchProgress.current} de ${batchProgress.total}...`
    : "Adicionar";

  return (
    <>
      {showTextModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 h-[90vh] md:h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-700">Adicionar Gastos</h3>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  ref={(node) => {
                    entryRefs.current[entry.id] = node;
                  }}
                >
                  <ExpenseEntryCard
                    entry={entry}
                    index={index}
                    canRemove={entries.length > 1}
                    isExpanded={entry.id === expandedEntryId}
                    creditCards={creditCards}
                    minDate={minDate}
                    onExpand={setExpandedEntryId}
                    onModeChange={updateEntryMode}
                    onFieldChange={updateEntryField}
                    onRemove={removeEntry}
                    getDefaultInvoiceMonthIdForCard={getDefaultInvoiceMonthIdForCard}
                    getDailyInvoiceMonthOptions={getDailyInvoiceMonthOptions}
                    getTargetMonthOptions={() => targetMonthOptions}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddEntry}
                disabled={entries.length >= MAX_EXPENSE_ENTRIES || isSubmitting}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 text-slate-600 font-medium hover:border-teal-400 hover:text-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Adicionar outro gasto ({entries.length}/{MAX_EXPENSE_ENTRIES})
              </button>

              <div className="flex gap-2 pt-2 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBatchSubmit}
                  disabled={isSubmitting && !batchProgress}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {submitLabel}
                    </>
                  ) : (
                    "Adicionar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        <button
          onClick={handleTextClick}
          className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 pointer-events-auto bg-teal-500 hover:bg-teal-600 shadow-teal-500/30"
        >
          <Plus size={28} className="text-white" />
        </button>
      </div>
    </>
  );
}
