import { NextRequest, NextResponse } from "next/server";
import { getUserData } from "@/libs/userService";
import { createClient } from "@/libs/supabase/server";
import { z } from "zod";

export async function GET() {
  try {
    const userData = await getUserData();

    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

const profilePatchSchema = z
  .object({
    onboarding_setup_completed: z.boolean().optional(),
    onboarding_daily_completed: z.boolean().optional(),
    onboarding_monthly_completed: z.boolean().optional(),
    onboarding_yearly_completed: z.boolean().optional(),
  })
  .strict();

export async function PATCH(request: NextRequest) {
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
    const parsed = profilePatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error patching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
