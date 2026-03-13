import { ICreditCardInvoiceRepository } from "../../domain/repositories/IBudgetRepository";

export class SyncInvoicesUseCase {
  constructor(
    private creditCardInvoiceRepository: ICreditCardInvoiceRepository,
  ) {}

  async execute(
    userId: string,
    creditCardIds: string[],
    dueMonthId: number,
  ): Promise<void> {
    const activeCardIds = creditCardIds.filter(Boolean);
    if (activeCardIds.length === 0) return;

    await this.creditCardInvoiceRepository.upsertForMonth(
      userId,
      activeCardIds,
      dueMonthId,
    );
  }
}
