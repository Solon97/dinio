import { createClient } from "@/libs/supabase/server";

export interface UserData {
  id: string;
  email: string | null;
  wasSubscriber: boolean;
  name: string | null;
  avatarUrl: string | null;
  displayName: string;
  isPremium: boolean;
  whatsappLinked: boolean;
  onboardingSetupCompleted: boolean;
  onboardingDailyCompleted: boolean;
  onboardingMonthlyCompleted: boolean;
  onboardingYearlyCompleted: boolean;
  createdAt: string;
  hasAnyExpense: boolean;
}

/**
 * Server-side function to get complete user data
 * Used by both API routes and server components
 */
export async function getUserData(): Promise<UserData | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Query profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "name, email, has_access, customer_id, onboarding_setup_completed, onboarding_daily_completed, onboarding_monthly_completed, onboarding_yearly_completed",
    )
    .eq("id", user.id)
    .single();

  // Check if user has a WhatsApp link (uses RLS — authenticated users can read own records)
  const { data: whatsappLink } = await supabase
    .from("bot_whatsapp_links")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { count: expenseCount } = await supabase
    .from("daily_expenses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Compute display name with fallback logic
  const profileName = profile?.name || null;
  let displayName = "Usuário";
  if (profileName) {
    displayName = profileName;
  } else if (user.email) {
    const emailName = user.email.split("@")[0];
    displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }

  return {
    id: user.id,
    email: profile?.email || user.email,
    isPremium: profile?.has_access || false,
    wasSubscriber: !!profile?.customer_id || false,
    name: profileName,
    avatarUrl: user.user_metadata?.avatar_url || null,
    displayName: displayName,
    whatsappLinked: !!whatsappLink,
    onboardingSetupCompleted: profile?.onboarding_setup_completed ?? false,
    onboardingDailyCompleted: profile?.onboarding_daily_completed ?? false,
    onboardingMonthlyCompleted: profile?.onboarding_monthly_completed ?? false,
    onboardingYearlyCompleted: profile?.onboarding_yearly_completed ?? false,
    createdAt: user.created_at,
    hasAnyExpense: (expenseCount ?? 0) > 0,
  };
}
