import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { createAdminClient } from "@/libs/supabase/admin";

/**
 * DELETE /api/bot/whatsapp-link/unlink
 * Removes the WhatsApp link for the authenticated user.
 */
export async function DELETE() {
  const userSupabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await userSupabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createAdminClient();

  const { error: deleteError } = await adminSupabase
    .from("bot_whatsapp_links")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Error unlinking WhatsApp", deleteError);
    return NextResponse.json(
      { error: "Failed to unlink WhatsApp" },
      { status: 500 },
    );
  }

  return NextResponse.json({ unlinked: true });
}
