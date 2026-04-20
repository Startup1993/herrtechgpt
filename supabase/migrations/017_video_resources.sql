-- Resources attached to lessons (PDFs, links, downloads, images)
-- Mirrors Skool's "Resources" section under each lesson

CREATE TABLE IF NOT EXISTS public.module_video_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.module_videos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'link', -- 'pdf' | 'link' | 'image' | 'video' | 'download'
  sort_order INT DEFAULT 0,
  skool_resource_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resources_video ON public.module_video_resources(video_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resources_skool ON public.module_video_resources(skool_resource_id);

ALTER TABLE public.module_video_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read resources"
  ON public.module_video_resources FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage resources"
  ON public.module_video_resources FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP TRIGGER IF EXISTS resources_updated_at ON public.module_video_resources;
CREATE TRIGGER resources_updated_at BEFORE UPDATE ON public.module_video_resources
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
