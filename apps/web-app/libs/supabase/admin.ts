import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with service_role key for admin operations.
 * Use only in API routes that need to bypass RLS (Row Level Security).
 * Never expose this client to the frontend.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
