-- ============================================================
-- Sachin Physics Classes — Add Batches and Subjects Tables
-- Migration: 006_add_batches_and_subjects.sql
-- ============================================================

-- ============================================================
-- TABLE: batches
-- Top-level Batch structure (e.g. Class 10th Batch, Class 12th JEE)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.batches (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  price         NUMERIC     NOT NULL DEFAULT 0,
  teacher_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.batches               IS 'Top-level batches (e.g. Class 10th Batch, Class 12th JEE)';
COMMENT ON COLUMN public.batches.teacher_id    IS 'Teacher who created the batch';

CREATE INDEX IF NOT EXISTS batches_teacher_id_idx ON public.batches (teacher_id);

CREATE OR REPLACE TRIGGER batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- TABLE: subjects
-- Subjects inside a batch (e.g. Physics, Chemistry, Maths)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id     UUID        NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  order_number INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (batch_id, order_number)
);

COMMENT ON TABLE  public.subjects               IS 'Subjects inside a batch';
COMMENT ON COLUMN public.subjects.order_number  IS 'Display order within the batch (1-based)';

CREATE INDEX IF NOT EXISTS subjects_batch_id_idx ON public.subjects (batch_id);

CREATE OR REPLACE TRIGGER subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- ALTER TABLE: chapters
-- Add subject_id column linking chapters to subjects
-- and make course_id optional
-- ============================================================
ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS subject_id UUID
    REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.chapters
  ALTER COLUMN course_id DROP NOT NULL;

COMMENT ON COLUMN public.chapters.subject_id IS 'Subject grouping for the chapter (Batch -> Subject -> Chapter -> Lecture)';

CREATE INDEX IF NOT EXISTS chapters_subject_id_idx ON public.chapters (subject_id);


-- ── RLS Policies ─────────────────────────────────────────────
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batches: authenticated users can read"
  ON public.batches
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "batches: teachers can insert"
  ON public.batches
  FOR INSERT
  WITH CHECK (public.is_teacher());

CREATE POLICY "batches: teachers can update"
  ON public.batches
  FOR UPDATE
  USING  (public.is_teacher())
  WITH CHECK (public.is_teacher());

CREATE POLICY "batches: teachers can delete"
  ON public.batches
  FOR DELETE
  USING (public.is_teacher());


ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects: authenticated users can read"
  ON public.subjects
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "subjects: teachers can insert"
  ON public.subjects
  FOR INSERT
  WITH CHECK (public.is_teacher());

CREATE POLICY "subjects: teachers can update"
  ON public.subjects
  FOR UPDATE
  USING  (public.is_teacher())
  WITH CHECK (public.is_teacher());

CREATE POLICY "subjects: teachers can delete"
  ON public.subjects
  FOR DELETE
  USING (public.is_teacher());
