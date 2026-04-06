import { createClient } from "@supabase/supabase-js";

// ✅ جلب القيم من env
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ❗ لا نوقف التطبيق، بس نحذر
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase ENV variables");
}

// logs (اختياري)
console.log("🔧 Initializing Supabase client...");
console.log("🔗 URL:", SUPABASE_URL);
console.log("🔑 Key present:", SUPABASE_ANON_KEY ? "Yes" : "No");

// ✅ إنشاء Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage:
      typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

// ✅ تأكيد بالمتصفح فقط
if (typeof window !== "undefined") {
  console.log("✅ Supabase client initialized");
}