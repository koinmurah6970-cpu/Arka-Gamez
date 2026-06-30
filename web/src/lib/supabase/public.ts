import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Plain client (no cookies/session) for fully-public, cacheable reads --
// safe to use inside `unstable_cache` since it doesn't touch any
// per-request API (unlike the cookie-bound server client).
export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
