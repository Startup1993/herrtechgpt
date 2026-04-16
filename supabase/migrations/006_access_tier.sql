-- 2-Tier Zugang: basic (nur Videos) vs premium (voller KI-Workspace)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_tier text NOT NULL DEFAULT 'basic'
  CHECK (access_tier IN ('basic', 'premium'));

-- Alle bestehenden User auf premium setzen (sind aktive Community-Mitglieder)
UPDATE public.profiles SET access_tier = 'premium' WHERE access_tier = 'basic';
