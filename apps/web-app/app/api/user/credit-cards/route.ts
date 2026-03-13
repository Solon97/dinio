import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/user/credit-cards
 * Returns all active credit cards for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: cards, error: queryError } = await supabase
      .from("credit_cards")
      .select("id, name, due_day, closing_day, credit_limit, color")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (queryError) {
      console.error("Error fetching credit cards:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch credit cards" },
        { status: 500 },
      );
    }

    const response = (cards || []).map((card) => ({
      id: card.id,
      name: card.name,
      dueDay: card.due_day,
      closingDay: card.closing_day,
      limit: Number(card.credit_limit),
      color: card.color,
    }));

    return NextResponse.json({ creditCards: response });
  } catch (error) {
    console.error("Credit cards GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
