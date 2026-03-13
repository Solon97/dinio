import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const metaUserIdSchema = z.string().trim().min(1).max(128);

export type BotUserResolveResult =
  | { userId: string }
  | { response: NextResponse };

/**
 * Resolves an internal user ID from a WhatsApp Meta user ID.
 */
export async function resolveUserIdFromMetaUserId(
  supabase: SupabaseClient,
  metaUserIdRaw: unknown,
): Promise<BotUserResolveResult> {
  const validation = metaUserIdSchema.safeParse(metaUserIdRaw);

  if (!validation.success) {
    return {
      response: NextResponse.json(
        { error: "Invalid metaUserId", details: validation.error.flatten() },
        { status: 400 },
      ),
    };
  }

  const metaUserId = validation.data;

  const { data, error } = await supabase
    .from("bot_whatsapp_links")
    .select("user_id")
    .eq("meta_user_id", metaUserId)
    .maybeSingle();

  if (error) {
    console.error("Bot WhatsApp link lookup error:", error);
    return {
      response: NextResponse.json(
        { error: "Failed to resolve WhatsApp link" },
        { status: 500 },
      ),
    };
  }

  if (!data?.user_id) {
    return {
      response: NextResponse.json(
        {
          error: "WhatsApp account not linked",
          code: "WHATSAPP_NOT_LINKED",
        },
        { status: 404 },
      ),
    };
  }

  return { userId: data.user_id as string };
}
