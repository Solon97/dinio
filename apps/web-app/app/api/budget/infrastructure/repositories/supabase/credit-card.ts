import { SupabaseClient } from "@supabase/supabase-js";
import { CreditCard } from "../../../domain/entities/BudgetConfig";
import { ICreditCardRepository } from "../../../domain/repositories/IBudgetRepository";
import { getFallbackClosingDay } from "@/libs/creditCardInvoice";

export class SupabaseCreditCardRepository implements ICreditCardRepository {
  constructor(private supabase: SupabaseClient) {}

  async bulkUpdate(
    userId: string,
    cards: {
      id: string;
      name: string;
      dueDay: number;
      closingDay?: number;
      limit: number;
      color: string;
    }[],
  ): Promise<void> {
    if (cards.length === 0) return;

    const rows = cards.map((card) => ({
      id: card.id,
      user_id: userId,
      name: card.name,
      due_day: card.dueDay,
      closing_day: card.closingDay ?? getFallbackClosingDay(card.dueDay),
      credit_limit: card.limit,
      color: card.color,
    }));

    const { error } = await this.supabase
      .from("credit_cards")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      throw new Error(`Failed to bulk update credit cards: ${error.message}`);
    }
  }

  async findActiveByUser(userId: string): Promise<CreditCard[]> {
    const { data, error } = await this.supabase
      .from("credit_cards")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`Failed to fetch credit cards: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      dueDay: row.due_day,
      closingDay: row.closing_day,
      limit: Number(row.credit_limit),
      color: row.color,
    }));
  }

  async findById(id: string, userId: string): Promise<CreditCard | null> {
    const { data, error } = await this.supabase
      .from("credit_cards")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch credit card: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      dueDay: data.due_day,
      closingDay: data.closing_day,
      limit: Number(data.credit_limit),
      color: data.color,
    };
  }

  async create(card: Omit<CreditCard, "id">): Promise<CreditCard> {
    const { data, error } = await this.supabase
      .from("credit_cards")
      .insert({
        user_id: card.userId,
        name: card.name,
        due_day: card.dueDay,
        closing_day: card.closingDay ?? getFallbackClosingDay(card.dueDay),
        credit_limit: card.limit,
        color: card.color,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create credit card: ${error?.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      dueDay: data.due_day,
      closingDay: data.closing_day,
      limit: Number(data.credit_limit),
      color: data.color,
    };
  }

  async update(
    id: string,
    userId: string,
    card: Partial<CreditCard>,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (card.name !== undefined) updateData.name = card.name;
    if (card.dueDay !== undefined) {
      updateData.due_day = card.dueDay;
    }
    if (card.closingDay !== undefined) updateData.closing_day = card.closingDay;
    if (card.limit !== undefined) updateData.credit_limit = card.limit;
    if (card.color !== undefined) updateData.color = card.color;

    const { error } = await this.supabase
      .from("credit_cards")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update credit card: ${error.message}`);
    }
  }

  async softDelete(ids: string[], userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("credit_cards")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to soft delete credit cards: ${error.message}`);
    }
  }

  async hardDelete(ids: string[], userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("credit_cards")
      .delete()
      .in("id", ids)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to hard delete credit cards: ${error.message}`);
    }
  }

  async checkHasExpenses(cardIds: string[]): Promise<Set<string>> {
    const { data, error } = await this.supabase
      .from("fixed_expenses")
      .select("credit_card_id")
      .in("credit_card_id", cardIds)
      .not("credit_card_id", "is", null)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`Failed to check card expenses: ${error.message}`);
    }

    return new Set(
      (data || []).map((e) => e.credit_card_id).filter(Boolean) as string[],
    );
  }
}
