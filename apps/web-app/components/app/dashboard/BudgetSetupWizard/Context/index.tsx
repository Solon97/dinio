"use client";

import { calculateTotalFixedExpenses } from "@/libs/calculateTotalFixed";
import { PartialMonthInfo, WizardInitialData } from "@/types/budget";
import {
  BudgetConfig,
  CreditCard,
  ExpenseType,
  FixedExpense,
  IncomeSource,
} from "@/types/finance";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { CARD_COLORS, TOTAL_STEPS } from "../shared/utils";
import { getFallbackClosingDay } from "@/libs/creditCardInvoice";

interface AllocationState {
  fixedPercent: number;
  dailyPercent: number;
  reservePercent: number;
}

const generateUniqueId = () => {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

interface BudgetSetupWizardContextValue {
  // Wizard metadata
  monthName: string;
  month: number;
  year: number;
  isEditing: boolean;
  isFirstMonth: boolean;
  isPartialMonth: boolean;
  partialMonthInfo: PartialMonthInfo;

  // External callbacks
  onSave: (_config: BudgetConfig) => void;
  onCancel: () => void;

  // Navigation
  step: number;
  setStep: (step: number) => void;

  // State
  incomes: IncomeSource[];
  creditCards: CreditCard[];
  expenses: FixedExpense[];
  allocation: AllocationState;
  dailyProportionOfAvailable: number;
  targetRemaining: number | null;
  expenseToDelete: FixedExpense | null;
  /** Maps cardId → total invoice amount entered by user (first-month onboarding) */
  invoiceTotals: Record<string, number>;

  // Computed values
  totalIncome: number;
  totalFixed: number;
  availableCents: number;

  // Income handlers
  addIncome: () => void;
  removeIncome: (id?: string) => void;
  updateIncome: (
    id: string | undefined,
    field: keyof IncomeSource,
    value: string | number,
  ) => void;

  // Credit card handlers
  addCreditCard: () => void;
  removeCreditCard: (id?: string) => void;
  updateCreditCard: (
    id: string | undefined,
    field: keyof CreditCard,
    value: string | number,
  ) => void;
  updateCardInvoiceTotal: (cardId: string, amount: number) => void;

  // Expense handlers
  addFixedExpense: (creditCardId?: string) => void;
  addFixedExpensesBulk: (
    items: {
      name: string;
      amount: number;
      isInstallment?: boolean;
      totalInstallments?: number;
      startInstallment?: number;
    }[],
    creditCardId?: string,
  ) => void;
  removeExpense: (id?: string) => void;
  updateExpense: (
    id: string | undefined,
    field: keyof FixedExpense,
    value: string | number | boolean | undefined,
  ) => void;
  setExpenseToDelete: (expense: FixedExpense | null) => void;
  handleDeleteCurrentInstallment: () => void;
  handleDeleteAllFutureInstallments: () => void;

  // Allocation handlers
  handleAllocationChange: (proportion: number) => void;
  setTargetRemaining: (value: number | null) => void;
}

const BudgetSetupWizardContext = createContext<
  BudgetSetupWizardContextValue | undefined
>(undefined);

interface BudgetSetupWizardProviderProps {
  children: ReactNode;
  monthName: string;
  month: number;
  year: number;
  initialData: WizardInitialData;
  isEditing?: boolean;
  isFirstMonth?: boolean;
  isPartialMonth: boolean;
  partialMonthInfo: PartialMonthInfo;
  onSave: (_config: BudgetConfig) => void;
  onCancel: () => void;
}

export function BudgetSetupWizardProvider({
  children,
  monthName,
  month,
  year,
  initialData,
  isEditing = false,
  isFirstMonth = false,
  isPartialMonth,
  partialMonthInfo,
  onSave,
  onCancel,
}: BudgetSetupWizardProviderProps) {
  const [step, setStep] = useState(1);
  const [expenseToDelete, setExpenseToDelete] = useState<FixedExpense | null>(
    null,
  );
  const [invoiceTotals, setInvoiceTotals] = useState<Record<string, number>>(
    initialData.invoiceOpeningBalances ?? {},
  );
  // STEP 1: Income - Initialize from backend data
  const [incomes, setIncomes] = useState<IncomeSource[]>(
    initialData.incomes.length > 0
      ? [...initialData.incomes]
      : [{ id: "1", name: "Salário", amount: 0 }],
  );

  // STEP 2: Credit Cards - Initialize from backend data
  const [creditCards, setCreditCards] = useState<CreditCard[]>(
    initialData.creditCards || [],
  );

  // STEP 3: Expenses - Initialize from backend data
  const [expenses, setExpenses] = useState<FixedExpense[]>(
    initialData.expenses.length > 0 ? [...initialData.expenses] : [],
  );

  // STEP 4: Allocation - Initialize from backend data
  const [allocation, setAllocation] = useState<AllocationState>({
    fixedPercent: initialData.allocation.fixedPercent,
    dailyPercent: initialData.allocation.dailyPercent,
    reservePercent: initialData.allocation.reservePercent,
  });
  const [dailyProportionOfAvailable, setDailyProportionOfAvailable] =
    useState(50);
  const [targetRemaining, setTargetRemaining] = useState<number | null>(null);

  // Calculate totals in cents
  const totalIncomeCents = Math.round(
    incomes.reduce((acc, curr) => acc + curr.amount * 100, 0),
  );
  const totalFixedCents = calculateTotalFixedExpenses(expenses);
  // Convert to reais for display
  const totalIncome = totalIncomeCents / 100;
  const totalFixed = totalFixedCents / 100;

  // Available amount in cents
  const availableCents = Math.max(0, totalIncomeCents - totalFixedCents);

  // Update allocations when entering allocation step
  useEffect(() => {
    if (step === TOTAL_STEPS) {
      const fixedPct = totalIncome > 0 ? (totalFixed / totalIncome) * 100 : 0;

      // Check if we have initial allocation from backend
      const hasInitialAllocation =
        initialData.allocation.dailyPercent > 0 ||
        initialData.allocation.reservePercent > 0;

      if (hasInitialAllocation && availableCents > 0) {
        // Use allocation from backend
        const dailyCents = Math.round(
          totalIncomeCents * (initialData.allocation.dailyPercent / 100),
        );
        const reserveCents = Math.round(
          totalIncomeCents * (initialData.allocation.reservePercent / 100),
        );

        const proportion =
          availableCents > 0 ? (dailyCents / availableCents) * 100 : 50;
        setDailyProportionOfAvailable(Math.min(100, Math.max(0, proportion)));

        setAllocation({
          fixedPercent: parseFloat(fixedPct.toFixed(1)),
          dailyPercent: parseFloat(
            initialData.allocation.dailyPercent.toFixed(1),
          ),
          reservePercent: parseFloat(
            initialData.allocation.reservePercent.toFixed(1),
          ),
        });
      } else {
        // Default to 50% split
        const proportion = 50;
        setDailyProportionOfAvailable(proportion);

        const dailyCents = Math.round((proportion / 100) * availableCents);
        const reserveCents = availableCents - dailyCents;

        const dailyPct =
          totalIncome > 0 ? (dailyCents / totalIncomeCents) * 100 : 0;
        const reservePct =
          totalIncome > 0 ? (reserveCents / totalIncomeCents) * 100 : 0;

        setAllocation({
          fixedPercent: parseFloat(fixedPct.toFixed(1)),
          dailyPercent: parseFloat(dailyPct.toFixed(1)),
          reservePercent: parseFloat(reservePct.toFixed(1)),
        });
      }
    }
  }, [
    step,
    totalIncome,
    totalFixed,
    totalIncomeCents,
    availableCents,
    initialData.allocation,
  ]);

  // === INCOME HANDLERS ===
  const addIncome = () => {
    setIncomes([...incomes, { name: "", amount: 0 }]);
  };

  const removeIncome = (id?: string) => {
    setIncomes(incomes.filter((i) => i.id !== id));
  };

  const updateIncome = (
    id: string | undefined,
    field: keyof IncomeSource,
    value: string | number,
  ) => {
    setIncomes(
      incomes.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  };

  // === CREDIT CARD HANDLERS ===
  const addCreditCard = () => {
    const usedColors = creditCards.map((c) => c.color);
    const availableColor =
      CARD_COLORS.find((c) => !usedColors.includes(c)) || CARD_COLORS[0];
    setCreditCards([
      ...creditCards,
      {
        id: generateUniqueId(),
        name: "",
        dueDay: 10,
        closingDay: getFallbackClosingDay(10),
        limit: 0,
        color: availableColor,
      },
    ]);
  };

  const removeCreditCard = (id?: string) => {
    setCreditCards(creditCards.filter((c) => c.id !== id));
    // Remove expenses linked to this card
    setExpenses(expenses.filter((e) => e.creditCardId !== id));
    // Clear invoice total for this card
    if (id) {
      setInvoiceTotals((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const updateCardInvoiceTotal = (cardId: string, amount: number) => {
    setInvoiceTotals((prev) => ({ ...prev, [cardId]: amount }));
  };

  const updateCreditCard = (
    id: string | undefined,
    field: keyof CreditCard,
    value: string | number,
  ) => {
    setCreditCards(
      creditCards.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );

    // Update due date of expenses linked to this card when dueDay changes
    if (field === "dueDay") {
      setExpenses(
        expenses.map((e) =>
          e.creditCardId === id ? { ...e, dueDay: value as number } : e,
        ),
      );
    }
  };

  // === EXPENSE HANDLERS ===
  const addFixedExpense = (creditCardId?: string) => {
    const card = creditCardId
      ? creditCards.find((c) => c.id === creditCardId)
      : null;

    setExpenses([
      ...expenses,
      {
        id: generateUniqueId(),
        name: "",
        amount: 0,
        dueDay: card ? card.dueDay : 1,
        type: ExpenseType.MANDATORY,
        paid: false,
        creditCardId,
      },
    ]);
  };

  const addFixedExpensesBulk = (
    items: {
      name: string;
      amount: number;
      isInstallment?: boolean;
      totalInstallments?: number;
      startInstallment?: number;
    }[],
    creditCardId?: string,
  ) => {
    const card = creditCardId
      ? creditCards.find((c) => c.id === creditCardId)
      : null;

    const newExpenses = items.map((item) => ({
      id: generateUniqueId(),
      name: item.name,
      amount: item.amount,
      dueDay: card ? card.dueDay : 1,
      type: ExpenseType.MANDATORY,
      paid: false,
      creditCardId,
      isInstallment: item.isInstallment ?? false,
      totalInstallments: item.totalInstallments,
      startInstallment: item.isInstallment
        ? item.startInstallment || 1
        : undefined,
    }));

    setExpenses([...expenses, ...newExpenses]);
  };

  const removeExpense = (id?: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;

    // Check if it's a new (unsaved) expense - no ID means it's new
    const isNewExpense = !expense.id || expense.id.startsWith("temp-");

    if (isNewExpense) {
      // Remove directly from state (not persisted yet)
      setExpenses(expenses.filter((e) => e !== expense));
    } else if (expense.isInstallment || expense.installmentExpenseId) {
      // Show modal for existing installments
      setExpenseToDelete(expense);
    } else {
      // Mark existing non-installment expense for deletion
      setExpenses(
        expenses.map((e) =>
          e.id === id ? { ...e, markedForDeletion: true } : e,
        ),
      );
    }
  };

  const updateExpense = (
    id: string | undefined,
    field: keyof FixedExpense,
    value: string | number | boolean | undefined,
  ) => {
    setExpenses((prevExpenses) =>
      prevExpenses.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

  const handleDeleteCurrentInstallment = () => {
    if (!expenseToDelete) return;

    // Mark for deletion with current scope
    setExpenses(
      expenses.map((e) =>
        e.id === expenseToDelete.id
          ? { ...e, markedForDeletion: true, deletionScope: "current" as const }
          : e,
      ),
    );
    setExpenseToDelete(null);
  };

  const handleDeleteAllFutureInstallments = () => {
    if (!expenseToDelete) return;

    // Mark for deletion with future scope
    setExpenses(
      expenses.map((e) =>
        e.id === expenseToDelete.id
          ? { ...e, markedForDeletion: true, deletionScope: "future" as const }
          : e,
      ),
    );
    setExpenseToDelete(null);
  };

  // === ALLOCATION HANDLER ===
  const handleAllocationChange = (proportion: number) => {
    setDailyProportionOfAvailable(proportion);

    // Calculate cents from proportion of available funds
    const dailyCents = Math.round((proportion / 100) * availableCents);
    const reserveCents = availableCents - dailyCents;

    // Calculate percentages relative to total income
    const fixedPct = totalIncome > 0 ? (totalFixed / totalIncome) * 100 : 0;
    const dailyPct =
      totalIncome > 0 ? (dailyCents / totalIncomeCents) * 100 : 0;
    const reservePct =
      totalIncome > 0 ? (reserveCents / totalIncomeCents) * 100 : 0;

    setAllocation({
      fixedPercent: parseFloat(fixedPct.toFixed(1)),
      dailyPercent: parseFloat(dailyPct.toFixed(1)),
      reservePercent: parseFloat(reservePct.toFixed(1)),
    });
  };

  const value: BudgetSetupWizardContextValue = {
    // Wizard metadata
    monthName,
    month,
    year,
    isEditing,
    isFirstMonth,
    isPartialMonth,
    partialMonthInfo,

    // External callbacks
    onSave,
    onCancel,

    // Navigation
    step,
    setStep,

    // State
    incomes,
    creditCards,
    expenses,
    allocation,
    dailyProportionOfAvailable,
    targetRemaining,
    expenseToDelete,
    invoiceTotals,

    // Computed values
    totalIncome,
    totalFixed,
    availableCents,

    // Handlers
    addIncome,
    removeIncome,
    updateIncome,
    addCreditCard,
    removeCreditCard,
    updateCreditCard,
    updateCardInvoiceTotal,
    addFixedExpense,
    addFixedExpensesBulk,
    removeExpense,
    updateExpense,
    setExpenseToDelete,
    handleDeleteCurrentInstallment,
    handleDeleteAllFutureInstallments,
    handleAllocationChange,
    setTargetRemaining,
  };

  return (
    <BudgetSetupWizardContext.Provider value={value}>
      {children}
    </BudgetSetupWizardContext.Provider>
  );
}

export function useBudgetSetupWizard() {
  const context = useContext(BudgetSetupWizardContext);
  if (context === undefined) {
    throw new Error(
      "useBudgetSetupWizard must be used within a BudgetSetupWizardProvider",
    );
  }
  return context;
}
