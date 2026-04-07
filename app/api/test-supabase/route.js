// app/api/test-supabase/route.js
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log("Testing Supabase connection...");
  console.log("URL exists:", !!supabaseUrl);
  console.log("Key exists:", !!supabaseKey);
  
  if (!supabaseUrl || !supabaseKey) {
    return Response.json({
      error: "Missing environment variables",
      url_exists: !!supabaseUrl,
      key_exists: !!supabaseKey
    }, { status: 500 });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // محاولة قراءة بسيطة للتحقق من الاتصال
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    return Response.json({
      success: !error,
      error: error?.message || null,
      url: supabaseUrl,
      connection: "OK"
    });
  } catch (err) {
    return Response.json({
      success: false,
      error: err.message,
      url: supabaseUrl
    }, { status: 500 });
  }
}