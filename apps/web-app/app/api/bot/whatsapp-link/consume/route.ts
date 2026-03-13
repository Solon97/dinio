import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/libs/supabase/server";
import { createAdminClient } from "@/libs/supabase/admin";
import { createTokenHash, decryptPhoneNumber } from "../../_lib/phone-security";

const consumeTokenSchema = z.object({
  token: z.string().trim().min(20).max(200),
});

interface LinkTokenRow {
  id: string;
  phone_hash: string;
  phone_encrypted: string;
  expires_at: string;
}

async function notifyLinkSuccess(phoneNumber: string) {
  const handlerBaseUrl = process.env.WHATSAPP_HANDLER_BASE_URL;
  const internalSecret = process.env.BOT_INTERNAL_SECRET;

  if (!handlerBaseUrl || !internalSecret) {
    return;
  }

  try {
    await fetch(
      `${handlerBaseUrl.replace(/\/$/, "")}/internal/notify-link-success`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bot-secret": internalSecret,
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
      },
    );
  } catch (error) {
    console.error("Error notifying WhatsApp link success", error);
  }
}

/**
 * POST /api/bot/whatsapp-link/consume
 * Consumes a temporary WhatsApp link token and binds it to the authenticated user.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = consumeTokenSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid data", details: validation.error.flatten() },
      { status: 400 },
    );
  }

  const userSupabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await userSupabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenHash = createTokenHash(validation.data.token);
  const adminSupabase = createAdminClient();

  const { data: tokenRowData, error: tokenError } = await adminSupabase
    .from("whatsapp_link_tokens")
    .select("id, phone_hash, phone_encrypted, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (tokenError) {
    console.error("Error reading link token", tokenError);
    return NextResponse.json(
      { error: "Failed to process token" },
      { status: 500 },
    );
  }

  const tokenRow = tokenRowData as LinkTokenRow | null;

  if (!tokenRow) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const isExpired = new Date(tokenRow.expires_at).getTime() <= Date.now();
  if (isExpired) {
    await adminSupabase
      .from("whatsapp_link_tokens")
      .delete()
      .eq("id", tokenRow.id);

    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  const { data: existingLinkData, error: existingLinkError } =
    await adminSupabase
      .from("bot_whatsapp_links")
      .select("user_id")
      .eq("phone_hash", tokenRow.phone_hash)
      .maybeSingle();

  const existingLink = existingLinkData as { user_id: string } | null;

  if (existingLinkError) {
    console.error("Error checking existing phone link", existingLinkError);
    return NextResponse.json(
      { error: "Failed to link WhatsApp" },
      { status: 500 },
    );
  }

  if (existingLink && existingLink.user_id !== user.id) {
    return NextResponse.json(
      { error: "Phone already linked to another account" },
      { status: 409 },
    );
  }

  if (existingLink && existingLink.user_id === user.id) {
    await adminSupabase
      .from("whatsapp_link_tokens")
      .delete()
      .eq("phone_hash", tokenRow.phone_hash);

    return NextResponse.json({ linked: true });
  }

  const { data: existingUserLinkData, error: existingUserLinkError } =
    await adminSupabase
      .from("bot_whatsapp_links")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

  const existingUserLink = existingUserLinkData as { id: string } | null;

  if (existingUserLinkError) {
    console.error("Error checking existing user link", existingUserLinkError);
    return NextResponse.json(
      { error: "Failed to link WhatsApp" },
      { status: 500 },
    );
  }

  if (existingUserLink) {
    await adminSupabase
      .from("whatsapp_link_tokens")
      .delete()
      .eq("id", tokenRow.id);

    return NextResponse.json(
      { error: "User already linked to another phone" },
      { status: 409 },
    );
  }

  const { error: insertError } = await adminSupabase
    .from("bot_whatsapp_links")
    .insert({
      user_id: user.id,
      phone_hash: tokenRow.phone_hash,
      phone_encrypted: tokenRow.phone_encrypted,
    });

  if (insertError) {
    console.error("Error inserting WhatsApp link", insertError);
    return NextResponse.json(
      { error: "Failed to link WhatsApp" },
      { status: 500 },
    );
  }

  await adminSupabase
    .from("whatsapp_link_tokens")
    .delete()
    .eq("phone_hash", tokenRow.phone_hash);

  try {
    const phoneNumber = decryptPhoneNumber(tokenRow.phone_encrypted);
    await notifyLinkSuccess(phoneNumber);
  } catch (error) {
    console.error("Error preparing link success notification", error);
  }

  return NextResponse.json({ linked: true });
}
