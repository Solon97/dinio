import { createClient } from "@/libs/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import config from "@/config";
export const dynamic = "force-dynamic";

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const redirectTarget =
    nextPath && nextPath.startsWith("/")
      ? `${requestUrl.origin}${nextPath}`
      : requestUrl.origin + config.auth.callbackUrl;

  return NextResponse.redirect(redirectTarget);
}
