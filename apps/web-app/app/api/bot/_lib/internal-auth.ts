import { NextResponse } from "next/server";

/**
 * Verifies service-to-service secret header.
 * Expected header: x-bot-secret: <BOT_INTERNAL_SECRET>
 */
export function verifyBotInternalSecret(request: Request): boolean {
  const secret = process.env.BOT_INTERNAL_SECRET;
  if (!secret) {
    return false;
  }

  const providedSecret = request.headers.get("x-bot-secret");
  return providedSecret === secret;
}

export function requireBotInternalSecret(
  request: Request,
): NextResponse | null {
  if (!verifyBotInternalSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
