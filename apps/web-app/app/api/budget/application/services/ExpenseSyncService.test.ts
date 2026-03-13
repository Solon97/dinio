import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExpenseSyncService } from "./ExpenseSyncService";
import {
  IFixedExpenseRepository,
  IInstallmentExpenseRepository,
} from "../../domain/repositories/IBudgetRepository";
import { FixedExpense } from "@/types/finance";
import { ExpenseType } from "@/types/finance";
import { DatabaseFixedExpense } from "../../domain/entities/BudgetConfig";
import { v4 as uuidv4 } from "uuid";

// Valid UUIDs for testing
const UUID_EXP_1 = uuidv4();
const UUID_EXP_2 = uuidv4();

describe("ExpenseSyncService", () => {
  let service: ExpenseSyncService;
  let mockExpenseRepository: IFixedExpenseRepository;
  let mockInstallmentExpenseRepository: IInstallmentExpenseRepository;

  beforeEach(() => {
    mockExpenseRepository = {
      findByUserAndMonth: vi.fn(),
      findById: vi.fn(),
      deleteByUserAndMonth: vi.fn(),
      bulkCreate: vi.fn(),
      bulkUpdate: vi.fn(),
      update: vi.fn(),
      setRefundIncomeId: vi.fn(),
      softDelete: vi.fn(),
      softDeleteFutureInstallments: vi.fn(),
    };

    mockInstallmentExpenseRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    service = new ExpenseSyncService(
      mockExpenseRepository,
      mockInstallmentExpenseRepository,
    );
  });

  describe("execute", () => {
    const userId = "user123";
    const monthId = "202601";

    it("should create new regular expenses when none exist", async () => {
      const newExpenses: FixedExpense[] = [
        {
          name: "Rent",
          amount: 150000,
          dueDay: 1,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: false,
        },
        {
          name: "Internet",
          amount: 10000,
          dueDay: 5,
          type: ExpenseType.DISCRETIONARY,
          paid: false,
          isInstallment: false,
        },
      ];

      vi.mocked(mockExpenseRepository.findByUserAndMonth).mockResolvedValue([]);

      await service.execute(userId, monthId, newExpenses);

      expect(mockExpenseRepository.bulkCreate).toHaveBeenCalledTimes(1);
      expect(mockExpenseRepository.bulkCreate).toHaveBeenCalledWith([
        {
          userId,
          monthId,
          name: "Rent",
          amount: 150000,
          dueDay: 1,
          isMandatory: true,
          creditCardId: undefined,
          isRefundable: false,
        },
        {
          userId,
          monthId,
          name: "Internet",
          amount: 10000,
          dueDay: 5,
          isMandatory: false,
          creditCardId: undefined,
          isRefundable: false,
        },
      ]);
    });

    it("should update existing regular expenses", async () => {
      const existingDbExpenses: DatabaseFixedExpense[] = [
        {
          id: UUID_EXP_1,
          userId,
          monthId,
          name: "Rent",
          amount: 150000,
          dueDay: 1,
          installmentExpenseId: null as string | null,
        },
      ];

      const updatedExpenses: FixedExpense[] = [
        {
          id: UUID_EXP_1,
          name: "Rent Updated",
          amount: 160000,
          dueDay: 1,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: false,
        },
      ];

      vi.mocked(mockExpenseRepository.findByUserAndMonth).mockResolvedValue(
        existingDbExpenses,
      );

      await service.execute(userId, monthId, updatedExpenses);

      expect(mockExpenseRepository.bulkUpdate).toHaveBeenCalledTimes(1);
      expect(mockExpenseRepository.bulkUpdate).toHaveBeenCalledWith(
        userId,
        monthId,
        [
          {
            id: UUID_EXP_1,
            name: "Rent Updated",
            amount: 160000,
            dueDay: 1,
            isMandatory: true,
            creditCardId: undefined,
            isRefundable: false,
          },
        ],
      );
      // Should not delete since expense is still in the list
      expect(mockExpenseRepository.softDelete).not.toHaveBeenCalled();
    });

    it("should soft delete removed regular expenses", async () => {
      const existingDbExpenses: DatabaseFixedExpense[] = [
        {
          id: UUID_EXP_1,
          userId,
          monthId,
          name: "Rent",
          amount: 150000,
          dueDay: 1,
          installmentExpenseId: null as string | null,
        },
        {
          id: UUID_EXP_2,
          userId,
          monthId,
          name: "Internet",
          amount: 10000,
          dueDay: 5,
          installmentExpenseId: null as string | null,
        },
      ];

      const submittedExpenses: FixedExpense[] = [
        {
          id: UUID_EXP_1,
          name: "Rent",
          amount: 150000,
          dueDay: 1,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: false,
        },
      ];

      vi.mocked(mockExpenseRepository.findByUserAndMonth).mockResolvedValue(
        existingDbExpenses,
      );

      await service.execute(userId, monthId, submittedExpenses);

      expect(mockExpenseRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(mockExpenseRepository.softDelete).toHaveBeenCalledWith(
        [UUID_EXP_2],
        userId,
      );
    });

    it("should not delete installment expenses", async () => {
      const existingDbExpenses: DatabaseFixedExpense[] = [
        {
          id: UUID_EXP_1,
          userId,
          monthId,
          name: "Regular Expense",
          amount: 10000,
          dueDay: 1,
          installmentExpenseId: null as string | null,
        },
        {
          id: "exp-2",
          userId,
          monthId,
          name: "Installment Expense",
          amount: 20000,
          dueDay: 1,
          installmentExpenseId: "inst-1" as string | null,
        },
      ];

      const submittedExpenses: FixedExpense[] = [];

      vi.mocked(mockExpenseRepository.findByUserAndMonth).mockResolvedValue(
        existingDbExpenses,
      );

      await service.execute(userId, monthId, submittedExpenses);

      // Only the regular expense should be soft deleted
      expect(mockExpenseRepository.softDelete).toHaveBeenCalledWith(
        [UUID_EXP_1],
        userId,
      );
    });

    it("should handle expenses with credit cards", async () => {
      const newExpenses: FixedExpense[] = [
        {
          name: "Netflix",
          amount: 5000,
          dueDay: 10,
          type: ExpenseType.DISCRETIONARY,
          paid: false,
          creditCardId: "card-1",
          isInstallment: false,
        },
      ];

      vi.mocked(mockExpenseRepository.findByUserAndMonth).mockResolvedValue([]);

      await service.execute(userId, monthId, newExpenses);

      expect(mockExpenseRepository.bulkCreate).toHaveBeenCalledWith([
        {
          userId,
          monthId,
          name: "Netflix",
          amount: 5000,
          dueDay: 10,
          isMandatory: false,
          creditCardId: "card-1",
          isRefundable: false,
        },
      ]);
    });

    it("should treat temp- IDs as new expenses", async () => {
      const expenses: FixedExpense[] = [
        {
          id: "temp-123",
          name: "New Expense",
          amount: 10000,
          dueDay: 1,
          type: ExpenseType.DISCRETIONARY,
          paid: false,
          isInstallment: false,
        },
      ];

      vi.mocked(mockExpenseRepository.findByUserAndMonth).mockResolvedValue([]);

      await service.execute(userId, monthId, expenses);

      expect(mockExpenseRepository.bulkCreate).toHaveBeenCalledTimes(1);
      expect(mockExpenseRepository.bulkUpdate).not.toHaveBeenCalled();
    });

    it("should handle mixed operations: update, create, delete", async () => {
      const existingDbExpenses: DatabaseFixedExpense[] = [
        {
          id: UUID_EXP_1,
          userId,
          monthId,
          name: "Rent",
          amount: 150000,
          dueDay: 1,
          installmentExpenseId: null as string | null,
        },
        {
          id: UUID_EXP_2,
          userId,
          monthId,
          name: "Old Expense",
          amount: 5000,
          dueDay: 1,
          installmentExpenseId: null as string | null,
        },
      ];

      const submittedExpenses: FixedExpense[] = [
        {
          id: UUID_EXP_1,
          name: "Rent Updated",
          amount: 160000,
          dueDay: 1,
          type: ExpenseType.MANDATORY,
          paid: false,
          isInstallment: false,
        },
        {
          name: "New Subscription",
          amount: 3000,
          dueDay: 5,
          type: ExpenseType.DISCRETIONARY,
          paid: false,
          isInstallment: false,
        },
      ];

      vi.mocked(mockExpenseRepository.findByUserAndMonth).mockResolvedValue(
        existingDbExpenses,
      );

      await service.execute(userId, monthId, submittedExpenses);

      // Update
      expect(mockExpenseRepository.bulkUpdate).toHaveBeenCalledTimes(1);
      expect(mockExpenseRepository.bulkUpdate).toHaveBeenCalledWith(
        userId,
        monthId,
        [
          {
            id: UUID_EXP_1,
            name: "Rent Updated",
            amount: 160000,
            dueDay: 1,
            isMandatory: true,
            creditCardId: undefined,
            isRefundable: false,
          },
        ],
      );

      // Create
      expect(mockExpenseRepository.bulkCreate).toHaveBeenCalledWith([
        {
          userId,
          monthId,
          name: "New Subscription",
          amount: 3000,
          dueDay: 5,
          isMandatory: false,
          creditCardId: undefined,
          isRefundable: false,
        },
      ]);

      // Delete
      expect(mockExpenseRepository.softDelete).toHaveBeenCalledWith(
        [UUID_EXP_2],
        userId,
      );
    });
  });
});
