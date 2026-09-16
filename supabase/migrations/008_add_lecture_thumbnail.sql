-- Migration: 008_add_lecture_thumbnail.sql
-- Description: Add thumbnail_url column to lectures table for custom video thumbnails.

ALTER TABLE public.lectures
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN public.lectures.thumbnail_url IS 'Custom thumbnail image URL for the lecture video';
