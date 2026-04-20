-- Video-Beschreibungen (2-3 Sätze pro Video, generiert aus Transkripten)
CREATE TABLE IF NOT EXISTS public.video_descriptions (
  video_id text PRIMARY KEY,
  description text NOT NULL,
  generated_at timestamptz DEFAULT now()
);

ALTER TABLE public.video_descriptions ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten User dürfen lesen
CREATE POLICY "Authenticated users can read video descriptions"
  ON public.video_descriptions FOR SELECT
  TO authenticated
  USING (true);

-- Service Role kann alles (für Script)
CREATE POLICY "Service role full access"
  ON public.video_descriptions FOR ALL
  TO service_role
  USING (true);
