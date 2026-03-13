"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X, Loader2, RefreshCw } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { ExpenseItem } from "@/components/app/dashboard/BudgetSetupWizard/shared/ExpenseItem";
import { computeMonthId } from "@/libs/monthId";
import { CreditCard, ExpenseType, FixedExpense } from "@/types/finance";
import { CATEGORY_OPTIONS } from "@/constants/categories";
import {
  buildInvoiceMonthOptions,
  getOpenInvoiceDueMonthId,
} from "@/libs/creditCardInvoice";

type CaptureMode = "daily" | "fixed";

interface DailyFormErrors {
  amount?: string;
  description?: string;
  date?: string;
  card?: string;
  general?: string;
}

interface FixedFormErrors {
  name?: string;
  amount?: string;
  card?: string;
  installments?: string;
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

function validateFixedForm(values: {
  name: string;
  amount: number;
  paymentType: "debit" | "card";
  cardId: string;
  isInstallment: boolean;
  totalInstallments?: number;
}): FixedFormErrors {
  const errors: FixedFormErrors = {};

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

function extractApiError(err: unknown, fallback: string): string {
  if (err !== null && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { error?: string } } })
      .response;
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

const INITIAL_FIXED_EXPENSE: FixedExpense = {
  name: "",
  amount: 0,
  dueDay: 1,
  type: ExpenseType.DISCRETIONARY,
  paid: false,
  isInstallment: false,
};

export default function CaptureMenu({ onTextCapture }: CaptureMenuProps) {
  const { addExpense, createFixedExpense, fetchCreditCards, currentConfig } =
    useBudget();

  const [showTextModal, setShowTextModal] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("daily");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Daily form state
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Outros");
  const [isRefund, setIsRefund] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedDailyCardId, setSelectedDailyCardId] = useState<string>("");
  const [selectedDailyInvoiceMonthId, setSelectedDailyInvoiceMonthId] =
    useState<string>("");

