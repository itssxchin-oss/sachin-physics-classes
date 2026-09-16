import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Persist the session across page reloads / revisits via localStorage.
        persistSession: true,
        // Automatically refresh the JWT before it expires (sliding window).
        autoRefreshToken: true,
        // Pick up an OAuth code/token from the URL fragment after redirect.
        detectSessionInUrl: true,
      },
    }
  )
}