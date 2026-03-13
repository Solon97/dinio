"use client";

import apiClient from "@/libs/api";
import {
  calculateTTL,
  getBudgetCacheKey,
  getCache,
  getYearlyCacheKey,
  invalidateMonthCache,
  invalidateYearCache,
  setCache,
} from "@/libs/cache";
import {
  BudgetConfigPayload,
  BudgetConfigResponse,
  CreateExpensePayload,
  UpdateExpensePayload,
  CreateFixedExpensePayload,
  ExpenseResponse,
  PaginatedExpensesResponse,
  YearlySummaryResponse,
} from "@/types/budget";
import { CreditCard } from "@/types/finance";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useUser } from "./UserContext";

interface BudgetContextValue {
  // Current month's config
  currentConfig: BudgetConfigResponse | null;
  isLoading: boolean;
  error: string | null;

  // Yearly data
  yearlyData: YearlySummaryResponse | null;

  // Actions
  fetchBudget: (
    month: number,
    year: number,
  ) => Promise<BudgetConfigResponse | null>;
  saveBudget: (
    payload: BudgetConfigPayload,
  ) => Promise<BudgetConfigResponse | null>;
  fetchYearlySummary: (year: number) => Promise<YearlySummaryResponse | null>;
  addExpense: (
    expense: CreateExpensePayload,
  ) => Promise<ExpenseResponse | null>;
  editExpense: (
    id: string,
    expense: UpdateExpensePayload,
  ) => Promise<ExpenseResponse | null>;
  deleteExpense: (id: string) => Promise<boolean>;
  fetchExpenses: (
    month: number,
    year: number,
    cursor?: string,
    limit?: number,
  ) => Promise<PaginatedExpensesResponse | null>;
  createFixedExpense: (payload: CreateFixedExpensePayload) => Promise<boolean>;
  fetchCreditCards: () => Promise<CreditCard[]>;
  markInvoiceAsPaid: (id: string, isPaid: boolean) => Promise<void>;
  markFixedExpensePaid: (id: string, isPaid: boolean) => Promise<void>;
  markFixedExpenseRefundPaid: (id: string) => Promise<void>;

  // Helper to check if month is configured
  isMonthConfigured: (month: number, year: number) => boolean;

  // Derived values for current config
  summary: {
    totalIncome: number;
    fixed: { amount: number; percent: number };
    daily: { amount: number; percent: number };
    reserve: { amount: number; percent: number };
  } | null;
}

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

interface BudgetProviderProps {
  children: ReactNode;
}

