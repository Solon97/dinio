import { ICreditCardRepository } from "../../domain/repositories/IBudgetRepository";
import { CreditCard } from "@/types/finance";
import { isValidUUID } from "../../helpers";

/**
 * Service responsible for synchronizing credit cards for a user's budget.
 * Handles soft/hard deletion of removed cards and updates/creates cards.
 */
export class CreditCardSyncService {
  constructor(private creditCardRepository: ICreditCardRepository) {}

  /**
   * Synchronizes credit cards by comparing submitted cards with existing ones in the database.
   * - Soft deletes cards that have expenses associated
   * - Hard deletes cards that have no expenses
   * - Updates existing cards
   * - Creates new cards
   *
   * @returns A map of temporary IDs to real UUIDs for newly created cards.
   */
  async execute(
    userId: string,
    creditCards: CreditCard[],
  ): Promise<Map<string, string>> {
    const tempIdToRealId = new Map<string, string>();

    const currentDbCards =
      await this.creditCardRepository.findActiveByUser(userId);
    const currentDbCardIds = new Set((currentDbCards || []).map((c) => c.id!));
    const submittedCardIds = new Set(
      creditCards.filter((c) => isValidUUID(c.id)).map((c) => c.id!),
    );

    // Soft/hard delete removed cards
    const cardsToDelete = [...currentDbCardIds].filter(
      (id) => !submittedCardIds.has(id),
    );

    if (cardsToDelete.length > 0) {
      const cardIdsWithExpenses =
        await this.creditCardRepository.checkHasExpenses(cardsToDelete);
      const cardsToSoftDelete = cardsToDelete.filter((id) =>
        cardIdsWithExpenses.has(id),
      );
      const cardsToHardDelete = cardsToDelete.filter(
        (id) => !cardIdsWithExpenses.has(id),
      );

      if (cardsToSoftDelete.length > 0) {
        await this.creditCardRepository.softDelete(cardsToSoftDelete, userId);
      }

      if (cardsToHardDelete.length > 0) {
        await this.creditCardRepository.hardDelete(cardsToHardDelete, userId);
      }
    }

    // Update/insert cards
    const existingCards = creditCards.filter(
      (card) => isValidUUID(card.id) && !card.id!.startsWith("temp-"),
    );
    const newCards = creditCards.filter(
      (card) => !isValidUUID(card.id) || card.id!.startsWith("temp-"),
    );

    if (existingCards.length > 0) {
      await this.creditCardRepository.bulkUpdate(
        userId,
        existingCards.map((card) => ({
          id: card.id!,
          name: card.name,
          dueDay: card.dueDay,
          ...(card.closingDay !== undefined
            ? { closingDay: card.closingDay }
            : {}),
          limit: card.limit,
          color: card.color,
        })),
      );
    }

    const createdCards = await Promise.all(
      newCards.map((card) =>
        this.creditCardRepository.create({
          userId,
          name: card.name,
          dueDay: card.dueDay,
          ...(card.closingDay !== undefined
            ? { closingDay: card.closingDay }
            : {}),
          limit: card.limit,
          color: card.color,
        }),
      ),
    );

    newCards.forEach((card, index) => {
      if (card.id) {
        tempIdToRealId.set(card.id, createdCards[index].id!);
      }
    });

    return tempIdToRealId;
  }
}
