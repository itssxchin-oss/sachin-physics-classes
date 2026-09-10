"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function enrollInBatch(batchId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      return { error: "You must be logged in to enroll in a batch." };
    }

    const { error } = await supabase
      .from("batch_enrollments")
      .insert({ student_id: user.id, batch_id: batchId });

    if (error) {
      // Unique constraint violation means already enrolled — treat as success
      if (error.code === "23505") {
        revalidatePath(`/batches/${batchId}`);
        revalidatePath("/batches");
        return {};
      }
      console.error("Batch enrollment insert error:", error);
      return { error: error.message };
    }

    revalidatePath(`/batches/${batchId}`);
    revalidatePath("/batches");
    revalidatePath("/student/my-batches");
    return {};
  } catch (err) {
    console.error("enrollInBatch unexpected error:", err);
    return { error: "Unexpected error. Please try again." };
  }
}
