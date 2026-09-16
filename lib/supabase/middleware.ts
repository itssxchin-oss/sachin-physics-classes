/**
 * Middleware Supabase Client & Route Protection Guard
 *
 * Protects:
 * - /student/* : Only accessible to logged-in users
 * - /teacher/* : Only accessible to logged-in users
 *
 * Redirects:
 * - Unauthenticated users visiting protected routes -> /login
 * - Already authenticated users visiting /login or /signup -> Dashboard
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { TEACHER_EMAIL } from "@/lib/constants";

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

    // Refresh auth session & validate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    const isProtectedRoute =
      pathname.startsWith("/student") || pathname.startsWith("/teacher");

    const isAuthRoute =
      pathname === "/login" || pathname === "/signup";

    // 1. If unauthenticated and accessing a protected route -> redirect to /login
    if (!user && isProtectedRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }

    // 2. If authenticated and accessing login/signup -> redirect to appropriate dashboard
    if (user && isAuthRoute) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname =
        user.email === TEACHER_EMAIL ? "/teacher/dashboard" : "/student/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
  } catch (err) {
    console.warn("Supabase middleware auth check warning:", err);
  }

  return supabaseResponse;
}
