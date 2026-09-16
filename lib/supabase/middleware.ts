/**
 * Middleware Supabase Client & Route Protection Guard
 *
 * Protects:
 * - /student/* : Only accessible to logged-in users
 * - /teacher/* : Only accessible to logged-in users
 *
 * Role / email checks are intentionally handled at the page level,
 * not here. Middleware only enforces authentication.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

function getValidatedSupabaseCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const validUrl =
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : "https://xyzplaceholder.supabase.co";

  const validKey =
    key.length > 10
      ? key
      : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

  return { supabaseUrl: validUrl, supabaseAnonKey: validKey };
}

export async function updateSession(request: NextRequest) {
  // Start with a base response that forwards the request.
  // IMPORTANT: This single object is mutated by setAll below; do NOT
  // reassign it inside the cookie callbacks or the written cookies will
  // be lost on the next iteration.
  let supabaseResponse = NextResponse.next({ request });

  const { supabaseUrl, supabaseAnonKey } = getValidatedSupabaseCredentials();

  try {
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // 1. Write cookies onto the forwarded request so downstream
            //    Server Components see them in the same request cycle.
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            // 2. Re-create the response with the mutated request so the
            //    updated cookies are included in its cookie jar.
            supabaseResponse = NextResponse.next({ request });
            // 3. Also write them explicitly onto the response so the
            //    browser receives Set-Cookie headers and persists the
            //    refreshed session.
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // IMPORTANT: always call getUser() (not getSession()) so that the JWT
    // is validated server-side and the session cookie is refreshed on
    // every request, preventing premature expiry.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    const isProtectedRoute =
      pathname.startsWith("/student") || pathname.startsWith("/teacher");

    // If no logged-in user and route is protected, redirect to /login.
    if (!user && isProtectedRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
  } catch (err) {
    console.warn("Supabase middleware auth check warning:", err);
  }

  return supabaseResponse;
}