export function BudgetProvider({ children }: BudgetProviderProps) {
  const { user } = useUser();
  const [currentConfig, setCurrentConfig] =
    useState<BudgetConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Yearly state
  const [yearlyData, setYearlyData] = useState<YearlySummaryResponse | null>(
    null,
  );

  const fetchBudget = useCallback(
    async (
      month: number,
      year: number,
      disableLoading = false,
    ): Promise<BudgetConfigResponse | null> => {
      if (!user?.id) return null;

      // Check cache first
      const cacheKey = getBudgetCacheKey(user.id, month, year);
      const cached = getCache<BudgetConfigResponse>(cacheKey);

      if (cached) {
        setCurrentConfig(cached);
        setIsLoading(false);
        return cached;
      }

      if (!disableLoading) setIsLoading(true);
      setError(null);

      try {
        const data: BudgetConfigResponse = await apiClient.get(
          `/budget?month=${month}&year=${year}`,
        );

        // Cache the response with appropriate TTL
        const ttl = calculateTTL(month, year);
        setCache(cacheKey, data, ttl);

        setCurrentConfig(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id],
  );

  const saveBudget = useCallback(
    async (
      payload: BudgetConfigPayload,
    ): Promise<BudgetConfigResponse | null> => {
      if (!user?.id) return null;

      setIsLoading(true);
      setError(null);

      try {
        // Use PUT for existing configs, POST for new ones
        const isEditing = currentConfig?.isConfigured ?? false;
        const { data: responseData } = isEditing
          ? await apiClient.put<BudgetConfigResponse>("/budget", payload)
          : await apiClient.post<BudgetConfigResponse>("/budget", payload);

        // Invalidate cache for this month and year
        invalidateMonthCache(user.id, payload.month, payload.year);
        invalidateYearCache(user.id, payload.year);

        if (!isEditing) {
          const fullConfig = await fetchBudget(
            payload.month,
            payload.year,
            true,
          );
          if (fullConfig) {
            setCurrentConfig(fullConfig);
            return fullConfig;
          }
          return null;
        }

        setCurrentConfig(responseData);
        return responseData;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [currentConfig, fetchBudget, user?.id],
  );

  const fetchYearlySummary = useCallback(
    async (
      year: number,
      disableLoading = false,
    ): Promise<YearlySummaryResponse | null> => {
      if (!user?.id) return null;

      // Check cache first
      const cacheKey = getYearlyCacheKey(user.id, year);
      const cached = getCache<YearlySummaryResponse>(cacheKey);

      if (cached) {
        setYearlyData(cached);
        setIsLoading(false);
        return cached;
      }

      if (!disableLoading) setIsLoading(true);
      setError(null);

      try {
        const data: YearlySummaryResponse = await apiClient.get(
          `/budget/year?year=${year}`,
        );

        // Cache the response with appropriate TTL
        const ttl = calculateTTL(undefined, year);
        setCache(cacheKey, data, ttl);

        setYearlyData(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id],
  );

  const isMonthConfigured = useCallback((): boolean => {
    return currentConfig?.isConfigured ?? false;
  }, [currentConfig]);

  const addExpense = useCallback(
    async (expense: CreateExpensePayload): Promise<ExpenseResponse | null> => {
      if (!user?.id || !currentConfig) return null;

      setError(null);

      try {
        const data: ExpenseResponse = await apiClient.post(
          "/expenses",
          expense,
        );

        // Extract month and year from expense date
        const expenseDate = new Date(expense.date);
        const expenseMonth = expenseDate.getMonth();
        const expenseYear = expenseDate.getFullYear();

        // Invalidate cache for the expense's month and year
        invalidateMonthCache(user.id, expenseMonth, expenseYear);
        invalidateYearCache(user.id, expenseYear);

        // Refetch data without showing loading state
        await fetchBudget(expenseMonth, expenseYear, true);
        await fetchYearlySummary(expenseYear, true);

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [currentConfig, fetchBudget, fetchYearlySummary, user?.id],
  );

  const editExpense = useCallback(
    async (
      id: string,
      expense: UpdateExpensePayload,
    ): Promise<ExpenseResponse | null> => {
      if (!user?.id || !currentConfig) return null;

      setError(null);

      try {
        const data: ExpenseResponse = await apiClient.patch(
          `/expenses/${id}`,
          expense,
        );

        const expenseDate = new Date(data.date);
        const expenseMonth = expenseDate.getMonth();
        const expenseYear = expenseDate.getFullYear();

        // Need to invalidate cache for new month/year, but also what if they changed the date's month?
        // To be safe, we also invalidate the current view's cache
        invalidateMonthCache(user.id, expenseMonth, expenseYear);
        invalidateYearCache(user.id, expenseYear);

        if (
          currentConfig.month !== expenseMonth ||
          currentConfig.year !== expenseYear
        ) {
          invalidateMonthCache(
            user.id,
            currentConfig.month,
            currentConfig.year,
          );
        }

        // Refetch data without showing loading state
        await fetchBudget(currentConfig.month, currentConfig.year, true);
        if (expenseYear !== currentConfig.year) {
          await fetchYearlySummary(currentConfig.year, true);
        }
        await fetchYearlySummary(expenseYear, true);

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [currentConfig, fetchBudget, fetchYearlySummary, user?.id],
  );

  const deleteExpense = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.id || !currentConfig) return false;

      setError(null);

      // Find the expense to extract date info
      let expenseToDelete: ExpenseResponse | undefined;
      for (const record of currentConfig.dailyHistory) {
        expenseToDelete = record.transactions?.find((t) => t.id === id);
        if (expenseToDelete) break;
      }

      if (!expenseToDelete) {
        // Expense not found in current data
        return false;
      }

      try {
        await apiClient.delete(`/expenses/${id}`);

        // Extract month and year from deleted expense
        const expenseDate = new Date(expenseToDelete.date);
        const expenseMonth = expenseDate.getMonth();
        const expenseYear = expenseDate.getFullYear();

        // Invalidate cache
        invalidateMonthCache(user.id, expenseMonth, expenseYear);
        invalidateYearCache(user.id, expenseYear);

        // Refetch data without showing loading state
        await fetchBudget(expenseMonth, expenseYear, true);
        await fetchYearlySummary(expenseYear, true);

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return false;
      }
    },
    [currentConfig, fetchBudget, fetchYearlySummary, user?.id],
  );

  const fetchExpenses = useCallback(
    async (
      month: number,
      year: number,
      cursor?: string,
      limit?: number,
    ): Promise<PaginatedExpensesResponse | null> => {
      if (!user?.id) return null;

      try {
        let url = `/expenses?month=${month}&year=${year}&limit=${limit || 20}`;
        if (cursor) {
          url += `&cursor=${cursor}`;
        }

        const data: PaginatedExpensesResponse = await apiClient.get(url);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      }
    },
    [user?.id],
  );

  const createFixedExpense = useCallback(
    async (payload: CreateFixedExpensePayload): Promise<boolean> => {
      if (!user?.id) return false;

      setError(null);

      try {
        await apiClient.post("/fixed-expenses", payload);

        // Extract target month and year from monthId (YYYYMM format)
        const expenseYear = Math.floor(payload.targetMonthId / 100);
        const targetMonth = payload.targetMonthId % 100; // Get MM from YYYYMM

        // Invalidate cache for the target month and year
        invalidateMonthCache(user.id, targetMonth - 1, expenseYear);
        invalidateYearCache(user.id, expenseYear);

        // Refetch yearly data without showing loading state
        await fetchYearlySummary(expenseYear, true);

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [fetchYearlySummary, user?.id],
  );

  const fetchCreditCards = useCallback(async (): Promise<CreditCard[]> => {
    if (!user?.id) return [];

    try {
      const data: { creditCards: CreditCard[] } =
        await apiClient.get("/user/credit-cards");
      return data.creditCards || [];
    } catch {
      return [];
    }
  }, [user?.id]);

  const markInvoiceAsPaid = useCallback(
    async (id: string, isPaid: boolean): Promise<void> => {
      if (!user?.id) return;
      setCurrentConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          payments: prev.payments.map((item) =>
            item.kind === "invoice" && item.data.id === id
              ? { ...item, data: { ...item.data, isPaid } }
              : item,
          ),
        };
      });
      try {
        await apiClient.patch(`/credit-card-invoices/${id}`, { isPaid });
      } catch {
        setCurrentConfig((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            payments: prev.payments.map((item) =>
              item.kind === "invoice" && item.data.id === id
                ? { ...item, data: { ...item.data, isPaid: !isPaid } }
                : item,
            ),
          };
        });
      }
    },
    [user?.id],
  );

  const markFixedExpensePaid = useCallback(
    async (id: string, isPaid: boolean): Promise<void> => {
      if (!user?.id || !currentConfig) return;
      setCurrentConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          expenses: prev.expenses.map((e) =>
            e.id === id ? { ...e, paid: isPaid } : e,
          ),
          payments: prev.payments.map((item) =>
            item.kind === "fixed" && item.data.id === id
              ? { ...item, data: { ...item.data, paid: isPaid } }
              : item,
          ),
        };
      });
      try {
        await apiClient.patch(`/fixed-expenses/${id}`, { isPaid });
      } catch {
        setCurrentConfig((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            expenses: prev.expenses.map((e) =>
              e.id === id ? { ...e, paid: !isPaid } : e,
            ),
            payments: prev.payments.map((item) =>
              item.kind === "fixed" && item.data.id === id
                ? { ...item, data: { ...item.data, paid: !isPaid } }
                : item,
            ),
          };
        });
      }
    },
    [currentConfig, user?.id],
  );

  const markFixedExpenseRefundPaid = useCallback(
    async (id: string): Promise<void> => {
      if (!user?.id || !currentConfig) return;

      // Optimistically remove the refund item from the payments list
      setCurrentConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          payments: prev.payments.filter(
            (item) => !(item.kind === "refund" && item.data.id === id),
          ),
          expenses: prev.expenses.map((e) =>
            e.id === id ? { ...e, refundIncomeId: "__optimistic__" } : e,
          ),
        };
      });

      try {
        await apiClient.post(`/fixed-expenses/${id}/refund`, {});

        // Refetch silently so income totals are updated
        const { month, year } = currentConfig;
        invalidateMonthCache(user.id, month, year);
        invalidateYearCache(user.id, year);
        await fetchBudget(month, year, true);
        await fetchYearlySummary(year, true);
      } catch {
        // Revert optimistic update
        setCurrentConfig((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            expenses: prev.expenses.map((e) =>
              e.id === id ? { ...e, refundIncomeId: null } : e,
            ),
            payments: [
              ...prev.payments,
              ...prev.expenses
                .filter((e) => e.id === id && e.isRefundable && e.paid)
                .map((e) => ({ kind: "refund" as const, data: e })),
            ],
          };
        });
      }
    },
    [currentConfig, fetchBudget, fetchYearlySummary, user?.id],
  );

  const summary = useMemo(() => {
    if (!currentConfig || !currentConfig.isConfigured) return null;

    return {
      totalIncome: currentConfig.totalIncome,
      fixed: {
        amount: currentConfig.totalFixed,
        percent: currentConfig.fixedPercent,
      },
      daily: {
        amount: currentConfig.dailyBudget,
        percent: currentConfig.dailyPercent,
      },
      reserve: {
        amount: currentConfig.reserveAmount,
        percent: currentConfig.reservePercent,
      },
    };
  }, [currentConfig]);

  const value: BudgetContextValue = {
    currentConfig,
    isLoading,
    error,
    yearlyData,
    fetchBudget,
    saveBudget,
    fetchYearlySummary,
    addExpense,
    editExpense,
    deleteExpense,
    fetchExpenses,
    createFixedExpense,
    fetchCreditCards,
    markInvoiceAsPaid,
    markFixedExpensePaid,
    markFixedExpenseRefundPaid,
    isMonthConfigured,
    summary,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);

  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }

  return context;
}
