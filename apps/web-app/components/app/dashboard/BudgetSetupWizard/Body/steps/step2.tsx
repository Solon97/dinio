import { MoneyInput } from "@/components/shared/MoneyInput";
import {
  List,
  Plus,
  Trash2,
  CreditCard as CreditCardIcon,
  Wallet,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useBudgetSetupWizard } from "../../Context";
import { ExpenseItem } from "../../shared/ExpenseItem";
import {
  CARD_COLORS,
  getCardExpenses,
  getStandaloneExpenses,
  parseExpenseBulkText,
} from "../../shared/utils";
import { getFallbackClosingDay } from "@/libs/creditCardInvoice";

const BULK_STANDALONE = "__standalone__";

export function Step2() {
  const {
    creditCards,
    addCreditCard,
    removeCreditCard,
    updateCreditCard,
    isFirstMonth,
    invoiceTotals,
    updateCardInvoiceTotal,
    expenses,
    addFixedExpense,
    addFixedExpensesBulk,
    updateExpense,
    removeExpense,
    totalIncome,
    totalFixed,
  } = useBudgetSetupWizard();

  const standaloneExpenses = getStandaloneExpenses(expenses);

  // Tracks which cards have the invoice balance toggle open
  const [openInvoiceIds, setOpenInvoiceIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    creditCards.forEach((card) => {
      const id = card.id ?? "";
      if (id && (invoiceTotals[id] ?? 0) > 0) ids.add(id);
    });
    return ids;
  });

  const [bulkSectionId, setBulkSectionId] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleInvoice = (id: string) => {
    setOpenInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        updateCardInvoiceTotal(id, 0);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openBulk = (sectionId: string) => {
    setBulkSectionId(sectionId);
    setBulkText("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const cancelBulk = () => {
    setBulkSectionId(null);
    setBulkText("");
  };

  const handleImport = (cardId?: string) => {
    const items = parseExpenseBulkText(bulkText);
    if (items.length > 0) {
      addFixedExpensesBulk(items, cardId);
    }
    cancelBulk();
  };

  return (
    <div
      id="onboarding-wizard-step-2"
      className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300"
    >
      <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 mb-4">
        <h3 className="font-bold text-teal-800 text-lg mb-1">
          2. Gastos Fixos e Cartões
        </h3>
        <p className="text-teal-600 text-sm">
          Configure seus cartões e adicione os gastos fixos de cada um. Para
          compras parceladas, registre o parcelamento começando pela parcela da
          fatura que será paga neste mês.
        </p>
      </div>

      {/* Standalone (Avulso) Group */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 border-b-2 border-slate-300 pb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600 shrink-0">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-700">Débito / Boleto / PIX</span>
          <span className="text-xs text-slate-400">Gastos avulsos</span>
        </div>

        <div className="space-y-3 pl-2">
          {standaloneExpenses.length === 0 ? (
            <p className="text-slate-400 text-sm italic py-2">
              Nenhum gasto avulso.
            </p>
          ) : (
            standaloneExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                updateExpense={updateExpense}
                removeExpense={removeExpense}
                isCardExpense={false}
              />
            ))
          )}

          {bulkSectionId === BULK_STANDALONE ? (
            <BulkImportArea
              textareaRef={textareaRef}
              bulkText={bulkText}
              onTextChange={setBulkText}
              onImport={() => handleImport(undefined)}
              onCancel={cancelBulk}
            />
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => addFixedExpense()}
                className="flex-1 py-2.5 border border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2 text-sm min-h-[44px]"
              >
                <Plus size={16} /> Adicionar gasto avulso
              </button>
              <button
                onClick={() => openBulk(BULK_STANDALONE)}
                className="sm:w-auto py-2.5 px-3 border border-dashed border-teal-200 text-teal-600 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-all flex items-center justify-center gap-2 text-sm min-h-[44px]"
              >
                <List size={16} /> Adicionar Vários
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Credit card sections — each card with its own expenses */}
      {creditCards.map((card) => {
        const cardId = card.id ?? "";
        const isInvoiceOpen = openInvoiceIds.has(cardId);
        const cardExpenses = getCardExpenses(expenses, cardId);

        return (
          <div
            key={cardId}
            className="rounded-xl border-2 bg-white shadow-sm overflow-hidden"
            style={{ borderColor: card.color }}
          >
            {/* Card config section */}
            <div className="p-4 space-y-3">
              {/* Card header row */}
              <div className="flex gap-2 items-center">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: card.color }}
                >
                  <CreditCardIcon size={20} className="text-white" />
                </div>
                <input
                  type="text"
                  placeholder="Nome do cartão"
                  value={card.name}
                  onChange={(e) =>
                    updateCreditCard(card.id, "name", e.target.value)
                  }
                  className={`flex-1 min-w-0 p-3 bg-slate-50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-teal-500 text-base font-medium ${!card.name.trim()
                      ? "border-rose-400 ring-1 ring-rose-200"
                      : "border-slate-200"
                    }`}
                />
                <button
                  onClick={() => removeCreditCard(card.id)}
                  className="text-slate-400 hover:text-rose-500 p-2 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Due day + closing day + color row */}
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 min-h-[44px]">
                  <span className="text-slate-400 text-xs">Vencimento</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={card.dueDay}
                    onChange={(e) =>
                      updateCreditCard(
                        card.id,
                        "dueDay",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="w-12 text-center bg-transparent focus:outline-none font-bold text-slate-700 text-base"
                  />
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 min-h-[44px]">
                  <span className="text-slate-400 text-xs">Fechamento</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={
                      card.closingDay ?? getFallbackClosingDay(card.dueDay)
                    }
                    onChange={(e) =>
                      updateCreditCard(
                        card.id,
                        "closingDay",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="w-12 text-center bg-transparent focus:outline-none font-bold text-slate-700 text-base"
                  />
                </div>

                <div className="flex items-center gap-2 min-h-[44px]">
                  <span className="text-slate-400 text-xs">Cor:</span>
                  <div className="flex gap-1.5">
                    {CARD_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          updateCreditCard(card.id, "color", color)
                        }
                        className={`w-8 h-8 rounded-full transition-transform ${card.color === color ? "scale-110 ring-2 ring-offset-1 ring-slate-400" : "hover:scale-105"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Invoice balance section — first month only */}
              {isFirstMonth && (
                <div className="border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => toggleInvoice(cardId)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${isInvoiceOpen ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                  >
                    <span>Já existe fatura a ser paga nesse mês ?</span>
                    <span className="text-xs opacity-70">
                      {isInvoiceOpen ? "▲ ocultar" : "▼ informar"}
                    </span>
                  </button>

                  {isInvoiceOpen && (
                    <div className="mt-3 space-y-2">
                      <label className="block">
                        <span className="text-xs font-medium text-slate-600 mb-1.5 block">
                          Informe o total da fatura deste mês
                        </span>
                        <MoneyInput
                          value={invoiceTotals[cardId] ?? 0}
                          onChange={(value) =>
                            updateCardInvoiceTotal(cardId, value)
                          }
                          placeholder="0,00"
                          className="pl-10 pr-4 py-3 bg-white rounded-xl border-2 border-amber-200 focus:border-transparent font-bold text-slate-700 text-base w-full"
                        />
                      </label>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        O sistema descontará o total dos gastos fixos, e criará
                        uma despesa com o valor restante.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card expenses section */}
            <div
              className="border-t-2 px-4 pb-4 pt-3 space-y-3"
              style={{ borderColor: card.color + "40" }}
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Gastos neste cartão
              </p>

              {cardExpenses.length === 0 ? (
                <p className="text-slate-400 text-sm italic py-1">
                  Nenhum gasto neste cartão.
                </p>
              ) : (
                cardExpenses.map((expense) => (
                  <ExpenseItem
                    key={expense.id}
                    expense={expense}
                    updateExpense={updateExpense}
                    removeExpense={removeExpense}
                    isCardExpense={true}
                  />
                ))
              )}

              {bulkSectionId === cardId ? (
                <BulkImportArea
                  textareaRef={textareaRef}
                  bulkText={bulkText}
                  onTextChange={setBulkText}
                  onImport={() => handleImport(cardId)}
                  onCancel={cancelBulk}
                />
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => addFixedExpense(cardId)}
                    className="flex-1 py-2.5 border border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2 text-sm min-h-[44px]"
                  >
                    <Plus size={16} /> Adicionar no {card.name || "cartão"}
                  </button>
                  <button
                    onClick={() => openBulk(cardId)}
                    className="sm:w-auto py-2.5 px-3 border border-dashed border-teal-200 text-teal-600 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-all flex items-center justify-center gap-2 text-sm min-h-[44px]"
                  >
                    <List size={16} /> Adicionar Vários
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add card button */}
      <button
        onClick={addCreditCard}
        className="w-full py-3.5 border-2 border-dashed border-teal-200 text-teal-600 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all flex items-center justify-center gap-2 font-medium bg-white min-h-[52px] text-base"
      >
        <Plus size={20} /> Adicionar Cartão
      </button>

      {/* Summary bar */}
      <div className="flex justify-between items-center pt-8 border-t border-slate-200 mt-10">
        <div className="text-left">
          <p className="text-slate-400 text-xs uppercase font-bold">Renda</p>
          <p className="text-base md:text-lg font-bold text-slate-600">
            R$ {totalIncome.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs uppercase font-bold">
            Total Fixos
          </p>
          <p className="text-xl md:text-2xl font-bold text-rose-500">
            R${" "}
            {totalFixed.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

interface BulkImportAreaProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  bulkText: string;
  onTextChange: (text: string) => void;
  onImport: () => void;
  onCancel: () => void;
}

function BulkImportArea({
  textareaRef,
  bulkText,
  onTextChange,
  onImport,
  onCancel,
}: BulkImportAreaProps) {
  return (
    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-3">
      <div className="text-xs font-medium text-teal-800 space-y-1">
        <p>
          Formato (separado por{" "}
          <span className="font-mono bg-white px-1 rounded font-bold">;</span>):{" "}
          <span className="font-mono bg-white px-1 rounded">Nome; Valor</span>
        </p>
        <p>
          Para <b>parcelas</b>:{" "}
          <span className="font-mono bg-white px-1 rounded">
            Nome; Valor; Parcela/Total; [T ou P]
          </span>
        </p>
        <p className="text-[10px] text-teal-600 italic">
          (T = Valor Total [padrão], P = Valor da Parcela)
        </p>
      </div>
      <textarea
        ref={textareaRef}
        value={bulkText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={
          "Aluguel; 400\nEnergia; 100\nTV; 2400; 12; T (Parcela = 200) \nCelular; 100; 3/12; P (Parcela = 100)"
        }
        rows={5}
        className="w-full text-sm rounded-lg border border-teal-200 bg-white px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none font-mono placeholder:text-slate-400/70 leading-relaxed"
        style={{ fontSize: "16px" }}
      />
      <div className="flex gap-2">
        <button
          onClick={onImport}
          disabled={!bulkText.trim()}
          className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
        >
          Importar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
