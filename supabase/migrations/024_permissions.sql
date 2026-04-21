-- Feature-Berechtigungs-Matrix: pro Tier × Feature ein State
CREATE TABLE IF NOT EXISTS public.feature_permissions (
  tier text NOT NULL CHECK (tier IN ('basic','alumni','premium')),
  feature text NOT NULL CHECK (feature IN ('classroom','chat','toolbox')),
  state text NOT NULL CHECK (state IN ('open','coming_soon','community','paid')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tier, feature)
);

-- Upsell-Copy pro Tier (Marketing-Club-CTA Texte)
CREATE TABLE IF NOT EXISTS public.tier_upsell_copy (
  tier text PRIMARY KEY CHECK (tier IN ('basic','alumni','premium')),
  heading text NOT NULL,
  intro text NOT NULL,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_label text NOT NULL DEFAULT 'Jetzt beitreten',
  cta_coming_soon boolean NOT NULL DEFAULT true,
  cta_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seeds: entsprechen den bisher hardcoded Werten
INSERT INTO public.feature_permissions (tier, feature, state) VALUES
  ('basic',   'classroom', 'community'),
  ('basic',   'chat',      'community'),
  ('basic',   'toolbox',   'coming_soon'),
  ('alumni',  'classroom', 'open'),
  ('alumni',  'chat',      'community'),
  ('alumni',  'toolbox',   'coming_soon'),
  ('premium', 'classroom', 'open'),
  ('premium', 'chat',      'open'),
  ('premium', 'toolbox',   'coming_soon')
ON CONFLICT (tier, feature) DO NOTHING;

INSERT INTO public.tier_upsell_copy (tier, heading, intro, benefits, cta_label, cta_coming_soon, cta_url) VALUES
  ('basic',
   'Alles freischalten — im KI Marketing Club',
   'Werde Teil der Community und bekomme Zugriff auf alle KI-Agenten, Lernvideos, Live-Calls und exklusive Inhalte.',
   '["Alle 6 KI-Agenten mit Expertenwissen","Zugriff auf alle Lernvideos & Kurse","Wöchentliche Live-Calls mit Herr Tech","Exklusive Prompts & Templates"]'::jsonb,
   'Jetzt beitreten', true, 'https://www.skool.com/herr-tech'),
  ('alumni',
   'Komm zurück in den KI Marketing Club',
   'Als Alumni hast du weiterhin Zugriff auf alle Lernvideos. Reaktiviere deine Mitgliedschaft für alle KI-Agenten, aktuelle Live-Calls und neue Inhalte.',
   '["Alle 6 KI-Agenten freischalten","Wöchentliche Live-Calls mit Herr Tech","Neueste Kurse & Updates","Community-Austausch & Feedback"]'::jsonb,
   'Mitgliedschaft reaktivieren', true, 'https://www.skool.com/herr-tech'),
  ('premium',
   'KI Marketing Club',
   'Du bist aktives Mitglied — voller Zugriff auf alle Inhalte.',
   '[]'::jsonb,
   'Zur Community', false, 'https://www.skool.com/herr-tech')
ON CONFLICT (tier) DO NOTHING;
