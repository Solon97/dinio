import { NextResponse } from "next/server";

/**
 * Verifies the bot API key from the Authorization header.
 * Expected format: Authorization: Bearer <BOT_API_SECRET>
 */
export function verifyBotApiKey(request: Request): boolean {
  const secret = process.env.BOT_API_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

/**
 * Returns an unauthorized response when BOT_API_SECRET validation fails.
 */
export function requireBotApiKey(request: Request): NextResponse | null {
  if (!verifyBotApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
