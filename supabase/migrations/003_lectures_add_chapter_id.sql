-- ============================================================
-- Sachin Physics Classes — Add chapter_id to lectures
-- Migration: 003_lectures_add_chapter_id.sql
--
-- Run this in the Supabase SQL Editor AFTER 002_add_chapters.sql
-- ============================================================

-- 1. Add the chapter_id foreign key column (nullable initially so
--    existing rows are not broken).
ALTER TABLE public.lectures
  ADD COLUMN IF NOT EXISTS chapter_id UUID
    REFERENCES public.chapters(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.lectures.chapter_id IS
  'Optional chapter grouping within a course. NULL = lecture belongs directly to the course.';

CREATE INDEX IF NOT EXISTS lectures_chapter_id_idx ON public.lectures (chapter_id);

-- 2. (Optional) Once all existing lectures have been manually assigned to a
--    chapter you can enforce NOT NULL:
--
--    ALTER TABLE public.lectures ALTER COLUMN chapter_id SET NOT NULL;
--
--    Do NOT run this line now — it will fail if any existing lecture row
--    still has chapter_id = NULL.
