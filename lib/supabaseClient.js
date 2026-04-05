import { createClient } from "@supabase/supabase-js";

// ✅ ياخذ القيم من .env
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase URL or Anon Key");
}

console.log("🔧 Initializing Supabase client...");
console.log("🔗 URL:", SUPABASE_URL);
console.log("🔑 Key present:", SUPABASE_ANON_KEY ? "Yes" : "No");

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? localStorage : undefined,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
  },
});

// اختبار الاتصال عند التحميل
if (typeof window !== "undefined") {
  console.log("✅ Supabase client initialized");
}
