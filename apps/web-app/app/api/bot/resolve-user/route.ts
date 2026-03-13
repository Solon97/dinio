import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotInternalSecret } from "../_lib/internal-auth";
import { createBotRepositories } from "../_lib/repositories";
import { createPlainToken, createTokenHash } from "../_lib/phone-security";
import { resolveByPhoneNumber } from "../_lib/resolve-user";
import config from "@/config";

const resolveUserSchema = z.object({
  phone_number: z.string().trim().min(8).max(32),
});

const DEFAULT_TOKEN_TTL_MINUTES = 10;

function getTokenTtlMinutes(): number {
  const raw = process.env.WHATSAPP_LINK_TOKEN_TTL_MINUTES;
  if (!raw) {
    return DEFAULT_TOKEN_TTL_MINUTES;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 30) {
    return DEFAULT_TOKEN_TTL_MINUTES;
  }

  return parsed;
}

function getLinkBaseUrl(request: Request): string {
  const configuredBaseUrl = config.domainName;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

/**
 * POST /api/bot/resolve-user
 * Internal endpoint for the WhatsApp handler:
 * - resolves user by phone hash when linked
 * - issues a short-lived link token when not linked
 */
export async function POST(request: Request) {
  const unauthorized = requireBotInternalSecret(request);
  if (unauthorized) {
    return unauthorized;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = resolveUserSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid data", details: validation.error.flatten() },
      { status: 400 },
    );
  }

  const { supabase } = createBotRepositories();
  const resolveResult = await resolveByPhoneNumber(supabase, {
    phoneNumberRaw: validation.data.phone_number,
  });

  if ("response" in resolveResult) {
    return resolveResult.response;
  }

  if (resolveResult.linked) {
    return NextResponse.json({ linked: true, user_id: resolveResult.userId });
  }

  const unresolvedLink = resolveResult as {
    linked: false;
    phoneHash: string;
    phoneEncrypted: string;
  };

  const token = createPlainToken();
  const tokenHash = createTokenHash(token);
  const ttlMinutes = getTokenTtlMinutes();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();

  const { error: deleteExistingError } = await supabase
    .from("whatsapp_link_tokens")
    .delete()
    .eq("phone_hash", unresolvedLink.phoneHash);

  if (deleteExistingError) {
    console.error("Error clearing existing link tokens", deleteExistingError);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 },
    );
  }

  const { error: insertError } = await supabase
    .from("whatsapp_link_tokens")
    .insert({
      token_hash: tokenHash,
      phone_hash: unresolvedLink.phoneHash,
      phone_encrypted: unresolvedLink.phoneEncrypted,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error("Error storing link token", insertError);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 },
    );
  }

  const linkBaseUrl = getLinkBaseUrl(request);
  const link = `${linkBaseUrl}/whatsapp-link?token=${encodeURIComponent(token)}`;

  return NextResponse.json({ linked: false, link });
}
