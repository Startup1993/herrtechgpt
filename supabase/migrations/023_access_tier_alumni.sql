-- 3-Tier Zugang:
--   basic   → Free User, keine Module freigeschaltet (kann sich Zugänge erkaufen)
--   alumni  → Ehemalige Community-Mitglieder, Classroom lebenslang frei
--   premium → Aktive KI Marketing Club Community, voller Zugriff

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_access_tier_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_access_tier_check
  CHECK (access_tier IN ('basic', 'alumni', 'premium'));