  // Fixed expense form state
  const [fixedExpense, setFixedExpense] = useState<FixedExpense>({
    ...INITIAL_FIXED_EXPENSE,
  });
  const [fixedPaymentType, setFixedPaymentType] = useState<"debit" | "card">(
    "debit",
  );
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [fixedTargetMonth, setFixedTargetMonth] = useState(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
  });

  const [dailyErrors, setDailyErrors] = useState<DailyFormErrors>({});
  const [fixedErrors, setFixedErrors] = useState<FixedFormErrors>({});

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

  // Load credit cards when modal opens
  useEffect(() => {
    if (showTextModal && creditCards.length === 0) {
      fetchCreditCards().then(setCreditCards);
    }
  }, [showTextModal, fetchCreditCards, creditCards.length]);

  const resetForm = () => {
    setAmount(0);
    setDescription("");
    setCategory("Outros");
    setIsRefund(false);
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setSelectedDailyCardId("");
    setSelectedDailyInvoiceMonthId("");
    setFixedExpense({ ...INITIAL_FIXED_EXPENSE });
    setFixedPaymentType("debit");
    setSelectedCardId("");
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    setFixedTargetMonth(
      `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`,
    );
    setDailyErrors({});
    setFixedErrors({});
  };

  const handleTextClick = () => {
    setShowTextModal(true);
    onTextCapture?.();
  };

  const handleCloseModal = () => {
    setShowTextModal(false);
    setCaptureMode("daily");
    resetForm();
  };

  const handleDailySubmit = async () => {
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

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const finalAmount = isRefund ? -amount : amount;

    setIsSubmitting(true);
    try {
      await addExpense({
        date: selectedDate,
        amount: finalAmount,
        description: description.trim(),
        category,
        time,
        creditCardId: selectedDailyCardId || null,
        invoiceDueMonthId: selectedDailyInvoiceMonthId
          ? parseInt(selectedDailyInvoiceMonthId)
          : null,
      });

      handleCloseModal();
    } catch (err) {
      setDailyErrors({ general: extractApiError(err, "Erro ao salvar gasto") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFixedSubmit = async () => {
    const errors = validateFixedForm({
      name: fixedExpense.name,
      amount: fixedExpense.amount,
      paymentType: fixedPaymentType,
      cardId: selectedCardId,
      isInstallment: fixedExpense.isInstallment ?? false,
      totalInstallments: fixedExpense.totalInstallments,
    });

    if (Object.keys(errors).length > 0) {
      setFixedErrors(errors);
      return;
    }

    if (isSubmitting) return;

    setFixedErrors({});

    const [yearStr, monthStr] = fixedTargetMonth.split("-");
    const targetMonthId = computeMonthId(
      parseInt(yearStr),
      parseInt(monthStr) - 1,
    );

    setIsSubmitting(true);
    try {
      await createFixedExpense({
        name: fixedExpense.name,
        amount: fixedExpense.amount,
        dueDay: fixedPaymentType === "debit" ? fixedExpense.dueDay : undefined,
        type: fixedExpense.type,
        creditCardId:
          fixedPaymentType === "card" ? selectedCardId || undefined : undefined,
        isInstallment: fixedExpense.isInstallment,
        totalInstallments: fixedExpense.isInstallment
          ? fixedExpense.totalInstallments
          : undefined,
        startInstallment: fixedExpense.isInstallment
          ? fixedExpense.startInstallment
          : undefined,
        targetMonthId,
        isRefundable: fixedExpense.isRefundable ?? false,
      });

      handleCloseModal();
    } catch (err) {
      setFixedErrors({
        general: extractApiError(err, "Erro ao salvar gasto fixo"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFixedExpense = useCallback(
    (
      _id: string | undefined,
      field: keyof FixedExpense,
      value: string | number | boolean | undefined,
    ) => {
      setFixedExpense((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const removeFixedExpense = useCallback(() => {
    setFixedExpense({ ...INITIAL_FIXED_EXPENSE });
  }, []);

  // Calculate min date for daily expenses
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

  const minDate = getMinDate();
  const isDailyFormValid =
    amount > 0 &&
    description.trim().length >= 3 &&
    selectedDate !== "" &&
    (!selectedDailyCardId || selectedDailyInvoiceMonthId !== "");
  const isFixedFormValid =
    fixedExpense.name.trim().length > 0 &&
    fixedExpense.amount > 0 &&
    (fixedPaymentType === "debit" || selectedCardId);

  // Generate invoice month options and ensure selected/default due month is available.
  const getDailyInvoiceMonthOptions = () => {
    const extraMonthIds: number[] = [];
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

  // Generate next 12 months for fixed expense target
  const getTargetMonthOptions = () => {
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
  };

  return (
    <>
      {/* Expense Input Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-700">
                {captureMode === "daily"
                  ? "Adicionar Gasto"
                  : "Novo Gasto Fixo"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="px-4 pt-3 shrink-0">
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setCaptureMode("daily")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    captureMode === "daily"
                      ? "bg-white text-teal-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Diário
                </button>
                <button
                  onClick={() => setCaptureMode("fixed")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    captureMode === "fixed"
                      ? "bg-white text-teal-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Fixo / Parcelado
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {captureMode === "daily" ? (
                <>
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
                      <p className="text-xs text-red-500 mt-1">
                        {dailyErrors.amount}
                      </p>
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
                        className={
                          isRefund ? "text-emerald-500" : "text-slate-400"
                        }
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

                  {/* Date Input — no max restriction */}
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
                      <p className="text-xs text-red-500 mt-1">
                        {dailyErrors.date}
                      </p>
                    )}
                  </div>

                  {/* Credit Card (optional) */}
                  {creditCards.length > 0 && (
                    <div>
                      <label className="text-sm text-slate-500 mb-2 block font-medium">
                        Cartão de crédito{" "}
                        <span className="text-slate-400 font-normal">
                          (opcional)
                        </span>
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
                              setSelectedDailyInvoiceMonthId(
                                getDefaultInvoiceMonthIdForCard(cardId),
                              );
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

                  {/* Invoice Month — required when a card is selected */}
                  {selectedDailyCardId && (
                    <div>
                      <label className="text-sm text-slate-500 mb-2 block font-medium">
                        Fatura
                      </label>
                      <select
                        value={selectedDailyInvoiceMonthId}
                        onChange={(e) =>
                          setSelectedDailyInvoiceMonthId(e.target.value)
                        }
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
                        <p className="text-xs text-red-500 mt-1">
                          {dailyErrors.card}
                        </p>
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
                      onClick={handleCloseModal}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDailySubmit}
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
                      ) : isRefund ? (
                        "Registrar Reembolso"
                      ) : (
                        "Adicionar"
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* Fixed / Installment Mode */
                <>
                  {/* Target Month */}
                  <div>
                    <label className="text-sm text-slate-500 mb-2 block font-medium">
                      Mês de início *
                    </label>
                    <select
                      value={fixedTargetMonth}
                      onChange={(e) => setFixedTargetMonth(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 capitalize"
                    >
                      {getTargetMonthOptions().map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Gastos fixos só podem ser criados a partir do próximo mês.
                    </p>
                  </div>

                  {/* Payment Type Toggle */}
                  <div>
                    <label className="text-sm text-slate-500 mb-2 block font-medium">
                      Tipo de pagamento
                    </label>
                    <div className="flex bg-slate-100 rounded-xl p-1">
                      <button
                        onClick={() => {
                          setFixedPaymentType("debit");
                          setSelectedCardId("");
                          setFixedExpense((prev) => ({
                            ...prev,
                            creditCardId: undefined,
                          }));
                        }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                          fixedPaymentType === "debit"
                            ? "bg-white text-teal-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Débito / PIX
                      </button>
                      <button
                        onClick={() => setFixedPaymentType("card")}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                          fixedPaymentType === "card"
                            ? "bg-white text-teal-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Cartão de Crédito
                      </button>
                    </div>
                  </div>

                  {/* Credit Card Select */}
                  {fixedPaymentType === "card" && (
                    <div>
                      <label className="text-sm text-slate-500 mb-2 block font-medium">
                        Cartão *
                      </label>
                      {creditCards.length === 0 ? (
                        <p className="text-sm text-slate-400 italic p-3 border border-dashed border-slate-200 rounded-xl text-center">
                          Nenhum cartão cadastrado. Adicione no wizard de
                          configuração.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {creditCards.map((card) => (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => {
                                setSelectedCardId(card.id ?? "");
                                setFixedExpense((prev) => ({
                                  ...prev,
                                  creditCardId: card.id ?? undefined,
                                }));
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                selectedCardId === card.id
                                  ? "text-white border-transparent"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                              }`}
                              style={
                                selectedCardId === card.id
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
                      )}
                      {fixedErrors.card && (
                        <p className="text-xs text-red-500 mt-1">
                          {fixedErrors.card}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reuse ExpenseItem from wizard */}
                  <div>
                    <label className="text-sm text-slate-500 mb-2 block font-medium">
                      Detalhes do gasto
                    </label>
                    {(fixedErrors.name ||
                      fixedErrors.amount ||
                      fixedErrors.installments) && (
                      <div className="mb-2 space-y-1">
                        {fixedErrors.name && (
                          <p className="text-xs text-red-500">
                            {fixedErrors.name}
                          </p>
                        )}
                        {fixedErrors.amount && (
                          <p className="text-xs text-red-500">
                            {fixedErrors.amount}
                          </p>
                        )}
                        {fixedErrors.installments && (
                          <p className="text-xs text-red-500">
                            {fixedErrors.installments}
                          </p>
                        )}
                      </div>
                    )}
                    <ExpenseItem
                      expense={fixedExpense}
                      updateExpense={updateFixedExpense}
                      removeExpense={removeFixedExpense}
                      isCardExpense={fixedPaymentType === "card"}
                      expenseDate={new Date(selectedDate)}
                    />
                  </div>

                  {/* Action Buttons */}
                  {fixedErrors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                      {fixedErrors.general}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleFixedSubmit}
                      disabled={!isFixedFormValid || isSubmitting}
                      className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Criar Gasto Fixo"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
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
