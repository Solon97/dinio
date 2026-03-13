import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { Client } from "@upstash/qstash";
import { createAdminClient } from "@/libs/supabase/admin";
import config from "@/config";

interface ActiveProfileRow {
  id: string;
  email: string | null;
}

async function handler(_request: Request) {
  const baseUrl = config.domainName;

  if (!baseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_DOMAIN_NAME is not set" },
      { status: 500 },
    );
  }

  const supabase = createAdminClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("has_access", true)
    .not("email", "is", null)
    .limit(100_000);

  if (error) {
    throw new Error(`Failed to fetch active users: ${error.message}`);
  }

  const activeUsers = (profiles as ActiveProfileRow[]).filter(
    (p): p is { id: string; email: string } => Boolean(p.email),
  );

  if (activeUsers.length === 0) {
    return NextResponse.json({ ok: true, enqueuedCount: 0 });
  }

  const client = new Client({
    token: process.env.QSTASH_TOKEN!,
    baseUrl: process.env.QSTASH_URL, // undefined in production, http://localhost:8080 in dev
  });
  const processUrl = `${baseUrl}/api/cron/notifications/process`;

  await client.batchJSON(
    activeUsers.map((user) => ({
      queueName: "daily_notifications",
      url: processUrl,
      body: { userId: user.id, email: user.email },
    })),
  );

  return NextResponse.json({ ok: true, enqueuedCount: activeUsers.length });
}

const isQStashConfigured =
  process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY;

export const POST = isQStashConfigured
  ? verifySignatureAppRouter(handler)
  : handler;
