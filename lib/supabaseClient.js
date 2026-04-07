import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Single instance - no re-creation, no Proxy conflicts
let _client = null;
let _initialized = false;

function getClient() {
  // Don't create client during build time on server
  if (typeof window === "undefined") {
    return null;
  }
  
  if (_client) return _client;
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Supabase ENV vars missing");
    return null;
  }

  // Clean any stale locks before creating new client
  try {
    const lockKey = `sb-${SUPABASE_URL.replace(/https?:\/\//, '').replace(/\./g, '-')}-auth-token`;
    if (localStorage.getItem(lockKey)) {
      localStorage.removeItem(lockKey);
    }
  } catch(e) {}

  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: {
        getItem: (key) => {
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, value);
          } catch {}
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key);
          } catch {}
        },
      },
    },
  });

  _initialized = true;
  return _client;
}

// Export a direct client instance (not a Proxy)
export const supabase = getClient();

// Helper to check if supabase is ready
export const isSupabaseReady = () => _client !== null && _initialized;