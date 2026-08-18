/**
 * Next.js Middleware
 *
 * Runs on matching requests BEFORE reaching pages or API routes.
 * Protects:
 * - /student/* : Only accessible to logged-in users with role="student"
 * - /teacher/* : Only accessible to logged-in users with role="teacher"
 *
 * Redirects unauthenticated users to /login.
 */
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico   (favicon)
     * - Public images & static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
