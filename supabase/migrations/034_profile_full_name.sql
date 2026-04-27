-- =============================================================================
-- profiles.full_name
-- =============================================================================
-- Bisher nur Email als User-Identifikator. Beim Skool-Sync und CSV-Import
-- haben wir Namen — die wollen wir behalten und in der Nutzerverwaltung
-- anzeigen können.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text;

CREATE INDEX IF NOT EXISTS idx_profiles_full_name_search
  ON public.profiles (lower(full_name)) WHERE full_name IS NOT NULL;
