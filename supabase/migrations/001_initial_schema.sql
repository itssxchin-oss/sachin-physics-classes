-- ============================================================
-- Sachin Physics Classes — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
-- pgcrypto gives us gen_random_uuid() for all primary keys.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ── Custom Types ─────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('student', 'teacher');


-- ============================================================
-- TABLE: profiles
-- One row per authenticated user; extends auth.users.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT        NOT NULL DEFAULT '',
  role        user_role   NOT NULL DEFAULT 'student',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.profiles              IS 'One profile per auth user. Role determines access level.';
COMMENT ON COLUMN public.profiles.role         IS 'student = learner, teacher = admin / content creator';
COMMENT ON COLUMN public.profiles.avatar_url   IS 'Optional Supabase Storage URL for profile picture';


-- ── Trigger: auto-create profile on signup ───────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'student'
    )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- TABLE: courses
-- Top-level physics course catalogue.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  description     TEXT        NOT NULL DEFAULT '',
  thumbnail_url   TEXT,
  teacher_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_published    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.courses               IS 'Top-level physics course catalogue';
COMMENT ON COLUMN public.courses.teacher_id    IS 'Teacher who owns / created the course';
COMMENT ON COLUMN public.courses.is_published  IS 'Only published courses are visible to students';

CREATE INDEX IF NOT EXISTS courses_teacher_id_idx ON public.courses (teacher_id);


-- ── Trigger: keep updated_at in sync ─────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- TABLE: lectures
-- Individual video lessons inside a course.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lectures (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL DEFAULT '',
  youtube_url   TEXT        NOT NULL,
  order_number  INTEGER     NOT NULL DEFAULT 0,
  duration_mins INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (course_id, order_number)        -- no duplicate positions in a course
);

COMMENT ON TABLE  public.lectures              IS 'Individual video lectures inside a course';
COMMENT ON COLUMN public.lectures.youtube_url  IS 'Full YouTube embed/watch URL';
COMMENT ON COLUMN public.lectures.order_number IS 'Display order within the course (1-based)';

CREATE INDEX IF NOT EXISTS lectures_course_id_idx ON public.lectures (course_id);

CREATE OR REPLACE TRIGGER lectures_updated_at
  BEFORE UPDATE ON public.lectures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- TABLE: enrollments
-- Which students are enrolled in which courses.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id    UUID        NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (student_id, course_id)          -- a student can only enrol once per course
);

COMMENT ON TABLE public.enrollments IS 'Tracks which students are enrolled in which courses';

CREATE INDEX IF NOT EXISTS enrollments_student_id_idx ON public.enrollments (student_id);
CREATE INDEX IF NOT EXISTS enrollments_course_id_idx  ON public.enrollments (course_id);


-- ============================================================
-- TABLE: progress
-- Per-student, per-lecture completion tracking.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.progress (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lecture_id    UUID        NOT NULL REFERENCES public.lectures(id)  ON DELETE CASCADE,
  completed     BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (student_id, lecture_id)         -- one progress record per student per lecture
);

COMMENT ON TABLE  public.progress             IS 'Tracks per-student lecture completion';
COMMENT ON COLUMN public.progress.completed   IS 'TRUE once the student marks the lecture as done';
COMMENT ON COLUMN public.progress.completed_at IS 'Timestamp when completed was first set TRUE';

CREATE INDEX IF NOT EXISTS progress_student_id_idx  ON public.progress (student_id);
CREATE INDEX IF NOT EXISTS progress_lecture_id_idx  ON public.progress (lecture_id);

-- Auto-set completed_at when completed flips to TRUE
CREATE OR REPLACE FUNCTION public.set_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    NEW.completed_at = NOW();
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER progress_completed_at
  BEFORE UPDATE ON public.progress
  FOR EACH ROW EXECUTE FUNCTION public.set_completed_at();


-- ============================================================
-- HELPER FUNCTION: is_teacher()
-- Returns TRUE if the currently authenticated user has role='teacher'.
-- Used inside RLS policies to avoid repeated sub-selects.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.profiles
    WHERE  id   = auth.uid()
    AND    role = 'teacher'
  );
$$;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- ── Enable RLS on every table ────────────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress    ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────
-- profiles policies
-- ────────────────────────────────────────────────────────────

-- Any authenticated user can read their own profile
CREATE POLICY "profiles: users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Teachers can read ALL profiles (for student management)
CREATE POLICY "profiles: teachers can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_teacher());

-- Users can update only their own profile
CREATE POLICY "profiles: users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Inserts are handled by the handle_new_user() trigger (SECURITY DEFINER)
-- so no INSERT policy is needed for regular users.

-- Teachers can update any profile (e.g. promote a student to teacher)
CREATE POLICY "profiles: teachers can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING  (public.is_teacher())
  WITH CHECK (public.is_teacher());


-- ────────────────────────────────────────────────────────────
-- courses policies
-- ────────────────────────────────────────────────────────────

-- Authenticated students can read published courses
CREATE POLICY "courses: students can read published courses"
  ON public.courses
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_published = TRUE);

