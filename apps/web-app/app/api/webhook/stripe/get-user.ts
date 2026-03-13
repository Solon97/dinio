import { SupabaseClient } from "@supabase/supabase-js";

export async function getProfile(
  supabase: SupabaseClient,
  userId: string | null,
  email: string,
) {
  if (userId) {
    return findProfileById(supabase, userId);
  }
  const existingProfile = await findProfileByEmail(supabase, email);
  if (existingProfile) {
    return existingProfile;
  }

  return null;
}

async function findProfileById(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return profile;
}

async function findProfileByEmail(supabase: SupabaseClient, email: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  return profile;
}
