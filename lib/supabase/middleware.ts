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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh the auth session so the cookie is kept alive.
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
