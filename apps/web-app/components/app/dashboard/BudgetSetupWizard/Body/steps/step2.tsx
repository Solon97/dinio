import { MoneyInput } from "@/components/shared/MoneyInput";
import { Plus, Trash2, CreditCard as CreditCardIcon } from "lucide-react";
import { useState } from "react";
import { useBudgetSetupWizard } from "../../Context";
import { CARD_COLORS } from "../../shared/utils";
import { getFallbackClosingDay } from "@/libs/creditCardInvoice";

export function Step2() {
  const {
    creditCards,
    addCreditCard,
    removeCreditCard,
    updateCreditCard,
    isFirstMonth,
    invoiceTotals,
    updateCardInvoiceTotal,
  } = useBudgetSetupWizard();

  // Tracks which cards have the invoice balance toggle open
  // Initialize with cards that already have a saved opening balance
  const [openInvoiceIds, setOpenInvoiceIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    creditCards.forEach((card) => {
      const id = card.id ?? "";
      if (id && (invoiceTotals[id] ?? 0) > 0) ids.add(id);
    });
    return ids;
  });

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

  return (
    <div
      id="onboarding-wizard-step-2"
      className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300"
    >
      <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 mb-4">
        <h3 className="font-bold text-teal-800 text-lg mb-1">
          2. Cartões de Crédito
        </h3>
        <p className="text-teal-600 text-sm">
          Cadastre seus cartões para organizar as faturas.
        </p>
      </div>

      <div className="space-y-4">
        {creditCards.map((card) => {
          const cardId = card.id ?? "";
          const isInvoiceOpen = openInvoiceIds.has(cardId);
          return (
            <div
              key={cardId}
              className="p-4 rounded-xl border-2 bg-white shadow-sm space-y-3"
              style={{ borderColor: card.color }}
            >
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
                  className={`flex-1 min-w-0 p-3 bg-slate-50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-teal-500 text-base font-medium ${
                    !card.name.trim()
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
                    <span>Total da fatura a pagar neste mês</span>
                    <span className="text-xs opacity-70">
                      {isInvoiceOpen ? "▲ ocultar" : "▼ informar"}
                    </span>
                  </button>

                  {isInvoiceOpen && (
                    <div className="mt-3 space-y-2">
                      <label className="block">
                        <span className="text-xs font-medium text-slate-600 mb-1.5 block">
                          Total da fatura deste mês
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
                        Informe o total da fatura deste mês (O sistema
                        descontará o total dos gastos fixos, e criará uma
                        despesa com o valor restante).
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={addCreditCard}
        className="w-full py-3.5 border-2 border-dashed border-teal-200 text-teal-600 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all flex items-center justify-center gap-2 font-medium bg-white min-h-[52px] text-base"
      >
        <Plus size={20} /> Adicionar Cartão
      </button>

      {creditCards.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-4">
          Você pode pular esta etapa se não usa cartão de crédito.
        </p>
      )}
    </div>
  );
}
