-- Migration 004: Create doubt_messages table & doubt-images storage bucket

CREATE TABLE IF NOT EXISTS public.doubt_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'model')),
    message TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doubt_messages_student_id ON public.doubt_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_doubt_messages_created_at ON public.doubt_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.doubt_messages ENABLE ROW LEVEL SECURITY;

-- Policies for doubt_messages
CREATE POLICY "Students can view their own doubt messages"
ON public.doubt_messages FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own doubt messages"
ON public.doubt_messages FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete their own doubt messages"
ON public.doubt_messages FOR DELETE
USING (auth.uid() = student_id);

-- Storage bucket for doubt images
INSERT INTO storage.buckets (id, name, public)
VALUES ('doubt-images', 'doubt-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view doubt images"
ON storage.objects FOR SELECT
USING (bucket_id = 'doubt-images');

CREATE POLICY "Authenticated users can upload doubt images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'doubt-images' AND auth.role() = 'authenticated');
