-- Add skool_lesson_id to track original Skool lesson for future sync
ALTER TABLE public.module_videos
  ADD COLUMN IF NOT EXISTS skool_lesson_id TEXT;

CREATE INDEX IF NOT EXISTS idx_videos_skool_id ON public.module_videos(skool_lesson_id);

ALTER TABLE public.module_chapters
  ADD COLUMN IF NOT EXISTS skool_chapter_id TEXT;
