// app/api/debug-env/route.js
export async function GET() {
  return Response.json({
    supabase_url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    api_url_exists: !!process.env.NEXT_PUBLIC_API_URL,
  });
}