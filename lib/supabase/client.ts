import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) return client

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      isSingleton: true,
      auth: {
        // Persist the session across page reloads / revisits via localStorage & cookies.
        persistSession: true,
        // Automatically refresh the JWT before it expires.
        autoRefreshToken: true,
        // Pick up an OAuth code/token from the URL fragment after redirect.
        detectSessionInUrl: true,
      },
    }
  )

  return client
}