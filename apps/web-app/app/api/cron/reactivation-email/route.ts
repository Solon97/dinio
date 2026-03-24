import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { createAdminClient } from "@/libs/supabase/admin";
import { sendEmail } from "@/libs/resend";
import config from "@/config";

interface ReactivationProfileRow {
  id: string;
  email: string;
}

const subject = "O que aconteceu?";

function extractFirstNameFromMetadata(metadata?: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const possibleName =
    record.first_name ??
    record.firstName ??
    record.name ??
    record.full_name ??
    record.fullName;

  if (typeof possibleName !== "string") {
    return null;
  }

  const normalizedName = possibleName.trim();

  if (!normalizedName) {
    return null;
  }

  return normalizedName.split(/\s+/)[0] ?? null;
}

function buildPlainTextMessage(firstName?: string): string {
  const greeting = firstName ? `Oi, ${firstName}, tudo bem?` : "Oi, tudo bem?";

  return [
    greeting,
    "",
    "Vi que você passou pelo Dinio mas não chegou a ativar o teste gratuito.",
    "",
    "Queria entender o que aconteceu — não precisa ser longo, uma linha já me ajuda.",
    "Foi o preço ?",
    "Uma dúvida sobre como funciona ?",
    "Algo no processo de cadastro ?",
    "",
    "Se você me contar o que travou e ainda tiver interesse no Dinio, te dou 30 dias de trial gratuito para experimentar sem pressa.",
    "Lembrando que a cobrança só começaria depois dos 30 dias, e você ainda teria mais 7 dias de garantia após a cobrança.",
    "",
    "Fico no aguardo, e de qualquer forma, obrigado por ter dado uma chance para o Dinio :)",
    "Solon",
    "Criador do Dinio",
  ].join("\n");
}

function toMinimalHtml(message: string): string {
  return message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
}

async function handler(_request: Request) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email")
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
      const authResult = await supabase.auth.admin
        .getUserById(profile.id)
        .catch((e): null => {
          console.error("Failed to fetch auth user metadata", {
            userId: profile.id,
          });
          return null;
        });
      const user = authResult?.data?.user ? authResult.data.user : null;
      const firstName = extractFirstNameFromMetadata(user?.user_metadata);
      const plainTextMessage = buildPlainTextMessage(firstName);
      const minimalHtmlMessage = toMinimalHtml(plainTextMessage);

      const delivery = await sendEmail({
        to: profile.email,
        subject,
        text: plainTextMessage,
        html: minimalHtmlMessage,
        replyTo: config.resend.replyToAdmin || config.resend.fromAdmin,
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
