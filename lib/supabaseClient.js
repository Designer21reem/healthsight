import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Lazy singleton — created once on first use, never at module load time
let _client = null;

function getClient() {
  if (_client) return _client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // During Next.js build some pages are pre-rendered without env vars.
    // Return a dummy object so imports don't crash — real calls will fail
    // gracefully at runtime instead of breaking the build.
    if (typeof window === "undefined") {
      // Server/build environment — return null-safe stub
      return null;
    }
    console.error(
      "❌ Supabase ENV vars missing. " +
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel."
    );
    return null;
  }

  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession:    true,
      autoRefreshToken:  true,
      detectSessionInUrl: true,
      storage:
        typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });

  return _client;
}

// Export a Proxy so every `supabase.xxx()` call goes through getClient()
// This means the real client is never created at import time (build-safe).
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getClient();
      if (!client) {
        // Return a no-op function so SSR pages don't crash
        return () => Promise.resolve({ data: null, error: { message: "Supabase not initialised" } });
      }
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);