import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";
import { SupabaseNotificationRepository } from "../infrastructure/repositories/supabase/notification";

/**
 * PATCH /api/notifications/[id]
 * Marks a notification as read for the authenticated user.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 },
      );
    }

    const repo = new SupabaseNotificationRepository(supabase);
    await repo.markAsRead(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
