import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { dispatchEmailType } from "@/app/api/cron/email/queue";

async function handler(_request: Request) {
  const result = await dispatchEmailType("reactivation");

  return NextResponse.json({
    ok: true,
    ...result,
  });
}

const isQStashConfigured =
  process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY;

export const POST = isQStashConfigured
  ? verifySignatureAppRouter(handler)
  : handler;