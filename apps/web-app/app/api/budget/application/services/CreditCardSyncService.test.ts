import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreditCardSyncService } from "./CreditCardSyncService";
import { ICreditCardRepository } from "../../domain/repositories/IBudgetRepository";
import { CreditCard } from "@/types/finance";
import { v4 as uuidv4 } from "uuid";

// Valid UUIDs for testing
const UUID_CARD_1 = uuidv4();
const UUID_CARD_2 = uuidv4();
const UUID_CARD_3 = uuidv4();

describe("CreditCardSyncService", () => {
  let service: CreditCardSyncService;
  let mockCreditCardRepository: ICreditCardRepository;

  beforeEach(() => {
    mockCreditCardRepository = {
      findActiveByUser: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      bulkUpdate: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      hardDelete: vi.fn(),
      checkHasExpenses: vi.fn(),
    };

    service = new CreditCardSyncService(mockCreditCardRepository);

    // Default: create returns a card with an id (needed for tempIdToRealId mapping)
    vi.mocked(mockCreditCardRepository.create).mockResolvedValue({
      id: "created-card-uuid",
      name: "",
      dueDay: 0,
      limit: 0,
      color: "",
    });
  });

  describe("execute", () => {
    const userId = "user123";

    it("should create new credit cards when no existing cards exist", async () => {
      const newCards: CreditCard[] = [
        {
          id: "temp-1",
          name: "Nubank",
          dueDay: 15,
          limit: 500000,
          color: "#8A05BE",
        },
        {
          id: "temp-2",
          name: "Inter",
          dueDay: 20,
          limit: 300000,
          color: "#FF7A00",
        },
      ];

      vi.mocked(mockCreditCardRepository.findActiveByUser).mockResolvedValue(
        [],
      );

      await service.execute(userId, newCards);

      expect(mockCreditCardRepository.create).toHaveBeenCalledTimes(2);
      expect(mockCreditCardRepository.create).toHaveBeenCalledWith({
        userId,
        name: "Nubank",
        dueDay: 15,
        limit: 500000,
        color: "#8A05BE",
      });
      expect(mockCreditCardRepository.create).toHaveBeenCalledWith({
        userId,
        name: "Inter",
        dueDay: 20,
        limit: 300000,
        color: "#FF7A00",
      });
    });

    it("should update existing credit cards", async () => {
      const existingDbCards: CreditCard[] = [
        {
          id: UUID_CARD_1,
          name: "Nubank",
          dueDay: 15,
          limit: 500000,
          color: "#8A05BE",
        },
      ];

      const updatedCards: CreditCard[] = [
        {
          id: UUID_CARD_1,
          name: "Nubank Updated",
          dueDay: 20,
          limit: 600000,
          color: "#9A15CE",
        },
      ];

      vi.mocked(mockCreditCardRepository.findActiveByUser).mockResolvedValue(
        existingDbCards,
      );
      // Mock checkHasExpenses to return empty Set (no cards have expenses)
      vi.mocked(mockCreditCardRepository.checkHasExpenses).mockResolvedValue(
        new Set(),
      );

      await service.execute(userId, updatedCards);

      expect(mockCreditCardRepository.bulkUpdate).toHaveBeenCalledTimes(1);
      expect(mockCreditCardRepository.bulkUpdate).toHaveBeenCalledWith(userId, [
        {
          id: UUID_CARD_1,
          name: "Nubank Updated",
          dueDay: 20,
          limit: 600000,
          color: "#9A15CE",
        },
      ]);
      expect(mockCreditCardRepository.create).not.toHaveBeenCalled();
    });

    it("should soft delete cards that have expenses", async () => {
      const existingDbCards: CreditCard[] = [
        {
          id: UUID_CARD_1,
          name: "Nubank",
          dueDay: 15,
          limit: 500000,
          color: "#8A05BE",
        },
        {
          id: UUID_CARD_2,
          name: "Inter",
          dueDay: 20,
          limit: 300000,
          color: "#FF7A00",
        },
      ];

      vi.mocked(mockCreditCardRepository.findActiveByUser).mockResolvedValue(
        existingDbCards,
      );
      vi.mocked(mockCreditCardRepository.checkHasExpenses).mockResolvedValue(
        new Set([UUID_CARD_1]),
      );

      // Submit only card-2, so card-1 should be deleted
      await service.execute(userId, [existingDbCards[1]]);

      expect(mockCreditCardRepository.checkHasExpenses).toHaveBeenCalledWith([
        UUID_CARD_1,
      ]);
      expect(mockCreditCardRepository.softDelete).toHaveBeenCalledWith(
        [UUID_CARD_1],
        userId,
      );
      expect(mockCreditCardRepository.hardDelete).not.toHaveBeenCalled();
    });

    it("should hard delete cards that have no expenses", async () => {
      const existingDbCards: CreditCard[] = [
        {
          id: UUID_CARD_1,
          name: "Nubank",
          dueDay: 15,
          limit: 500000,
          color: "#8A05BE",
        },
        {
          id: UUID_CARD_2,
          name: "Inter",
          dueDay: 20,
          limit: 300000,
          color: "#FF7A00",
        },
      ];

      vi.mocked(mockCreditCardRepository.findActiveByUser).mockResolvedValue(
        existingDbCards,
      );
      vi.mocked(mockCreditCardRepository.checkHasExpenses).mockResolvedValue(
        new Set(), // No cards have expenses
      );

      // Submit only card-2, so card-1 should be deleted
      await service.execute(userId, [existingDbCards[1]]);

      expect(mockCreditCardRepository.checkHasExpenses).toHaveBeenCalledWith([
        UUID_CARD_1,
      ]);
      expect(mockCreditCardRepository.hardDelete).toHaveBeenCalledWith(
        [UUID_CARD_1],
        userId,
      );
      expect(mockCreditCardRepository.softDelete).not.toHaveBeenCalled();
    });

    it("should handle mixed operations: soft delete, hard delete, update, and create", async () => {
      const existingDbCards: CreditCard[] = [
        {
          id: UUID_CARD_1,
          name: "Nubank",
          dueDay: 15,
          limit: 500000,
          color: "#8A05BE",
        },
        {
          id: UUID_CARD_2,
          name: "Inter",
          dueDay: 20,
          limit: 300000,
          color: "#FF7A00",
        },
        {
          id: UUID_CARD_3,
          name: "Itau",
          dueDay: 10,
          limit: 400000,
          color: "#EC7000",
        },
      ];

      const submittedCards: CreditCard[] = [
        {
          id: UUID_CARD_1,
          name: "Nubank Updated",
          dueDay: 18,
          limit: 550000,
          color: "#8A05BE",
        },
        {
          id: "temp-new",
          name: "C6 Bank",
          dueDay: 25,
          limit: 200000,
          color: "#000000",
        },
      ];

      vi.mocked(mockCreditCardRepository.findActiveByUser).mockResolvedValue(
        existingDbCards,
      );
      // card-2 has expenses (soft delete), card-3 has no expenses (hard delete)
      vi.mocked(mockCreditCardRepository.checkHasExpenses).mockResolvedValue(
        new Set([UUID_CARD_2]),
      );

      await service.execute(userId, submittedCards);

      // Check deletions - card-1 is also being updated, not deleted
      // Only card-2 and card-3 are being removed
      expect(mockCreditCardRepository.checkHasExpenses).toHaveBeenCalledWith([
        UUID_CARD_2,
        UUID_CARD_3,
      ]);
      expect(mockCreditCardRepository.softDelete).toHaveBeenCalledWith(
        [UUID_CARD_2],
        userId,
      );
      expect(mockCreditCardRepository.hardDelete).toHaveBeenCalledWith(
        [UUID_CARD_3],
        userId,
      );

      // Check update
      expect(mockCreditCardRepository.bulkUpdate).toHaveBeenCalledWith(userId, [
        {
          id: UUID_CARD_1,
          name: "Nubank Updated",
          dueDay: 18,
          limit: 550000,
          color: "#8A05BE",
        },
      ]);

      // Check creation
      expect(mockCreditCardRepository.create).toHaveBeenCalledWith({
        userId,
        name: "C6 Bank",
        dueDay: 25,
        limit: 200000,
        color: "#000000",
      });
    });

    it("should handle cards without id as new cards", async () => {
      const newCards: CreditCard[] = [
        {
          name: "Nubank",
          dueDay: 15,
          limit: 500000,
          color: "#8A05BE",
        },
      ];

      vi.mocked(mockCreditCardRepository.findActiveByUser).mockResolvedValue(
        [],
      );

      await service.execute(userId, newCards);

      expect(mockCreditCardRepository.create).toHaveBeenCalledTimes(1);
      expect(mockCreditCardRepository.create).toHaveBeenCalledWith({
        userId,
        name: "Nubank",
        dueDay: 15,
        limit: 500000,
        color: "#8A05BE",
      });
    });

    it("should not attempt deletion when no cards are removed", async () => {
      const existingDbCards: CreditCard[] = [
        {
          id: UUID_CARD_1,
          name: "Nubank",
          dueDay: 15,
          limit: 500000,
          color: "#8A05BE",
        },
      ];

      vi.mocked(mockCreditCardRepository.findActiveByUser).mockResolvedValue(
        existingDbCards,
      );
      // Mock checkHasExpenses - no deletion should happen
      vi.mocked(mockCreditCardRepository.checkHasExpenses).mockResolvedValue(
        new Set(),
      );

      // Submit the same card
      await service.execute(userId, existingDbCards);

      expect(mockCreditCardRepository.checkHasExpenses).not.toHaveBeenCalled();
      expect(mockCreditCardRepository.softDelete).not.toHaveBeenCalled();
      expect(mockCreditCardRepository.hardDelete).not.toHaveBeenCalled();
      expect(mockCreditCardRepository.bulkUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
