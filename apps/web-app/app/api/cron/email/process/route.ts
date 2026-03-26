import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { emailQueueJobSchema, processEmailJob } from "@/app/api/cron/email/queue";

async function handler(request: Request) {
  const body = await request.json();
  const parsed = emailQueueJobSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid body",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const result = await processEmailJob(parsed.data);

  return NextResponse.json({
    ok: true,
    profileId: parsed.data.profileId,
    emailType: parsed.data.emailType,
    ...result,
  });
}

const isQStashConfigured =
  process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY;

export const POST = isQStashConfigured
  ? verifySignatureAppRouter(handler)
  : handler;
