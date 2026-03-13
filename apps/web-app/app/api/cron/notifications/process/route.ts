import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { z } from "zod";
import { createAdminClient } from "@/libs/supabase/admin";
import { SupabaseNotificationRepository } from "@/app/api/notifications/infrastructure/repositories/supabase/notification";
import { ProcessUserDailyNotificationsUseCase } from "@/app/api/notifications/application/use-cases/ProcessUserDailyNotificationsUseCase";
import { fetchBudgetContextForUser } from "@/app/api/cron/notifications/fetchBudgetContext";

const bodySchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
});

async function handler(request: Request) {
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId, email } = parsed.data;
  const date = new Date().toISOString().slice(0, 10);

  const supabase = createAdminClient();

  const context = await fetchBudgetContextForUser(supabase, userId, date);

  const repository = new SupabaseNotificationRepository(supabase);
  const useCase = new ProcessUserDailyNotificationsUseCase(repository);

  const result = await useCase.execute({
    userId,
    email,
    dailyLimitCents: context.dailyLimitCents,
    agendaItems: context.agendaItems,
    date,
  });

  return NextResponse.json({ ok: true, userId, ...result });
}
const isQStashConfigured =
  process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY;

export const POST = isQStashConfigured
  ? verifySignatureAppRouter(handler)
  : handler;
