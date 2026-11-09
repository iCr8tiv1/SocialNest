import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/config";

let cached: SupabaseClient | null = null;

/** Stateless client for data explicitly exposed by public RLS policies. */
export function publicDb(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  cached ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
