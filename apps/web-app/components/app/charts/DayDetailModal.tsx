"use client";

import React, { useState } from "react";
import { ExpenseResponse } from "@/types/budget";
import {
  X,
  CreditCard,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  ReceiptText,
} from "lucide-react";
import { formatBRL } from "@/libs/currency";
import { useBudget } from "@/contexts/BudgetContext";

interface DayDetailModalProps {
  dayRecord: {
    day: number;
    limit: number;
    spent: number;
    transactions?: ExpenseResponse[];
  } | null;
  month: number;
  onClose: () => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Mercado: "🛒",
  Alimentação: "🍽️",
  Delivery: "🛵",
  Transporte: "🚗",
  Lazer: "🎮",
  Roupas: "👕",
  Família: "👪",
  Crianças: "🧸",
  Pets: "🐶",
  Saúde: "🩺",
  "Cuidados Pessoais": "💇",
  Presentes: "🎁",
  Imprevistos: "🚨",
  Outros: "📦",
};

const DayDetailModal: React.FC<DayDetailModalProps> = ({
  dayRecord,
  month,
  onClose,
}) => {
  const { deleteExpense } = useBudget();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!dayRecord) return null;

  const transactions = dayRecord.transactions || [];
  const isOverBudget = dayRecord.spent > dayRecord.limit;

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    await deleteExpense(id);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Detalhes do dia
            </p>
            <h2 className="text-2xl font-bold text-slate-800">
              Dia {dayRecord.day}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-8">
            <div className="flex-1 bg-teal-50 p-4 rounded-2xl border border-teal-100">
              <p className="text-xs text-teal-600 font-medium mb-1">
                Teto do Dia
              </p>
              <p className="text-xl font-bold text-teal-700">
                {formatBRL(dayRecord.limit)}
              </p>
            </div>
            <div
              className={`flex-1 p-4 rounded-2xl border ${
                isOverBudget
                  ? "bg-rose-50 border-rose-100"
                  : "bg-slate-50 border-slate-100"
              }`}
            >
              <p
                className={`text-xs font-medium mb-1 ${
                  isOverBudget ? "text-rose-400" : "text-slate-500"
                }`}
              >
                Gasto Real
              </p>
              <p
                className={`text-xl font-bold ${
                  isOverBudget ? "text-rose-600" : "text-slate-700"
                }`}
              >
                {formatBRL(dayRecord.spent)}
              </p>
            </div>
          </div>

          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-teal-500" />
            Transações
          </h3>

          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {transactions.length > 0 ? (
              transactions.map((tx) => {
                const isRefund = tx.amount < 0;
                const emoji =
                  CATEGORY_EMOJIS[tx.category] || CATEGORY_EMOJIS["Outros"];

                return (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${
                          isRefund ? "bg-emerald-50" : "bg-slate-50"
                        }`}
                      >
                        {emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          {tx.time && (
                            <>
                              <Clock size={10} /> {tx.time.slice(0, 5)}
                              <span>•</span>
                            </>
                          )}
                          <span>{tx.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-medium text-sm flex items-center gap-1 ${
                          isRefund ? "text-emerald-600" : "text-slate-700"
                        }`}
                      >
                        {isRefund ? (
                          <ArrowDownCircle
                            size={14}
                            className="text-emerald-500"
                          />
                        ) : (
                          <ArrowUpCircle size={14} className="text-rose-400" />
                        )}
                        {isRefund ? "+" : ""} {formatBRL(Math.abs(tx.amount))}
                      </span>

                      {confirmDeleteId === tx.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 bg-rose-500 text-white rounded text-[10px] font-bold hover:bg-rose-600"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 bg-slate-200 text-slate-600 rounded text-[10px] font-bold"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(tx.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <ReceiptText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  Nenhuma transação neste dia.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;
