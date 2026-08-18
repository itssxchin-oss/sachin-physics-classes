-- Migration 005: Add doubt_sessions table and link doubt_messages to sessions

-- 1. Create doubt_sessions table
CREATE TABLE IF NOT EXISTS public.doubt_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doubt_sessions_student_id ON public.doubt_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_doubt_sessions_updated_at ON public.doubt_sessions(updated_at);

-- Enable Row Level Security
ALTER TABLE public.doubt_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own doubt sessions"
ON public.doubt_sessions FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own doubt sessions"
ON public.doubt_sessions FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own doubt sessions"
ON public.doubt_sessions FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own doubt sessions"
ON public.doubt_sessions FOR DELETE
USING (auth.uid() = student_id);

-- 2. Add session_id column to doubt_messages (nullable — old rows have no session)
ALTER TABLE public.doubt_messages
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.doubt_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_doubt_messages_session_id ON public.doubt_messages(session_id);

-- 3. Function to auto-update doubt_sessions.updated_at on message insert
CREATE OR REPLACE FUNCTION update_doubt_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_id IS NOT NULL THEN
        UPDATE public.doubt_sessions
        SET updated_at = NOW()
        WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_doubt_session_ts ON public.doubt_messages;

CREATE TRIGGER trg_update_doubt_session_ts
AFTER INSERT ON public.doubt_messages
FOR EACH ROW
EXECUTE FUNCTION update_doubt_session_timestamp();
