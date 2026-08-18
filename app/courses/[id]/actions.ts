"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function enrollInCourse(courseId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      return { error: "You must be logged in to enroll." };
    }

    // Insert enrollment row (student_id + course_id; enrolled_at defaults to NOW())
    const { error } = await supabase
      .from("enrollments")
      .insert({ student_id: user.id, course_id: courseId });

    if (error) {
      // Unique constraint violation means already enrolled — treat as success
      if (error.code === "23505") {
        revalidatePath(`/courses/${courseId}`);
        return {};
      }
      console.error("Enrollment insert error:", error);
      return { error: error.message };
    }

    // Revalidate the course detail page so the Server Component re-fetches enrollment state
    revalidatePath(`/courses/${courseId}`);
    return {};
  } catch (err) {
    console.error("enrollInCourse unexpected error:", err);
    return { error: "Unexpected error. Please try again." };
  }
}
