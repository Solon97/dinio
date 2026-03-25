import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { createAdminClient } from "@/libs/supabase/admin";
import { sendReactivationEmail } from "@/libs/emails/reactivationEmail";

interface ReactivationProfileRow {
  id: string;
  email: string;
  name: string | null;
}

async function handler(_request: Request) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name")
    .eq("has_access", false)
    .is("reactivation_email_sent_at", null)
    .is("customer_id", null)
    .not("email", "is", null)
    .limit(500);

  if (error) {
    throw new Error(`Failed to fetch reactivation users: ${error.message}`);
  }

  const candidates = (data ?? []).filter(
    (row): row is ReactivationProfileRow =>
      typeof row.id === "string" &&
      typeof row.email === "string" &&
      row.email.length > 0,
  );

  let emailsSent = 0;
  let markedAsSent = 0;
  const failedUserIds: string[] = [];

  for (const profile of candidates) {
    try {
      const delivery = await sendReactivationEmail({
        to: profile.email,
        name: profile.name,
      });

      if (!delivery) {
        throw new Error(
          "Email delivery skipped because RESEND_API_KEY is not set",
        );
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ reactivation_email_sent_at: new Date().toISOString() })
        .eq("id", profile.id)
        .eq("has_access", false)
        .is("customer_id", null)
        .is("reactivation_email_sent_at", null);

      if (updateError) {
        throw new Error(
          `Failed to mark reactivation email as sent for ${profile.id}: ${updateError.message}`,
        );
      }

      emailsSent += 1;
      markedAsSent += 1;
    } catch (error) {
      failedUserIds.push(profile.id);
      console.error("Failed to process reactivation email", {
        userId: profile.id,
        error,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    selectedCount: candidates.length,
    emailsSent,
    markedAsSent,
    failedCount: failedUserIds.length,
    failedUserIds,
  });
}

const isQStashConfigured =
  process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY;

export const POST = isQStashConfigured
  ? verifySignatureAppRouter(handler)
  : handler;
