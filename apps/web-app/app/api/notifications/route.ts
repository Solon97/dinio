import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseNotificationRepository } from "./infrastructure/repositories/supabase/notification";
import { ScheduleNotificationUseCase } from "./application/use-cases/ScheduleNotificationUseCase";
import { CreateNotificationInput } from "./domain/repositories/INotificationRepository";

const createNotificationSchema = z.object({
  type: z.enum([
    "budget_alert",
    "payment_reminder",
    "weekly_summary",
    "general",
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  deliveryChannels: z
    .array(z.enum(["in_app", "email"]))
    .min(1)
    .default(["in_app"]),
  recipientEmail: z.string().email().nullable().optional(),
  referenceId: z.string().nullable().optional(),
});

const MAX_NOTIFICATIONS_LIMIT = 100;
const DEFAULT_NOTIFICATIONS_LIMIT = 50;

/**
 * GET /api/notifications
 * Returns notifications for the authenticated user.
 * Query params:
 *   unread=true  — only unread notifications
 *   limit=N      — max items to return (default 50)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limitParam = parseInt(searchParams.get("limit") || "");
    const limit = !isNaN(limitParam)
      ? Math.min(limitParam, MAX_NOTIFICATIONS_LIMIT)
      : DEFAULT_NOTIFICATIONS_LIMIT;

    const repo = new SupabaseNotificationRepository(supabase);
    const [notifications, unreadCount] = await Promise.all([
      repo.findByUser(user.id, { unreadOnly, limit }),
      repo.countUnread(user.id),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/notifications
 * Creates a new notification for the authenticated user.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createNotificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const repo = new SupabaseNotificationRepository(supabase);
    const useCase = new ScheduleNotificationUseCase(repo);

    const notification = await useCase.execute({
      userId: user.id,
      ...validation.data,
    } as CreateNotificationInput);

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
