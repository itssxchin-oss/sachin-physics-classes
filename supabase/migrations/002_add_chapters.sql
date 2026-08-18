-- ============================================================
-- Sachin Physics Classes — Add Chapters Table
-- Migration: 002_add_chapters.sql
-- ============================================================

-- ============================================================
-- TABLE: chapters
-- Optional grouping layer between a course and its lectures.
-- e.g. Course → Chapter "Mechanics" → Lecture "Newton's Laws"
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chapters (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  order_number INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (course_id, order_number)    -- no duplicate positions within a course
);

COMMENT ON TABLE  public.chapters               IS 'Optional grouping layer between a course and its lectures';
COMMENT ON COLUMN public.chapters.order_number  IS 'Display order within the course (1-based)';

CREATE INDEX IF NOT EXISTS chapters_course_id_idx ON public.chapters (course_id);

CREATE OR REPLACE TRIGGER chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read chapters (they belong to published courses)
CREATE POLICY "chapters: authenticated users can read"
  ON public.chapters
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only teachers can create chapters
CREATE POLICY "chapters: teachers can insert"
  ON public.chapters
  FOR INSERT
  WITH CHECK (public.is_teacher());

-- Only teachers can update chapters
CREATE POLICY "chapters: teachers can update"
  ON public.chapters
  FOR UPDATE
  USING  (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- Only teachers can delete chapters
CREATE POLICY "chapters: teachers can delete"
  ON public.chapters
  FOR DELETE
  USING (public.is_teacher());
