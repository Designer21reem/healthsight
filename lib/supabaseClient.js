import { createClient } from "@supabase/supabase-js";

// ✅ ياخذ القيم من .env
// const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Anon Key");
}

console.log("🔧 Initializing Supabase client...");
console.log("🔗 URL:", supabaseUrl);
console.log("🔑 Key present:", supabaseKey ? "Yes" : "No");

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? localStorage : undefined,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey, // ✅ إضافة المفتاح في الهيدر لكل طلب
    },
  },
});

// اختبار الاتصال عند التحميل
if (typeof window !== "undefined") {
  console.log("✅ Supabase client initialized");
}
