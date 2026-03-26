import { Client } from "@upstash/qstash";
import { z } from "zod";
import config from "@/config";
import { createAdminClient } from "@/libs/supabase/admin";
import { sendReactivationEmail } from "@/libs/emails/reactivationEmail";
import { sendWelcomeTrialEmail } from "@/libs/emails/welcomeTrialEmail";

const QUEUE_NAME = "emails";
export const MAX_EMAILS_PER_RUN = 500;

export const emailTypeSchema = z.enum(["welcome", "reactivation"]);
export type EmailType = z.infer<typeof emailTypeSchema>;

export const emailQueueJobSchema = z.object({
  profileId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  emailType: emailTypeSchema,
});

export type EmailQueueJob = z.infer<typeof emailQueueJobSchema>;

interface EmailCandidate {
  id: string;
  email: string;
  name: string | null;
}

function createQStashClient() {
  const token = process.env.QSTASH_TOKEN;

  if (!token) {
    throw new Error("QSTASH_TOKEN is not set");
  }

  return new Client({
    token,
    baseUrl: process.env.QSTASH_URL,
  });
}

function getProcessUrl() {
  const baseUrl = config.domainName;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_DOMAIN_NAME is not set");
  }

  return `${baseUrl}/api/cron/email/process`;
}

export async function fetchEmailCandidates(
  emailType: EmailType,
): Promise<EmailCandidate[]> {
  const supabase = createAdminClient();

  if (emailType === "welcome") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("has_access", true)
      .is("welcome_email_sent_at", null)
      .not("email", "is", null)
      .limit(MAX_EMAILS_PER_RUN);

    if (error) {
      throw new Error(
        `Failed to fetch welcome email candidates: ${error.message}`,
      );
    }

    return (data ?? []).filter(
      (row): row is EmailCandidate =>
        typeof row.id === "string" &&
        typeof row.email === "string" &&
        row.email.length > 0,
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name")
    .eq("has_access", false)
    .is("reactivation_email_sent_at", null)
    .is("customer_id", null)
    .not("email", "is", null)
    .limit(MAX_EMAILS_PER_RUN);

  if (error) {
    throw new Error(`Failed to fetch reactivation users: ${error.message}`);
  }

  return (data ?? []).filter(
    (row): row is EmailCandidate =>
      typeof row.id === "string" &&
      typeof row.email === "string" &&
      row.email.length > 0,
  );
}

export async function dispatchEmailType(emailType: EmailType) {
  const candidates = await fetchEmailCandidates(emailType);

  if (candidates.length === 0) {
    return {
      emailType,
      selectedCount: 0,
      acceptedCount: 0,
      deduplicatedCount: 0,
      queueName: QUEUE_NAME,
    };
  }

  const processUrl = getProcessUrl();
  const client = createQStashClient();
  const dateKey = new Date().toISOString().slice(0, 10);

  const results = await client.batchJSON(
    candidates.map((candidate) => ({
      queueName: QUEUE_NAME,
      url: processUrl,
      deduplicationId: `${emailType}-${candidate.id}-${dateKey}`,
      body: {
        profileId: candidate.id,
        email: candidate.email,
        name: candidate.name,
        emailType,
      },
    })),
  );

  const deduplicatedCount = results.filter((result) => result.deduplicated)
    .length;

  return {
    emailType,
    selectedCount: candidates.length,
    acceptedCount: results.length - deduplicatedCount,
    deduplicatedCount,
    queueName: QUEUE_NAME,
  };
}

async function isStillEligible(profileId: string, emailType: EmailType) {
  const supabase = createAdminClient();

  if (emailType === "welcome") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .eq("has_access", true)
      .is("welcome_email_sent_at", null)
      .limit(1);

    if (error) {
      throw new Error(`Failed to validate welcome eligibility: ${error.message}`);
    }

    return (data?.length ?? 0) > 0;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("has_access", false)
    .is("customer_id", null)
    .is("reactivation_email_sent_at", null)
    .limit(1);

  if (error) {
    throw new Error(`Failed to validate reactivation eligibility: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

async function markAsSent(profileId: string, emailType: EmailType) {
  const supabase = createAdminClient();
  const sentAt = new Date().toISOString();

  if (emailType === "welcome") {
    const { data, error } = await supabase
      .from("profiles")
      .update({ welcome_email_sent_at: sentAt })
      .eq("id", profileId)
      .eq("has_access", true)
      .is("welcome_email_sent_at", null)
      .select("id");

    if (error) {
      throw new Error(`Failed to mark welcome email as sent: ${error.message}`);
    }

    return (data?.length ?? 0) > 0;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ reactivation_email_sent_at: sentAt })
    .eq("id", profileId)
    .eq("has_access", false)
    .is("customer_id", null)
    .is("reactivation_email_sent_at", null)
    .select("id");

  if (error) {
    throw new Error(`Failed to mark reactivation email as sent: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

async function sendEmailByType(job: EmailQueueJob) {
  if (job.emailType === "welcome") {
    return sendWelcomeTrialEmail({
      to: job.email,
      name: job.name,
    });
  }

  return sendReactivationEmail({
    to: job.email,
    name: job.name,
  });
}

export async function processEmailJob(job: EmailQueueJob) {
  const eligible = await isStillEligible(job.profileId, job.emailType);

  if (!eligible) {
    return {
      status: "skipped" as const,
      reason: "already_processed_or_ineligible",
      markedAsSent: false,
    };
  }

  const delivery = await sendEmailByType(job);

  if (!delivery) {
    throw new Error("Email delivery skipped because RESEND_API_KEY is not set");
  }

  const markedAsSent = await markAsSent(job.profileId, job.emailType);

  if (!markedAsSent) {
    return {
      status: "skipped" as const,
      reason: "already_processed_or_ineligible",
      markedAsSent: false,
    };
  }

  return {
    status: "sent" as const,
    reason: null as string | null,
    markedAsSent: true,
  };
}
