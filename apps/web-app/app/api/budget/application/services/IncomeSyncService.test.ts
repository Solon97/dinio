import { describe, it, expect, beforeEach, vi } from "vitest";
import { IncomeSyncService } from "./IncomeSyncService";
import { IIncomeRepository } from "../../domain/repositories/IBudgetRepository";
import { IncomeSource } from "@/types/finance";
import { v4 as uuidv4 } from "uuid";

// Valid UUIDs for testing
const UUID_INC_1 = uuidv4();
const UUID_INC_2 = uuidv4();

describe("IncomeSyncService", () => {
  let service: IncomeSyncService;
  let mockIncomeRepository: IIncomeRepository;

  beforeEach(() => {
    mockIncomeRepository = {
      findByUserAndMonth: vi.fn(),
      deleteByUserAndMonth: vi.fn(),
      bulkCreate: vi.fn(),
      bulkUpdate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    service = new IncomeSyncService(mockIncomeRepository);
  });

  describe("execute", () => {
    const userId = "user123";
    const monthId = "202601";

    it("should create new incomes when none exist", async () => {
      const newIncomes: IncomeSource[] = [
        { name: "Salary", amount: 500000 },
        { name: "Freelance", amount: 200000 },
      ];

      vi.mocked(mockIncomeRepository.findByUserAndMonth).mockResolvedValue([]);

      await service.execute(userId, monthId, newIncomes);

      expect(mockIncomeRepository.bulkCreate).toHaveBeenCalledTimes(1);
      expect(mockIncomeRepository.bulkCreate).toHaveBeenCalledWith([
        { userId, monthId, name: "Salary", amount: 500000 },
        { userId, monthId, name: "Freelance", amount: 200000 },
      ]);
      expect(mockIncomeRepository.bulkUpdate).not.toHaveBeenCalled();
      expect(mockIncomeRepository.delete).not.toHaveBeenCalled();
    });

    it("should update existing incomes", async () => {
      const existingDbIncomes = [
        { id: UUID_INC_1, userId, monthId, name: "Salary", amount: 500000 },
      ];

      const updatedIncomes: IncomeSource[] = [
        { id: UUID_INC_1, name: "Salary Updated", amount: 550000 },
      ];

      vi.mocked(mockIncomeRepository.findByUserAndMonth).mockResolvedValue(
        existingDbIncomes,
      );

      await service.execute(userId, monthId, updatedIncomes);

      expect(mockIncomeRepository.bulkUpdate).toHaveBeenCalledTimes(1);
      expect(mockIncomeRepository.bulkUpdate).toHaveBeenCalledWith(
        userId,
        monthId,
        [
          {
            id: UUID_INC_1,
            name: "Salary Updated",
            amount: 550000,
          },
        ],
      );
      expect(mockIncomeRepository.bulkCreate).not.toHaveBeenCalled();
      expect(mockIncomeRepository.delete).not.toHaveBeenCalled();
    });

    it("should delete removed incomes", async () => {
      const existingDbIncomes = [
        { id: UUID_INC_1, userId, monthId, name: "Salary", amount: 500000 },
        { id: UUID_INC_2, userId, monthId, name: "Freelance", amount: 200000 },
      ];

      const submittedIncomes: IncomeSource[] = [
        { id: UUID_INC_1, name: "Salary", amount: 500000 },
      ];

      vi.mocked(mockIncomeRepository.findByUserAndMonth).mockResolvedValue(
        existingDbIncomes,
      );

      await service.execute(userId, monthId, submittedIncomes);

      expect(mockIncomeRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockIncomeRepository.delete).toHaveBeenCalledWith(
        [UUID_INC_2],
        userId,
      );
      // Should also update inc-1
      expect(mockIncomeRepository.bulkUpdate).toHaveBeenCalledTimes(1);
    });

    it("should handle mixed operations: update, create, and delete", async () => {
      const existingDbIncomes = [
        { id: UUID_INC_1, userId, monthId, name: "Salary", amount: 500000 },
        { id: UUID_INC_2, userId, monthId, name: "Old Income", amount: 100000 },
      ];

      const submittedIncomes: IncomeSource[] = [
        { id: UUID_INC_1, name: "Salary Updated", amount: 550000 },
        { name: "New Freelance", amount: 300000 },
      ];

      vi.mocked(mockIncomeRepository.findByUserAndMonth).mockResolvedValue(
        existingDbIncomes,
      );

      await service.execute(userId, monthId, submittedIncomes);

      // Update existing
      expect(mockIncomeRepository.bulkUpdate).toHaveBeenCalledTimes(1);
      expect(mockIncomeRepository.bulkUpdate).toHaveBeenCalledWith(
        userId,
        monthId,
        [
          {
            id: UUID_INC_1,
            name: "Salary Updated",
            amount: 550000,
          },
        ],
      );

      // Create new
      expect(mockIncomeRepository.bulkCreate).toHaveBeenCalledWith([
        { userId, monthId, name: "New Freelance", amount: 300000 },
      ]);

      // Delete removed
      expect(mockIncomeRepository.delete).toHaveBeenCalledWith(
        [UUID_INC_2],
        userId,
      );
    });

    it("should not delete when no incomes are removed", async () => {
      const existingDbIncomes = [
        { id: UUID_INC_1, userId, monthId, name: "Salary", amount: 500000 },
      ];

      const submittedIncomes: IncomeSource[] = [
        { id: UUID_INC_1, name: "Salary", amount: 500000 },
      ];

      vi.mocked(mockIncomeRepository.findByUserAndMonth).mockResolvedValue(
        existingDbIncomes,
      );

      await service.execute(userId, monthId, submittedIncomes);

      // Should update the existing income, not delete
      expect(mockIncomeRepository.bulkUpdate).toHaveBeenCalledWith(
        userId,
        monthId,
        [
          {
            id: UUID_INC_1,
            name: "Salary",
            amount: 500000,
          },
        ],
      );
      expect(mockIncomeRepository.delete).not.toHaveBeenCalled();
    });

    it("should handle empty income list by deleting all", async () => {
      const existingDbIncomes = [
        { id: UUID_INC_1, userId, monthId, name: "Salary", amount: 500000 },
      ];

      vi.mocked(mockIncomeRepository.findByUserAndMonth).mockResolvedValue(
        existingDbIncomes,
      );

      await service.execute(userId, monthId, []);

      expect(mockIncomeRepository.delete).toHaveBeenCalledWith(
        [UUID_INC_1],
        userId,
      );
      expect(mockIncomeRepository.bulkUpdate).not.toHaveBeenCalled();
      expect(mockIncomeRepository.bulkCreate).not.toHaveBeenCalled();
    });
  });
});
