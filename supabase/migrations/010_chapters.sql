-- Add chapter hierarchy to modules
-- Modules can have optional chapters (sets in Skool), lessons go into chapters

CREATE TABLE IF NOT EXISTS public.module_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chapters_module ON public.module_chapters(module_id, sort_order);

-- Add chapter_id to module_videos (nullable — videos can be directly in module OR in a chapter)
ALTER TABLE public.module_videos
  ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.module_chapters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_videos_chapter ON public.module_videos(chapter_id, sort_order);

-- RLS
ALTER TABLE public.module_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read published chapters"
  ON public.module_chapters FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_published = true);

CREATE POLICY "Admins manage chapters"
  ON public.module_chapters FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- updated_at trigger
DROP TRIGGER IF EXISTS chapters_updated_at ON public.module_chapters;
CREATE TRIGGER chapters_updated_at BEFORE UPDATE ON public.module_chapters
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Fix: Einfach starten should be visible
UPDATE public.course_modules SET is_published = true WHERE slug = 'einfach-starten' AND is_published = false;
