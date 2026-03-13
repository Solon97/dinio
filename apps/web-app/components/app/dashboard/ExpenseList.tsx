"use client";

import { useBudget } from "@/contexts/BudgetContext";
import { formatBRL } from "@/libs/currency";
import { ExpenseResponse, PaginatedExpensesResponse } from "@/types/budget";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard as CardIcon,
  Loader2,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCategoryEmoji } from "@/constants/categories";
import EditExpenseModal from "./EditExpenseModal";
import { Pencil } from "lucide-react";

interface ExpenseListProps {
  month: number;
  year: number;
}

interface GroupedExpenses {
  date: string;
  label: string;
  expenses: ExpenseResponse[];
  total: number;
}

function groupByDate(expenses: ExpenseResponse[]): GroupedExpenses[] {
  const groups: Map<string, ExpenseResponse[]> = new Map();

  expenses.forEach((expense) => {
    const dateKey = expense.date;
    const existing = groups.get(dateKey) || [];
    existing.push(expense);
    groups.set(dateKey, existing);
  });

  return Array.from(groups.entries()).map(([date, items]) => {
    const dateObj = new Date(date + "T12:00:00");
    const label = dateObj.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const total = items.reduce((sum, e) => sum + e.amount, 0);

    return { date, label, expenses: items, total };
  });
}

function formatTime(time?: string): string {
  if (!time) return "";
  return time.slice(0, 5);
}

export default function ExpenseList({ month, year }: ExpenseListProps) {
  const { fetchExpenses, deleteExpense, currentConfig } = useBudget();

  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(
    null,
  );

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadExpenses = useCallback(
    async (cursor?: string) => {
      const isInitial = !cursor;
      if (isInitial) {
        setIsLoadingInitial(true);
      } else {
        setIsLoadingMore(true);
      }

      const result: PaginatedExpensesResponse | null = await fetchExpenses(
        month,
        year,
        cursor,
        20,
      );

      if (result) {
        if (isInitial) {
          setExpenses(result.expenses);
        } else {
          setExpenses((prev) => [...prev, ...result.expenses]);
        }
        setNextCursor(result.nextCursor);
        setHasMore(result.hasMore);
      }

      if (isInitial) {
        setIsLoadingInitial(false);
      } else {
        setIsLoadingMore(false);
      }
    },
    [fetchExpenses, month, year],
  );

  // Initial load and reload when currentConfig changes (after add/delete)
  useEffect(() => {
    setExpenses([]);
    setNextCursor(null);
    setHasMore(false);
    loadExpenses();
  }, [loadExpenses, currentConfig]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!hasMore || isLoadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          nextCursor &&
          !isLoadingMore
        ) {
          loadExpenses(nextCursor);
        }
      },
      { threshold: 0.1 },
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoadingMore, nextCursor, loadExpenses]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const success = await deleteExpense(id);
    if (success) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  if (isLoadingInitial) {
    return <ExpenseListSkeleton />;
  }

  if (expenses.length === 0) {
    return (
      <div className="h-full bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm flex flex-col items-center justify-center">
        <ReceiptText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">
          Nenhum gasto registrado neste mês.
        </p>
        <p className="text-slate-400 text-sm mt-1">
          Use o botão + para adicionar um gasto.
        </p>
      </div>
    );
  }

  const grouped = groupByDate(expenses);

  return (
    <div className="h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-teal-500" />
          Gastos Diários
        </h3>
      </div>

      <div className="divide-y divide-slate-50 flex-1 min-h-0 overflow-y-auto">
        {grouped.map((group) => (
          <div key={group.date}>
            {/* Date header */}
            <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm px-4 py-2 flex justify-between items-center z-10">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {group.label}
              </span>
              <span
                className={`text-xs font-bold ${group.total < 0 ? "text-emerald-600" : "text-slate-600"}`}
              >
                {formatBRL(Math.abs(group.total))}
              </span>
            </div>

            {/* Expenses */}
            {group.expenses.map((expense) => {
              const isRefund = expense.amount < 0;
              const emoji = getCategoryEmoji(expense.category);

              return (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors group"
                >
                  {/* Category icon */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      isRefund ? "bg-emerald-50" : "bg-slate-50"
                    }`}
                  >
                    {emoji}
                  </div>

                  {/* Description + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {expense.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>{expense.category}</span>
                      {expense.time && (
                        <>
                          <span>•</span>
                          <span>{formatTime(expense.time)}</span>
                        </>
                      )}
                      {expense.creditCard && (
                        <div
                          className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100"
                          style={{ color: expense.creditCard.color }}
                        >
                          <CardIcon size={10} />
                          <span className="font-semibold">
                            {expense.creditCard.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-sm font-bold flex items-center gap-1 ${
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
                        {formatBRL(Math.abs(expense.amount))}
                      </span>
                    </div>

                    {/* Edit button */}
                    {!confirmDeleteId && (
                      <button
                        onClick={() => setEditingExpense(expense)}
                        className="p-1.5 text-slate-300 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-teal-50"
                      >
                        <Pencil size={16} />
                      </button>
                    )}

                    {/* Delete button */}
                    {confirmDeleteId === expense.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          className="p-1.5 bg-rose-500 text-white rounded-lg text-[10px] font-bold hover:bg-rose-600 disabled:opacity-50"
                        >
                          {deletingId === expense.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Sim"
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-300"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(expense.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />

        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
          </div>
        )}
      </div>

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </div>
  );
}

function ExpenseListSkeleton() {
  return (
    <div className="h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <div className="h-5 w-36 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-slate-50 flex-1 min-h-0 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
