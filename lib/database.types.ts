/**
 * TypeScript types generated from the Supabase database schema.
 *
 * Keep this file in sync with supabase/migrations/001_initial_schema.sql
 * or regenerate it automatically with:
 *   npx supabase gen types typescript --project-id <your-project-ref> > lib/database.types.ts
 */

// ── Enums ────────────────────────────────────────────────────
export type UserRole = "student" | "teacher";


// ── Table row types ──────────────────────────────────────────

export interface Profile {
  id: string;              // UUID — matches auth.users.id
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;      // ISO 8601 timestamptz
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  teacher_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lecture {
  id: string;
  course_id: string;
  chapter_id: string | null;
  title: string;
  description: string;
  youtube_url: string;
  order_number: number;
  duration_mins: number | null;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_number: number;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  id: string;
  student_id: string;
  lecture_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}


// ── Insert / Update types (omit auto-generated fields) ───────

export type ProfileInsert = Omit<Profile, "created_at">;
export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at">>;

export type CourseInsert = Omit<Course, "id" | "created_at" | "updated_at">;
export type CourseUpdate  = Partial<Omit<Course, "id" | "created_at" | "updated_at">>;

export type LectureInsert = Omit<Lecture, "id" | "created_at" | "updated_at">;
export type LectureUpdate  = Partial<Omit<Lecture, "id" | "created_at" | "updated_at">>;

export type EnrollmentInsert = Omit<Enrollment, "id" | "enrolled_at">;

export type ChapterInsert = Omit<Chapter, "id" | "created_at" | "updated_at">;
export type ChapterUpdate  = Partial<Omit<Chapter, "id" | "created_at" | "updated_at">>;

export type ProgressInsert = Omit<Progress, "id" | "created_at" | "updated_at">;
export type ProgressUpdate  = Partial<Pick<Progress, "completed" | "completed_at">>;


export interface LectureMaterial {
  id: string;
  lecture_id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export type LectureMaterialInsert = Omit<LectureMaterial, "id" | "created_at">;
export type LectureMaterialUpdate = Partial<Omit<LectureMaterial, "id" | "created_at">>;

// ── View type ────────────────────────────────────────────────

export interface StudentCourseProgress {
  student_id: string;
  course_id: string;
  course_title: string;
  thumbnail_url: string | null;
  enrolled_at: string;
  total_lectures: number;
  completed_lectures: number;
  progress_percent: number;
}


// ── Supabase Database definition ──────────────────────────────
// Used to type the Supabase client:  createClient<Database>()

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row:    Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      courses: {
        Row:    Course;
        Insert: CourseInsert;
        Update: CourseUpdate;
        Relationships: [];
      };
      lectures: {
        Row:    Lecture;
        Insert: LectureInsert;
        Update: LectureUpdate;
        Relationships: [];
      };
      lecture_materials: {
        Row:    LectureMaterial;
        Insert: LectureMaterialInsert;
        Update: LectureMaterialUpdate;
        Relationships: [];
      };
      enrollments: {
        Row:    Enrollment;
        Insert: EnrollmentInsert;
        Update: Partial<EnrollmentInsert>;
        Relationships: [];
      };
      progress: {
        Row:    Progress;
        Insert: ProgressInsert;
        Update: ProgressUpdate;
        Relationships: [];
      };
      chapters: {
        Row:    Chapter;
        Insert: ChapterInsert;
        Update: ChapterUpdate;
        Relationships: [];
      };
    };
    Views: {
      student_course_progress: {
        Row: StudentCourseProgress;
        Relationships: [];
      };
    };
    Functions: {
      is_teacher: {
        Args:    Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
    };
  };
}
