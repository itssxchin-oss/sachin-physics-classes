-- ============================================================
-- Sachin Physics Classes — Seed Data (local dev only)
-- Run AFTER 001_initial_schema.sql
-- ============================================================
-- NOTE: These INSERT statements bypass auth.users, so they are
-- only useful for local Supabase dev (supabase start).
-- In production, create users through the Auth API.
-- ============================================================

-- ── Demo profiles ────────────────────────────────────────────
INSERT INTO public.profiles (id, email, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'sachin@physics.in',  'Sachin Kumar',  'teacher'),
  ('00000000-0000-0000-0000-000000000002', 'amit@student.in',    'Amit Sharma',   'student'),
  ('00000000-0000-0000-0000-000000000003', 'priya@student.in',   'Priya Gupta',   'student')
ON CONFLICT (id) DO NOTHING;


-- ── Demo courses ─────────────────────────────────────────────
INSERT INTO public.courses (id, title, description, teacher_id, is_published) VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Mechanics & Motion',
    'Complete coverage of kinematics, Newton''s laws, work-energy-power, and rotational dynamics for JEE/NEET.',
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Electrostatics',
    'Coulomb''s law, electric field, potential, capacitors — everything from basics to JEE Advanced level.',
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Modern Physics',
    'Photoelectric effect, de Broglie, Bohr model, nuclear physics. Currently under development.',
    '00000000-0000-0000-0000-000000000001',
    FALSE   -- draft, not visible to students yet
  )
ON CONFLICT (id) DO NOTHING;


-- ── Demo lectures ─────────────────────────────────────────────
INSERT INTO public.lectures (id, course_id, title, description, youtube_url, order_number) VALUES
  -- Mechanics
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Introduction to Kinematics',       'Distance, displacement, speed, velocity, acceleration',
   'https://www.youtube.com/watch?v=example1', 1),

  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Equations of Motion',              'Deriving the three equations of motion with examples',
   'https://www.youtube.com/watch?v=example2', 2),

  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Newton''s Laws of Motion',         'All three laws with JEE-level problem solving',
   'https://www.youtube.com/watch?v=example3', 3),

  -- Electrostatics
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002',
   'Coulomb''s Law',                   'Force between point charges; principle of superposition',
   'https://www.youtube.com/watch?v=example4', 1),

  ('bbbbbbbb-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000002',
   'Electric Field & Field Lines',     'Definition, calculation for various charge distributions',
   'https://www.youtube.com/watch?v=example5', 2)
ON CONFLICT (id) DO NOTHING;


-- ── Demo enrollments ──────────────────────────────────────────
INSERT INTO public.enrollments (student_id, course_id) VALUES
  ('00000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001'),  -- Amit → Mechanics
  ('00000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002'),  -- Amit → Electrostatics
  ('00000000-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001')   -- Priya → Mechanics
ON CONFLICT (student_id, course_id) DO NOTHING;


-- ── Demo progress ─────────────────────────────────────────────
INSERT INTO public.progress (student_id, lecture_id, completed, completed_at) VALUES
  -- Amit completed first two mechanics lectures
  ('00000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', TRUE,  NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', TRUE,  NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000003', FALSE, NULL),

  -- Priya completed first mechanics lecture
  ('00000000-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', TRUE,  NOW() - INTERVAL '1 day')
ON CONFLICT (student_id, lecture_id) DO NOTHING;
