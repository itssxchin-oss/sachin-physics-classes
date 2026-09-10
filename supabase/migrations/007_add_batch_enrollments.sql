-- ============================================================
-- Sachin Physics Classes — Batch Enrollments Table
-- Migration: 007_add_batch_enrollments.sql
-- ============================================================

-- ============================================================
-- TABLE: batch_enrollments
-- Tracks which students are enrolled in which batches.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.batch_enrollments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  batch_id     UUID        NOT NULL REFERENCES public.batches(id)  ON DELETE CASCADE,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (student_id, batch_id)  -- a student can only enrol once per batch
);

COMMENT ON TABLE public.batch_enrollments IS 'Tracks which students are enrolled in which batches';

CREATE INDEX IF NOT EXISTS batch_enrollments_student_id_idx ON public.batch_enrollments (student_id);
CREATE INDEX IF NOT EXISTS batch_enrollments_batch_id_idx  ON public.batch_enrollments (batch_id);


-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;

-- Students can see their own enrollments
CREATE POLICY "batch_enrollments: students can read own"
  ON public.batch_enrollments
  FOR SELECT
  USING (auth.uid() = student_id);

-- Students can enroll themselves
CREATE POLICY "batch_enrollments: students can insert own"
  ON public.batch_enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Teachers can read all enrollments
CREATE POLICY "batch_enrollments: teachers can read all"
  ON public.batch_enrollments
  FOR SELECT
  USING (public.is_teacher());

-- Teachers can delete enrollments (unenroll students)
CREATE POLICY "batch_enrollments: teachers can delete"
  ON public.batch_enrollments
  FOR DELETE
  USING (public.is_teacher());
