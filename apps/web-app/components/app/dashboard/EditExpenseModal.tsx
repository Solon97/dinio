"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { CreditCard } from "@/types/finance";
import { CATEGORY_OPTIONS } from "@/constants/categories";
import { ExpenseResponse } from "@/types/budget";
import {
  buildInvoiceMonthOptions,
  getOpenInvoiceDueMonthId,
} from "@/libs/creditCardInvoice";

interface DailyFormErrors {
  amount?: string;
  description?: string;
  date?: string;
  card?: string;
  general?: string;
}

function validateDailyForm(values: {
  amount: number;
  description: string;
  date: string;
  cardId: string;
  invoiceMonthId: string;
}): DailyFormErrors {
  const errors: DailyFormErrors = {};

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
  }

  if (values.cardId && !values.invoiceMonthId) {
    errors.card = "Selecione a fatura do cartão escolhido";
  }

  return errors;
}

function extractApiError(err: unknown, fallback: string): string {
  if (err !== null && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { error?: string } } })
      .response;
    if (response?.data?.error) return response.data.error;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

interface EditExpenseModalProps {
  expense: ExpenseResponse;
  onClose: () => void;
}

export default function EditExpenseModal({
  expense,
  onClose,
}: EditExpenseModalProps) {
  const { editExpense, fetchCreditCards, currentConfig } = useBudget();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial values from expense
  const initialAmount = Math.abs(expense.amount);
  const initialIsRefund = expense.amount < 0;

  const [amount, setAmount] = useState<number>(initialAmount);
  const [description, setDescription] = useState(expense.description);
  const [category, setCategory] = useState<string>(expense.category);
  const [isRefund, setIsRefund] = useState(initialIsRefund);

  // Dates in API are YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(expense.date);

  const [selectedDailyCardId, setSelectedDailyCardId] = useState<string>(
    expense.creditCard?.id || "",
  );
  const [selectedDailyInvoiceMonthId, setSelectedDailyInvoiceMonthId] =
    useState<string>(
      expense.invoiceDueMonthId ? String(expense.invoiceDueMonthId) : "",
    );

  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [dailyErrors, setDailyErrors] = useState<DailyFormErrors>({});

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
    fetchCreditCards().then(setCreditCards);
  }, [fetchCreditCards]);

  useEffect(() => {
    if (!selectedDailyCardId || selectedDailyInvoiceMonthId) return;
    setSelectedDailyInvoiceMonthId(
      getDefaultInvoiceMonthIdForCard(selectedDailyCardId),
    );
  }, [
    selectedDailyCardId,
    selectedDailyInvoiceMonthId,
    getDefaultInvoiceMonthIdForCard,
  ]);

  const handleSubmit = async () => {
    const errors = validateDailyForm({
      amount,
      description,
      date: selectedDate,
      cardId: selectedDailyCardId,
      invoiceMonthId: selectedDailyInvoiceMonthId,
    });

    if (Object.keys(errors).length > 0) {
      setDailyErrors(errors);
      return;
    }

    if (isSubmitting) return;

    setDailyErrors({});

    const finalAmount = isRefund ? -amount : amount;

    setIsSubmitting(true);
    try {
      await editExpense(expense.id, {
        date: selectedDate,
        amount: finalAmount,
        description: description.trim(),
        category,
        creditCardId: selectedDailyCardId || null,
        invoiceDueMonthId: selectedDailyInvoiceMonthId
          ? parseInt(selectedDailyInvoiceMonthId)
          : null,
      });

      onClose();
    } catch (err) {
      setDailyErrors({ general: extractApiError(err, "Erro ao salvar gasto") });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate min date for daily expenses (can't move to a past month if previous month is configured)
  const getMinDate = () => {
    if (currentConfig?.isPreviousMonthConfigured) {
      const today = new Date();
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return prevMonth.toISOString().split("T")[0];
    }
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentMonth.toISOString().split("T")[0];
  };

  // However, when editing, we shouldn't restrict date as much if it's already in the past?
  // Let's use the minimum of getMinDate() and the expense's current date so they can at least keep it on the same day.
  const minDate = [getMinDate(), expense.date].sort()[0];

  const isDailyFormValid =
    amount > 0 &&
    description.trim().length >= 3 &&
    selectedDate !== "" &&
    (!selectedDailyCardId || selectedDailyInvoiceMonthId !== "");

  // Generate invoice month options and keep selected/default due month available.
  const getDailyInvoiceMonthOptions = () => {
    const extraMonthIds: number[] = [];

    if (expense.invoiceDueMonthId) {
      extraMonthIds.push(expense.invoiceDueMonthId);
    }
    if (selectedDailyInvoiceMonthId) {
      extraMonthIds.push(parseInt(selectedDailyInvoiceMonthId));
    }
    if (selectedDailyCardId) {
      const defaultMonthId =
        getDefaultInvoiceMonthIdForCard(selectedDailyCardId);
      if (defaultMonthId) extraMonthIds.push(parseInt(defaultMonthId));
    }

    return buildInvoiceMonthOptions({
      referenceDate: new Date(),
      extraMonthIds,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-slate-700">Editar Gasto</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Amount Input */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              Valor (R$) *
            </label>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              placeholder="0,00"
              autoFocus
              showCurrencySymbol={false}
              className="text-2xl font-bold text-center"
            />
            {dailyErrors.amount && (
              <p className="text-xs text-red-500 mt-1">{dailyErrors.amount}</p>
            )}
          </div>

          {/* Refund Toggle */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-teal-300 transition-colors">
            <input
              type="checkbox"
              checked={isRefund}
              onChange={(e) => setIsRefund(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex items-center gap-2">
              <RefreshCw
                size={16}
                className={isRefund ? "text-emerald-500" : "text-slate-400"}
              />
              <span
                className={`text-sm font-medium ${isRefund ? "text-emerald-600" : "text-slate-600"}`}
              >
                É um reembolso ou estorno?
              </span>
            </div>
          </label>

          {isRefund && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
              💰 Você vai receber de volta R${" "}
              {amount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          )}

          {/* Description Input */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Almoço no restaurante"
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {dailyErrors.description && (
              <p className="text-xs text-red-500 mt-1">
                {dailyErrors.description}
              </p>
            )}
          </div>

          {/* Category Select */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Input */}
          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDate}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {dailyErrors.date && (
              <p className="text-xs text-red-500 mt-1">{dailyErrors.date}</p>
            )}
          </div>

          {/* Credit Card (optional) */}
          {creditCards.length > 0 && (
            <div>
              <label className="text-sm text-slate-500 mb-2 block font-medium">
                Cartão de crédito{" "}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDailyCardId("");
                    setSelectedDailyInvoiceMonthId("");
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedDailyCardId === ""
                      ? "bg-slate-700 text-white border-slate-700"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  Nenhum
                </button>
                {creditCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      const cardId = card.id ?? "";
                      setSelectedDailyCardId(cardId);
                      if (!expense.invoiceDueMonthId) {
                        setSelectedDailyInvoiceMonthId(
                          getDefaultInvoiceMonthIdForCard(cardId),
                        );
                      } else {
                        setSelectedDailyInvoiceMonthId(
                          String(expense.invoiceDueMonthId),
                        );
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedDailyCardId === card.id
                        ? "text-white border-transparent"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                    style={
                      selectedDailyCardId === card.id
                        ? {
                            backgroundColor: card.color,
                            borderColor: card.color,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: card.color }}
                    />
                    {card.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Invoice Month - required when a card is selected */}
          {selectedDailyCardId && (
            <div>
              <label className="text-sm text-slate-500 mb-2 block font-medium">
                Fatura
              </label>
              <select
                value={selectedDailyInvoiceMonthId}
                onChange={(e) => setSelectedDailyInvoiceMonthId(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 normal-case"
              >
                <option value="">Selecione a fatura...</option>
                {getDailyInvoiceMonthOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Selecione o mês de vencimento da fatura.
              </p>
              {dailyErrors.card && (
                <p className="text-xs text-red-500 mt-1">{dailyErrors.card}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {dailyErrors.general && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {dailyErrors.general}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isDailyFormValid || isSubmitting}
              className={`flex-1 py-3 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isRefund
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