-- Teachers can read ALL courses (including drafts)
CREATE POLICY "courses: teachers can read all courses"
  ON public.courses
  FOR SELECT
  USING (public.is_teacher());

-- Only teachers can create courses
CREATE POLICY "courses: teachers can insert"
  ON public.courses
  FOR INSERT
  WITH CHECK (public.is_teacher());

-- Only teachers can update courses
CREATE POLICY "courses: teachers can update"
  ON public.courses
  FOR UPDATE
  USING  (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- Only teachers can delete courses
CREATE POLICY "courses: teachers can delete"
  ON public.courses
  FOR DELETE
  USING (public.is_teacher());


-- ────────────────────────────────────────────────────────────
-- lectures policies
-- ────────────────────────────────────────────────────────────

-- Students can read lectures only for courses they are enrolled in
CREATE POLICY "lectures: enrolled students can read"
  ON public.lectures
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM   public.enrollments e
      JOIN   public.courses     c ON c.id = e.course_id
      WHERE  e.student_id  = auth.uid()
      AND    e.course_id   = lectures.course_id
      AND    c.is_published = TRUE
    )
  );

-- Teachers can read all lectures
CREATE POLICY "lectures: teachers can read all"
  ON public.lectures
  FOR SELECT
  USING (public.is_teacher());

-- Only teachers can create lectures
CREATE POLICY "lectures: teachers can insert"
  ON public.lectures
  FOR INSERT
  WITH CHECK (public.is_teacher());

-- Only teachers can update lectures
CREATE POLICY "lectures: teachers can update"
  ON public.lectures
  FOR UPDATE
  USING  (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- Only teachers can delete lectures
CREATE POLICY "lectures: teachers can delete"
  ON public.lectures
  FOR DELETE
  USING (public.is_teacher());


-- ────────────────────────────────────────────────────────────
-- enrollments policies
-- ────────────────────────────────────────────────────────────

-- Students can read only their own enrollments
CREATE POLICY "enrollments: students can read own"
  ON public.enrollments
  FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers can read all enrollments
CREATE POLICY "enrollments: teachers can read all"
  ON public.enrollments
  FOR SELECT
  USING (public.is_teacher());

-- Students can enrol themselves in a published course
CREATE POLICY "enrollments: students can enrol themselves"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.is_published = TRUE
    )
  );

-- Teachers can enrol any student in any course
CREATE POLICY "enrollments: teachers can insert"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (public.is_teacher());

-- Teachers can delete enrollments (e.g. unenrol a student)
CREATE POLICY "enrollments: teachers can delete"
  ON public.enrollments
  FOR DELETE
  USING (public.is_teacher());

-- Students can unenrol themselves
CREATE POLICY "enrollments: students can delete own"
  ON public.enrollments
  FOR DELETE
  USING (auth.uid() = student_id);


-- ────────────────────────────────────────────────────────────
-- progress policies
-- ────────────────────────────────────────────────────────────

-- Students can read only their own progress
CREATE POLICY "progress: students can read own"
  ON public.progress
  FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers can read all students' progress
CREATE POLICY "progress: teachers can read all"
  ON public.progress
  FOR SELECT
  USING (public.is_teacher());

-- Students can insert their own progress records
CREATE POLICY "progress: students can insert own"
  ON public.progress
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update only their own progress (mark lectures complete)
CREATE POLICY "progress: students can update own"
  ON public.progress
  FOR UPDATE
  USING  (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Teachers can insert/update progress on behalf of any student
CREATE POLICY "progress: teachers can insert"
  ON public.progress
  FOR INSERT
  WITH CHECK (public.is_teacher());

CREATE POLICY "progress: teachers can update"
  ON public.progress
  FOR UPDATE
  USING  (public.is_teacher())
  WITH CHECK (public.is_teacher());


-- ============================================================
-- VIEWS (convenience, inherits RLS from base tables)
-- ============================================================

-- Student's enrolled courses with their overall progress %
CREATE OR REPLACE VIEW public.student_course_progress AS
SELECT
  e.student_id,
  c.id            AS course_id,
  c.title         AS course_title,
  c.thumbnail_url,
  e.enrolled_at,
  COUNT(l.id)                                                          AS total_lectures,
  COUNT(p.id) FILTER (WHERE p.completed = TRUE)                        AS completed_lectures,
  ROUND(
    100.0 * COUNT(p.id) FILTER (WHERE p.completed = TRUE)
    / NULLIF(COUNT(l.id), 0)
  )::INTEGER                                                           AS progress_percent
FROM public.enrollments e
JOIN public.courses     c  ON c.id = e.course_id
LEFT JOIN public.lectures l ON l.course_id = c.id
LEFT JOIN public.progress  p
  ON p.lecture_id = l.id
  AND p.student_id = e.student_id
GROUP BY e.student_id, c.id, c.title, c.thumbnail_url, e.enrolled_at;

COMMENT ON VIEW public.student_course_progress IS
  'Convenience view: per-student, per-course progress percentage';
