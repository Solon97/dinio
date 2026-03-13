import { List, Plus, CreditCard as CreditCardIcon, Wallet } from "lucide-react";
import React, { useRef, useState } from "react";
import { useBudgetSetupWizard } from "../../Context";
import { ExpenseItem } from "../../shared/ExpenseItem";
import {
  getCardExpenses,
  getStandaloneExpenses,
  parseExpenseBulkText,
} from "../../shared/utils";

const BULK_STANDALONE = "__standalone__";

export function Step3() {
  const {
    creditCards,
    expenses,
    addFixedExpense,
    addFixedExpensesBulk,
    updateExpense,
    removeExpense,
    totalIncome,
    totalFixed,
  } = useBudgetSetupWizard();

  const standaloneExpenses = getStandaloneExpenses(expenses);
  const [bulkSectionId, setBulkSectionId] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      id="onboarding-wizard-step-3"
      className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300"
    >
      <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 mb-4">
        <h3 className="font-bold text-teal-800 text-lg mb-1">
          3. Gastos Fixos
        </h3>
        <p className="text-teal-600 text-sm">
          Organize suas contas recorrentes por cartão ou avulso. Nos cartões,
          inclua apenas os gastos da fatura que será paga neste mês, e em
          compras parceladas, registre o parcelamento começando pela parcela da
          fatura que será paga neste mês.
        </p>
      </div>

      {/* Groups per Credit Card */}
      {creditCards.map((card) => (
        <div key={card.id} className="space-y-4">
          <div
            className="flex items-center gap-3 border-b-2 pb-2"
            style={{ borderColor: card.color }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: card.color }}
            >
              <CreditCardIcon size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-700">
              {card.name || "Cartão sem nome"}
            </span>
            <span className="text-xs text-slate-400">
              Venc. dia {card.dueDay}
            </span>
          </div>

          <div className="space-y-3 pl-2">
            {getCardExpenses(expenses, card.id).length === 0 ? (
              <p className="text-slate-400 text-sm italic py-2">
                Nenhum gasto neste cartão.
              </p>
            ) : (
              getCardExpenses(expenses, card.id).map((expense) => (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  updateExpense={updateExpense}
                  removeExpense={removeExpense}
                  isCardExpense={true}
                />
              ))
            )}

            {bulkSectionId === card.id ? (
              <BulkImportArea
                textareaRef={textareaRef}
                bulkText={bulkText}
                onTextChange={setBulkText}
                onImport={() => handleImport(card.id)}
                onCancel={cancelBulk}
              />
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => addFixedExpense(card.id)}
                  className="flex-1 py-2.5 border border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2 text-sm min-h-[44px]"
                >
                  <Plus size={16} /> Adicionar no {card.name || "cartão"}
                </button>
                <button
                  onClick={() => openBulk(card.id ?? "")}
                  className="sm:w-auto py-2.5 px-3 border border-dashed border-teal-200 text-teal-600 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-all flex items-center justify-center gap-2 text-sm min-h-[44px]"
                >
                  <List size={16} /> Adicionar Vários
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Standalone (Avulso) Group */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-3 border-b-2 border-slate-300 pb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600 shrink-0">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-700">
            Débito / Boleto / PIX
          </span>
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
