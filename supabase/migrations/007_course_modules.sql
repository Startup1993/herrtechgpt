-- ═══════════════════════════════════════════════════════════
-- COURSE MODULES (Skool-Style Classroom)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  emoji TEXT DEFAULT '📚',
  thumbnail_url TEXT,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modules_sort ON public.course_modules(sort_order, created_at);

-- ═══════════════════════════════════════════════════════════
-- MODULE VIDEOS (Lessons within a module)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.module_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  wistia_hashed_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  duration_seconds INT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_module_videos_module ON public.module_videos(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_module_videos_wistia ON public.module_videos(wistia_hashed_id);

-- ═══════════════════════════════════════════════════════════
-- USER PROGRESS (Tracks watched videos per user)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.video_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.module_videos(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  watched_seconds INT DEFAULT 0,
  last_watched_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_video_progress_user ON public.video_progress(user_id, completed);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read published modules/videos
CREATE POLICY "Anyone authenticated can read published modules"
  ON public.course_modules FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_published = true);

CREATE POLICY "Anyone authenticated can read published videos"
  ON public.module_videos FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_published = true);

-- Only admins can manage modules/videos
CREATE POLICY "Admins manage modules"
  ON public.course_modules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins manage videos"
  ON public.module_videos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users manage own progress
CREATE POLICY "Users read own progress"
  ON public.video_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own progress"
  ON public.video_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress"
  ON public.video_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins see all progress
CREATE POLICY "Admins read all progress"
  ON public.video_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ═══════════════════════════════════════════════════════════
-- SEED: 19 Skool-Module
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.course_modules (title, slug, emoji, sort_order, description) VALUES
  ('Einfach starten - Der rote Faden!', 'einfach-starten', '🚀', 1, 'Der rote Faden zum Beginn — wie du sofort mit KI durchstartest, ohne dich in Möglichkeiten zu verlieren.'),
  ('KI Marketing Course', 'ki-marketing-course', '🎯', 2, 'Die komplette KI Marketing Masterclass — vom Intro bis zur Umsetzung.'),
  ('KI Content Erstellung', 'ki-content-erstellung', '✍️', 3, 'Wie du sensationellen Content mit KI erstellst — Skripte, Hooks, Captions.'),
  ('Seedance 2.0', 'seedance', '💃', 4, 'Trends erkennen und mit Seedance virale Inhalte produzieren.'),
  ('Claude', 'claude', '🤖', 5, 'Alles rund um Claude — Prompting, Workflows, fortgeschrittene Techniken.'),
  ('KI Vertrieb', 'ki-vertrieb', '💼', 6, 'KI im Vertrieb — Lead-Generierung, Outreach, Sales-Automation.'),
  ('KI Telefonie', 'ki-telefonie', '📞', 7, 'KI-Voice-Agents für Telefonie und Customer Support.'),
  ('Rechtliche Grenzen von KI', 'rechtliche-grenzen', '⚖️', 8, 'Was du rechtlich beachten musst beim Einsatz von KI.'),
  ('Viralen Content finden & Automatisierung', 'viraler-content', '🔥', 9, 'Wie du virale Inhalte findest und ihre Erstellung automatisierst.'),
  ('Viral mit Veo3', 'veo3', '🎬', 10, 'Mit Veo3 virale Videos erstellen — die nächste Generation der KI-Videos.'),
  ('Super Viral mit SORA 2', 'sora-2', '🌟', 11, 'SORA 2 für maximale Reichweite — fortgeschrittene Video-Generierung.'),
  ('KI Agenten & Automatisierung', 'ki-agenten', '⚙️', 12, 'KI-Agenten bauen, n8n & Make Workflows, Automatisierung für mehr Effizienz.'),
  ('Zur Prompt Legende werden', 'prompt-legende', '🧙', 13, 'DIE ZUKUNFT! Werde zum Prompt Engineer mit fortgeschrittenen Techniken.'),
  ('KI SEO', 'ki-seo', '🔍', 14, 'SEO neu gedacht — wie du KI nutzt um in Google und KI-Suchen zu ranken.'),
  ('KI Toolboard', 'ki-toolboard', '🧰', 15, 'Die wichtigsten KI-Tools im Überblick — was du brauchst und was nicht.'),
  ('KI Musik', 'ki-musik', '🎵', 16, 'Musik erstellen mit KI — Suno, Udio und mehr.'),
  ('Passives Einkommen mit KI', 'passives-einkommen', '💰', 17, 'Wie du mit KI passive Einkommensströme aufbaust.'),
  ('Community Wünsche', 'community', '💬', 18, 'Themen aus der Community — Inhalte basierend auf deinen Anfragen.'),
  ('Aufzeichnungen der Live Calls', 'live-calls', '📡', 19, 'Alle bisherigen Live Calls zum Nachschauen — geballtes Wissen aus den Sessions.')
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: updated_at auto-update
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS modules_updated_at ON public.course_modules;
CREATE TRIGGER modules_updated_at BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS module_videos_updated_at ON public.module_videos;
CREATE TRIGGER module_videos_updated_at BEFORE UPDATE ON public.module_videos
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
