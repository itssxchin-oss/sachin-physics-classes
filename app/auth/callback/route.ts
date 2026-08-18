import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TEACHER_EMAIL } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Redirect based on email.
        // The handle_new_user database trigger auto-creates a profile row.
        if (user.email === TEACHER_EMAIL) {
          return NextResponse.redirect(`${origin}/teacher/dashboard`);
        } else {
          return NextResponse.redirect(`${origin}/courses`);
        }
      }
    }
  }

  // Fallback to login with error
  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
