import { describe, it, expect } from "vitest";
import { calculateTotalFixedExpenses } from "./calculateTotalFixed";
import { FixedExpense, ExpenseType } from "@/types/finance";

describe("calculateTotalFixedExpenses", () => {
  it("should return 0 for empty expenses array", () => {
    const expenses: FixedExpense[] = [];
    const result = calculateTotalFixedExpenses(expenses);
    expect(result).toBe(0);
  });

  it("should calculate total for single non-installment expense", () => {
    const expenses: FixedExpense[] = [
      {
        id: "1",
        name: "Aluguel",
        amount: 1500,
        dueDay: 5,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: false,
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    expect(result).toBe(150000); // 1500 * 100
  });

  it("should calculate total for multiple non-installment expenses", () => {
    const expenses: FixedExpense[] = [
      {
        id: "1",
        name: "Aluguel",
        amount: 1500,
        dueDay: 5,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: false,
      },
      {
        id: "2",
        name: "Internet",
        amount: 100,
        dueDay: 10,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: false,
      },
      {
        id: "3",
        name: "Academia",
        amount: 150,
        dueDay: 15,
        type: ExpenseType.DISCRETIONARY,
        paid: false,
        isInstallment: false,
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    expect(result).toBe(175000); // (1500 + 100 + 150) * 100
  });

  it("should calculate first installment for installment expense", () => {
    const expenses: FixedExpense[] = [
      {
        id: "temp-1",
        name: "Notebook",
        amount: 3000,
        dueDay: 10,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: true,
        totalInstallments: 10,
        startInstallment: 1,
        creditCardId: "card-1",
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    // First installment handles the remainder: 300000 / 10 = 30000 per installment
    // Since 300000 % 10 = 0, first installment = 30000
    expect(result).toBe(30000);
  });

  it("should calculate regular installment for installment expense", () => {
    const expenses: FixedExpense[] = [
      {
        id: "temp-1",
        name: "Celular",
        amount: 1000,
        dueDay: 10,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: true,
        totalInstallments: 10,
        startInstallment: 5, // Not first installment
        creditCardId: "card-1",
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    // Regular installment: 100000 / 10 = 10000
    expect(result).toBe(10000);
  });

  it("should calculate first installment with remainder correctly", () => {
    const expenses: FixedExpense[] = [
      {
        id: "temp-1",
        name: "TV",
        amount: 1000,
        dueDay: 10,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: true,
        totalInstallments: 3,
        startInstallment: 1,
        creditCardId: "card-1",
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    // 100000 / 3 = 33333.33...
    // Regular installment: floor(100000 / 3) = 33333
    // First installment: 100000 - (33333 * 2) = 33334
    expect(result).toBe(33334);
  });

  it("should calculate mixed expenses (installment and non-installment)", () => {
    const expenses: FixedExpense[] = [
      {
        id: "1",
        name: "Aluguel",
        amount: 1500,
        dueDay: 5,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: false,
      },
      {
        id: "temp-2",
        name: "Notebook",
        amount: 3000,
        dueDay: 10,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: true,
        totalInstallments: 10,
        startInstallment: 1,
        creditCardId: "card-1",
      },
      {
        id: "3",
        name: "Internet",
        amount: 100,
        dueDay: 15,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: false,
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    // Aluguel: 150000 + Notebook (first): 30000 + Internet: 10000 = 190000
    expect(result).toBe(190000);
  });

  it("should handle zero amount expenses", () => {
    const expenses: FixedExpense[] = [
      {
        id: "1",
        name: "Aluguel",
        amount: 0,
        dueDay: 5,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: false,
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    expect(result).toBe(0);
  });

  it("should handle decimal values correctly", () => {
    const expenses: FixedExpense[] = [
      {
        id: "1",
        name: "Netflix",
        amount: 29.9,
        dueDay: 5,
        type: ExpenseType.DISCRETIONARY,
        paid: false,
        isInstallment: false,
      },
      {
        id: "2",
        name: "Spotify",
        amount: 19.9,
        dueDay: 10,
        type: ExpenseType.DISCRETIONARY,
        paid: false,
        isInstallment: false,
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    expect(result).toBe(4980); // (29.9 + 19.9) * 100 = 49.8 * 100 = 4980
  });

  it("should default to startInstallment 1 when not provided", () => {
    const expenses: FixedExpense[] = [
      {
        id: "temp-1",
        name: "Notebook",
        amount: 1000,
        dueDay: 10,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: true,
        totalInstallments: 3,
        // startInstallment not provided
        creditCardId: "card-1",
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    // Should use first installment calculation: 100000 - (33333 * 2) = 33334
    expect(result).toBe(33334);
  });

  it("should handle multiple installments in different stages", () => {
    const expenses: FixedExpense[] = [
      {
        id: "temp-1",
        name: "TV",
        amount: 2000,
        dueDay: 5,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: true,
        totalInstallments: 10,
        startInstallment: 1, // First installment
        creditCardId: "card-1",
      },
      {
        id: "temp-2",
        name: "Geladeira",
        amount: 3000,
        dueDay: 10,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: true,
        totalInstallments: 12,
        startInstallment: 6, // Regular installment
        creditCardId: "card-2",
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    // TV first installment: 200000 / 10 = 20000
    // Geladeira regular installment: 300000 / 12 = 25000
    expect(result).toBe(45000);
  });

  it("should ignore expenses marked for deletion", () => {
    const expenses: FixedExpense[] = [
      {
        id: "1",
        name: "Aluguel",
        amount: 1500,
        dueDay: 5,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: false,
        markedForDeletion: true,
      },
      {
        id: "2",
        name: "Internet",
        amount: 100,
        dueDay: 10,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: false,
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    // Aluguel is marked for deletion and should be ignored: only Internet counted
    expect(result).toBe(10000);
  });

  it("should ignore installment expense when marked for deletion (any scope)", () => {
    const expenses: FixedExpense[] = [
      {
        id: "1",
        name: "Notebook",
        amount: 3000,
        dueDay: 10,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: true,
        totalInstallments: 10,
        startInstallment: 1,
        creditCardId: "card-1",
        markedForDeletion: true,
        deletionScope: "current",
      },
      {
        id: "2",
        name: "Aluguel",
        amount: 1500,
        dueDay: 5,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: false,
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    // Notebook is marked for deletion and should be ignored: only Aluguel counted
    expect(result).toBe(150000);
  });

  it("should return 0 when all expenses are marked for deletion", () => {
    const expenses: FixedExpense[] = [
      {
        id: "1",
        name: "Aluguel",
        amount: 1500,
        dueDay: 5,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: false,
        markedForDeletion: true,
      },
      {
        id: "2",
        name: "Internet",
        amount: 100,
        dueDay: 10,
        type: ExpenseType.MANDATORY,
        paid: false,
        isInstallment: false,
        markedForDeletion: true,
      },
    ];
    const result = calculateTotalFixedExpenses(expenses);
    expect(result).toBe(0);
  });

  describe("Installment expenses logic", () => {
    it("should add full amount for existing installment expense (real id)", () => {
      const expenses: FixedExpense[] = [
        {
          id: "existing-uuid-123",
          name: "Notebook",
          amount: 3000,
          dueDay: 10,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: true,
          totalInstallments: 10,
          startInstallment: 5,
          creditCardId: "card-1",
        },
      ];
      const result = calculateTotalFixedExpenses(expenses);
      // Existing installment: should add FULL amount (not just current installment)
      expect(result).toBe(300000); // 3000 * 100
    });

    it("should calculate installment value for new installment expense (temp id)", () => {
      const expenses: FixedExpense[] = [
        {
          id: "temp-123",
          name: "TV",
          amount: 2000,
          dueDay: 10,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: true,
          totalInstallments: 10,
          startInstallment: 1,
          creditCardId: "card-1",
        },
      ];
      const result = calculateTotalFixedExpenses(expenses);
      // New installment (temp id): should calculate FIRST installment value
      expect(result).toBe(20000); // 200000 / 10
    });

    it("should calculate installment value for new installment expense (no id)", () => {
      const expenses: FixedExpense[] = [
        {
          name: "Geladeira",
          amount: 1500,
          dueDay: 5,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: true,
          totalInstallments: 6,
          startInstallment: 1,
          creditCardId: "card-2",
        },
      ];
      const result = calculateTotalFixedExpenses(expenses);
      // New installment (no id): should calculate FIRST installment value
      expect(result).toBe(25000); // 150000 / 6
    });

    it("should calculate regular installment for new expense starting at installment > 1", () => {
      const expenses: FixedExpense[] = [
        {
          id: "temp-456",
          name: "Sofá",
          amount: 1000,
          dueDay: 15,
          type: ExpenseType.DISCRETIONARY,
          paid: false,
          isInstallment: true,
          totalInstallments: 4,
          startInstallment: 3, // Starting at 3rd installment
          creditCardId: "card-1",
        },
      ];
      const result = calculateTotalFixedExpenses(expenses);
      // Regular installment: floor(100000 / 4) = 25000
      expect(result).toBe(25000);
    });

    it("should handle mix of existing and new installment expenses", () => {
      const expenses: FixedExpense[] = [
        {
          id: "existing-abc",
          name: "Notebook Existente",
          amount: 3000,
          dueDay: 5,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: true,
          totalInstallments: 12,
          startInstallment: 6,
          creditCardId: "card-1",
        },
        {
          id: "temp-new-123",
          name: "TV Nova",
          amount: 2000,
          dueDay: 10,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: true,
          totalInstallments: 10,
          startInstallment: 1,
          creditCardId: "card-2",
        },
        {
          name: "Sem ID",
          amount: 1000,
          dueDay: 15,
          type: ExpenseType.DISCRETIONARY,
          paid: false,
          isInstallment: true,
          totalInstallments: 5,
          startInstallment: 2,
          creditCardId: "card-3",
        },
      ];
      const result = calculateTotalFixedExpenses(expenses);
      // Existing: 300000 (full amount)
      // New with temp: 20000 (first installment: 200000/10)
      // New without id: 20000 (regular installment: floor(100000/5))
      expect(result).toBe(340000);
    });

    it("should handle existing installment with remainder in division", () => {
      const expenses: FixedExpense[] = [
        {
          id: "real-id-999",
          name: "Produto Parcelado",
          amount: 1000,
          dueDay: 10,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: true,
          totalInstallments: 3,
          startInstallment: 1,
          creditCardId: "card-1",
        },
      ];
      const result = calculateTotalFixedExpenses(expenses);
      // Existing installment: should add FULL amount regardless of startInstallment
      expect(result).toBe(100000); // 1000 * 100
    });

    it("should handle new installment with remainder correctly", () => {
      const expenses: FixedExpense[] = [
        {
          id: "temp-remainder",
          name: "Item Novo",
          amount: 1000,
          dueDay: 5,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: true,
          totalInstallments: 3,
          startInstallment: 1,
          creditCardId: "card-1",
        },
      ];
      const result = calculateTotalFixedExpenses(expenses);
      // 100000 / 3 = 33333.33
      // Regular: 33333, First: 100000 - (33333 * 2) = 33334
      expect(result).toBe(33334);
    });

    it("should calculate correctly for mixed regular and non-installment with existing installments", () => {
      const expenses: FixedExpense[] = [
        {
          id: "1",
          name: "Aluguel",
          amount: 1500,
          dueDay: 5,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: false,
        },
        {
          id: "existing-installment-1",
          name: "Notebook (Já Existe)",
          amount: 3000,
          dueDay: 10,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: true,
          totalInstallments: 10,
          startInstallment: 5,
          creditCardId: "card-1",
        },
        {
          id: "temp-new",
          name: "TV (Nova)",
          amount: 2000,
          dueDay: 15,
          type: ExpenseType.DISCRETIONARY,
          paid: false,
          isInstallment: true,
          totalInstallments: 8,
          startInstallment: 1,
          creditCardId: "card-2",
        },
      ];
      const result = calculateTotalFixedExpenses(expenses);
      // Aluguel: 150000
      // Existing installment: 300000 (full)
      // New installment: 25000 (first: 200000/8)
      expect(result).toBe(475000);
    });
  });
});
