
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cjvellxinmydvogodplf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdmVsbHhpbm15ZHZvZ29kcGxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDU2MzMsImV4cCI6MjA4MDAyMTYzM30.J_mRJKVShKcPZMiJiG_Ca3zjXpX_qurOa464I1dVfpw'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase URL or Anon Key')
}

console.log('🔧 Initializing Supabase client...')
console.log('🔗 URL:', SUPABASE_URL)
console.log('🔑 Key present:', SUPABASE_ANON_KEY ? 'Yes' : 'No')

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    }
  }
})

// اختبار الاتصال عند التحميل
if (typeof window !== 'undefined') {
  console.log('✅ Supabase client initialized')
}