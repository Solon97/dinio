import { SupabaseClient } from "@supabase/supabase-js";
import { CreditCardInvoice } from "../../../domain/entities/BudgetConfig";
import { ICreditCardInvoiceRepository } from "../../../domain/repositories/IBudgetRepository";
import { InvoiceExpenseItem, InvoiceWithDetails } from "@/types/budget";

export class SupabaseCreditCardInvoiceRepository implements ICreditCardInvoiceRepository {
  constructor(private supabase: SupabaseClient) {}

  async upsertForMonth(
    userId: string,
    creditCardIds: string[],
    dueMonthId: number,
  ): Promise<void> {
    if (creditCardIds.length === 0) return;

    const rows = creditCardIds.map((creditCardId) => ({
      user_id: userId,
      credit_card_id: creditCardId,
      due_month_id: dueMonthId,
      is_paid: false,
    }));

    const { error } = await this.supabase
      .from("credit_card_invoices")
      .upsert(rows, {
        onConflict: "credit_card_id,due_month_id",
        ignoreDuplicates: true,
      });

    if (error) {
      throw new Error(`Failed to upsert invoices: ${error.message}`);
    }
  }

  async findByUserAndMonth(
    userId: string,
    dueMonthId: number,
  ): Promise<InvoiceWithDetails[]> {
    const { data: invoices, error: invoicesError } = await this.supabase
      .from("credit_card_invoices")
      .select(
        `
        id,
        is_paid,
        due_month_id,
        credit_cards (
          id,
          name,
          color,
          closing_day,
          due_day
        )
      `,
      )
      .eq("user_id", userId)
      .eq("due_month_id", dueMonthId);

    if (invoicesError) {
      throw new Error(`Failed to fetch invoices: ${invoicesError.message}`);
    }

    if (!invoices || invoices.length === 0) return [];

    type CardShape = {
      id: string;
      name: string;
      color: string;
      closing_day: number;
      due_day: number;
    };

    const cardIds = invoices.map(
      (inv) => (inv.credit_cards as unknown as CardShape).id,
    );

    const [dailyTotals, fixedTotals] = await Promise.all([
      this.aggregateDailyExpenses(userId, cardIds, dueMonthId),
      this.aggregateFixedExpenses(userId, cardIds, dueMonthId),
    ]);

    return invoices.map((inv) => {
      const card = inv.credit_cards as unknown as CardShape;
      const dailySum = dailyTotals.get(card.id) ?? 0;
      const fixedSum = fixedTotals.get(card.id) ?? 0;

      return {
        id: inv.id as string,
        isPaid: inv.is_paid as boolean,
        dueMonthId: inv.due_month_id as number,
        creditCard: {
          id: card.id,
          name: card.name,
          color: card.color,
          closingDay: card.closing_day,
          dueDay: card.due_day,
        },
        totalAmount: dailySum + fixedSum,
      };
    });
  }

  async findExpensesByCardAndMonth(
    userId: string,
    creditCardId: string,
    dueMonthId: number,
  ): Promise<InvoiceExpenseItem[]> {
    const [dailyResult, fixedResult] = await Promise.all([
      this.supabase
        .from("daily_expenses")
        .select("id, amount, description, category, date")
        .eq("user_id", userId)
        .eq("credit_card_id", creditCardId)
        .eq("invoice_due_month_id", dueMonthId),
      this.supabase
        .from("fixed_expenses")
        .select("id, amount, name, due_day")
        .eq("user_id", userId)
        .eq("credit_card_id", creditCardId)
        .eq("month_id", dueMonthId)
        .is("deleted_at", null),
    ]);

    if (dailyResult.error) {
      throw new Error(
        `Failed to fetch daily expenses: ${dailyResult.error.message}`,
      );
    }
    if (fixedResult.error) {
      throw new Error(
        `Failed to fetch fixed expenses: ${fixedResult.error.message}`,
      );
    }

    const dailyItems: InvoiceExpenseItem[] = (dailyResult.data ?? []).map(
      (row: {
        id: string;
        amount: number;
        description: string;
        category: string;
        date: string;
      }): InvoiceExpenseItem => ({
        id: row.id,
        amount: Number(row.amount),
        description: row.description,
        category: row.category as string | null,
        date: row.date as string | null,
        dueDay: null as number | null,
        type: "daily" as const,
      }),
    );

    const fixedItems: InvoiceExpenseItem[] = (fixedResult.data ?? []).map(
      (row: {
        id: string;
        amount: number;
        name: string;
        due_day: number | null;
      }): InvoiceExpenseItem => ({
        id: row.id,
        amount: Number(row.amount),
        description: row.name,
        category: null as string | null,
        date: null as string | null,
        dueDay: row.due_day as number | null,
        type: "fixed" as const,
      }),
    );

    return [...dailyItems, ...fixedItems];
  }

  async markAsPaid(
    id: string,
    userId: string,
    isPaid: boolean,
  ): Promise<CreditCardInvoice> {
    const { data, error } = await this.supabase
      .from("credit_card_invoices")
      .update({ is_paid: isPaid })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to mark invoice as paid: ${error?.message ?? "not found"}`,
      );
    }

    return {
      id: data.id,
      userId: data.user_id,
      creditCardId: data.credit_card_id,
      dueMonthId: data.due_month_id,
      isPaid: data.is_paid,
    };
  }

  private async aggregateDailyExpenses(
    userId: string,
    cardIds: string[],
    dueMonthId: number,
  ): Promise<Map<string, number>> {
    const { data, error } = await this.supabase
      .from("daily_expenses")
      .select("credit_card_id, amount")
      .eq("user_id", userId)
      .in("credit_card_id", cardIds)
      .eq("invoice_due_month_id", dueMonthId);

    if (error) {
      throw new Error(`Failed to aggregate daily expenses: ${error.message}`);
    }

    const totals = new Map<string, number>();
    for (const row of data ?? []) {
      const current = totals.get(row.credit_card_id) ?? 0;
      totals.set(row.credit_card_id, current + Number(row.amount));
    }
    return totals;
  }

  private async aggregateFixedExpenses(
    userId: string,
    cardIds: string[],
    dueMonthId: number,
  ): Promise<Map<string, number>> {
    const { data, error } = await this.supabase
      .from("fixed_expenses")
      .select("credit_card_id, amount")
      .eq("user_id", userId)
      .in("credit_card_id", cardIds)
      .eq("month_id", dueMonthId)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`Failed to aggregate fixed expenses: ${error.message}`);
    }

    const totals = new Map<string, number>();
    for (const row of data ?? []) {
      const current = totals.get(row.credit_card_id) ?? 0;
      totals.set(row.credit_card_id, current + Number(row.amount));
    }
    return totals;
  }
}
