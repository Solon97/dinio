import { useMemo } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { ExpenseItem } from "@/components/app/dashboard/BudgetSetupWizard/shared/ExpenseItem";
import { CATEGORY_OPTIONS } from "@/constants/categories";
import { CreditCard, ExpenseType, FixedExpense } from "@/types/finance";
import { EntryMode, ExpenseEntry } from "./types";

interface ExpenseEntryCardProps {
  entry: ExpenseEntry;
  index: number;
  canRemove: boolean;
  isExpanded: boolean;
  creditCards: CreditCard[];
  minDate: string;
  onExpand: (id: string) => void;
  onModeChange: (id: string, mode: EntryMode) => void;
  onFieldChange: (
    id: string,
    mode: EntryMode,
    field: string,
    value: string | number | boolean | undefined,
  ) => void;
  onRemove: (id: string) => void;
  getDefaultInvoiceMonthIdForCard: (cardId: string) => string;
  getDailyInvoiceMonthOptions: (
    entry: ExpenseEntry,
  ) => { value: string; label: string }[];
  getTargetMonthOptions: () => { value: string; label: string }[];
}

export function ExpenseEntryCard({
  entry,
  index,
  canRemove,
  isExpanded,
  creditCards,
  minDate,
  onExpand,
  onModeChange,
  onFieldChange,
  onRemove,
  getDefaultInvoiceMonthIdForCard,
  getDailyInvoiceMonthOptions,
  getTargetMonthOptions,
}: ExpenseEntryCardProps) {
  const isSubmitting = entry.status === "submitting";
  const isSuccess = entry.status === "success";
  const isLocked = isSubmitting || isSuccess;

  const fixedExpenseForItem = useMemo<FixedExpense>(
    () => ({
      name: entry.fixed.name,
      amount: entry.fixed.amount,
      dueDay: entry.fixed.dueDay,
      type: entry.fixed.type,
      paid: entry.fixed.paid,
      isInstallment: entry.fixed.isInstallment,
      totalInstallments: entry.fixed.totalInstallments,
      startInstallment: entry.fixed.startInstallment,
      isRefundable: entry.fixed.isRefundable,
      creditCardId: entry.fixed.cardId || undefined,
    }),
    [entry.fixed],
  );

  return (
    <div
      className={`relative border rounded-2xl p-4 shadow-sm space-y-4 ${
        isSuccess
          ? "border-emerald-300 bg-emerald-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      {isSubmitting && (
        <div className="absolute inset-0 z-20 rounded-2xl bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
            <Loader2 size={16} className="animate-spin" />
            Enviando...
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-2 flex-1 cursor-pointer select-none"
          onClick={() => {
            if (!isExpanded) onExpand(entry.id);
          }}
        >
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            Gasto {index + 1}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {entry.mode === "daily" ? "Diário" : "Fixo / Parcelado"}
          </span>
          {!isExpanded && (
            <span className="text-sm font-bold text-slate-700 ml-2 truncate">
              R${" "}
              {(entry.mode === "daily"
                ? entry.daily.amount
                : entry.fixed.amount
              ).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
          {isSuccess && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={12} />
              Enviado
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (!isExpanded) onExpand(entry.id);
            }}
            disabled={isExpanded}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isExpanded ? "Gasto já expandido" : "Expandir gasto"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            disabled={!canRemove || isLocked}
            className={`p-2 rounded-lg transition-colors ${
              !canRemove || isLocked
                ? "opacity-50 cursor-not-allowed text-slate-400"
                : "text-slate-400 hover:text-rose-500 hover:bg-rose-50"
            }`}
            aria-label={`Remover gasto ${index + 1}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => onModeChange(entry.id, "daily")}
              disabled={isLocked}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                entry.mode === "daily"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Diário
            </button>
            <button
              type="button"
              onClick={() => onModeChange(entry.id, "fixed")}
              disabled={isLocked}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                entry.mode === "fixed"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Fixo / Parcelado
            </button>
          </div>

      {entry.mode === "daily" ? (
        <>
          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              Valor (R$) *
            </label>
            <MoneyInput
              value={entry.daily.amount}
              onChange={(value) =>
                onFieldChange(entry.id, "daily", "amount", value)
              }
              placeholder="0,00"
              showCurrencySymbol={false}
              className="text-2xl font-bold text-center"
              disabled={isLocked}
            />
            {entry.errors.amount && (
              <p className="text-xs text-red-500 mt-1">{entry.errors.amount}</p>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-teal-300 transition-colors">
            <input
              type="checkbox"
              checked={entry.daily.isRefund}
              onChange={(e) =>
                onFieldChange(entry.id, "daily", "isRefund", e.target.checked)
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
              disabled={isLocked}
            />
            <div className="flex items-center gap-2">
              <RefreshCw
                size={16}
                className={
                  entry.daily.isRefund ? "text-emerald-500" : "text-slate-400"
                }
              />
              <span
                className={`text-sm font-medium ${
                  entry.daily.isRefund ? "text-emerald-600" : "text-slate-600"
                }`}
              >
                É um reembolso ou estorno?
              </span>
            </div>
          </label>

          {entry.daily.isRefund && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
              Você vai receber de volta R${" "}
              {entry.daily.amount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          )}

          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              Descrição
            </label>
            <input
              type="text"
              value={entry.daily.description}
              onChange={(e) =>
                onFieldChange(entry.id, "daily", "description", e.target.value)
              }
              placeholder="Ex: Almoço no restaurante"
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={isLocked}
            />
            {entry.errors.description && (
              <p className="text-xs text-red-500 mt-1">{entry.errors.description}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              Categoria
            </label>
            <select
              value={entry.daily.category}
              onChange={(e) =>
                onFieldChange(entry.id, "daily", "category", e.target.value)
              }
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={isLocked}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              Data
            </label>
            <input
              type="date"
              value={entry.daily.date}
              onChange={(e) => onFieldChange(entry.id, "daily", "date", e.target.value)}
              min={minDate}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={isLocked}
            />
            {entry.errors.date && (
              <p className="text-xs text-red-500 mt-1">{entry.errors.date}</p>
            )}
          </div>

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
                    onFieldChange(entry.id, "daily", "cardId", "");
                    onFieldChange(entry.id, "daily", "invoiceMonthId", "");
                  }}
                  disabled={isLocked}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    entry.daily.cardId === ""
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
                      onFieldChange(entry.id, "daily", "cardId", cardId);
                      onFieldChange(
                        entry.id,
                        "daily",
                        "invoiceMonthId",
                        getDefaultInvoiceMonthIdForCard(cardId),
                      );
                    }}
                    disabled={isLocked}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      entry.daily.cardId === card.id
                        ? "text-white border-transparent"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                    style={
                      entry.daily.cardId === card.id
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

          {entry.daily.cardId && (
            <div>
              <label className="text-sm text-slate-500 mb-2 block font-medium">
                Fatura
              </label>
              <select
                value={entry.daily.invoiceMonthId}
                onChange={(e) =>
                  onFieldChange(entry.id, "daily", "invoiceMonthId", e.target.value)
                }
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 normal-case"
                disabled={isLocked}
              >
                <option value="">Selecione a fatura...</option>
                {getDailyInvoiceMonthOptions(entry).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Selecione o mês de vencimento da fatura.
              </p>
              {entry.errors.card && (
                <p className="text-xs text-red-500 mt-1">{entry.errors.card}</p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              Mês de início *
            </label>
            <select
              value={entry.fixed.targetMonth}
              onChange={(e) =>
                onFieldChange(entry.id, "fixed", "targetMonth", e.target.value)
              }
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 capitalize"
              disabled={isLocked}
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

          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              Tipo de pagamento
            </label>
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  onFieldChange(entry.id, "fixed", "paymentType", "debit");
                  onFieldChange(entry.id, "fixed", "cardId", "");
                }}
                disabled={isLocked}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  entry.fixed.paymentType === "debit"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Débito / PIX
              </button>
              <button
                type="button"
                onClick={() => onFieldChange(entry.id, "fixed", "paymentType", "card")}
                disabled={isLocked}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  entry.fixed.paymentType === "card"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Cartão de Crédito
              </button>
            </div>
          </div>

          {entry.fixed.paymentType === "card" && (
            <div>
              <label className="text-sm text-slate-500 mb-2 block font-medium">
                Cartão *
              </label>
              {creditCards.length === 0 ? (
                <p className="text-sm text-slate-400 italic p-3 border border-dashed border-slate-200 rounded-xl text-center">
                  Nenhum cartão cadastrado. Adicione no wizard de configuração.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {creditCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() =>
                        onFieldChange(entry.id, "fixed", "cardId", card.id ?? "")
                      }
                      disabled={isLocked}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        entry.fixed.cardId === card.id
                          ? "text-white border-transparent"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
                      style={
                        entry.fixed.cardId === card.id
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
              {entry.errors.card && (
                <p className="text-xs text-red-500 mt-1">{entry.errors.card}</p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              Detalhes do gasto
            </label>
            {(entry.errors.name || entry.errors.amount || entry.errors.installments) && (
              <div className="mb-2 space-y-1">
                {entry.errors.name && (
                  <p className="text-xs text-red-500">{entry.errors.name}</p>
                )}
                {entry.errors.amount && (
                  <p className="text-xs text-red-500">{entry.errors.amount}</p>
                )}
                {entry.errors.installments && (
                  <p className="text-xs text-red-500">{entry.errors.installments}</p>
                )}
              </div>
            )}
            <div className={isLocked ? "pointer-events-none opacity-70" : ""}>
              <ExpenseItem
                expense={fixedExpenseForItem}
                updateExpense={(_id, field, value) =>
                  onFieldChange(entry.id, "fixed", field, value)
                }
                removeExpense={() => {
                  onFieldChange(entry.id, "fixed", "name", "");
                  onFieldChange(entry.id, "fixed", "amount", 0);
                  onFieldChange(entry.id, "fixed", "dueDay", 1);
                  onFieldChange(
                    entry.id,
                    "fixed",
                    "type",
                    ExpenseType.DISCRETIONARY,
                  );
                  onFieldChange(entry.id, "fixed", "isInstallment", false);
                  onFieldChange(entry.id, "fixed", "totalInstallments", undefined);
                  onFieldChange(entry.id, "fixed", "startInstallment", undefined);
                  onFieldChange(entry.id, "fixed", "isRefundable", false);
                  onFieldChange(entry.id, "fixed", "paymentType", "debit");
                  onFieldChange(entry.id, "fixed", "cardId", "");
                }}
                isCardExpense={entry.fixed.paymentType === "card"}
                expenseDate={new Date(entry.daily.date || new Date())}
              />
            </div>
          </div>
        </>
      )}

      {entry.errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {entry.errors.general}
        </div>
      )}
        </div>
      )}
    </div>
  );
}
