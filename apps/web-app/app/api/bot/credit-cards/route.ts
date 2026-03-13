import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotInternalSecret } from "../_lib/internal-auth";
import { createBotRepositories } from "../_lib/repositories";

const querySchema = z.object({
  user_id: z.string().uuid(),
});

/**
 * GET /api/bot/credit-cards?user_id=UUID
 * Returns all active credit cards for a given user.
 * Used internally by the WhatsApp handler to resolve card mentions before
 * registering an expense.
 */
export async function GET(request: Request) {
  const unauthorized = requireBotInternalSecret(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const validation = querySchema.safeParse({
    user_id: searchParams.get("user_id"),
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid query: user_id must be a valid UUID" },
      { status: 400 },
    );
  }

  const { user_id: userId } = validation.data;
  const { supabase } = createBotRepositories();

  const { data: cards, error: queryError } = await supabase
    .from("credit_cards")
    .select("id, name, due_day, closing_day")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (queryError) {
    console.error("Bot credit-cards GET error:", queryError);
    return NextResponse.json(
      { error: "Failed to fetch credit cards" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    creditCards: (cards || []).map((card) => ({
      id: card.id,
      name: card.name,
      dueDay: card.due_day,
      closingDay: card.closing_day,
    })),
  });
}
