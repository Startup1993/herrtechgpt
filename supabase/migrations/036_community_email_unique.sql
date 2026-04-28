-- =============================================================================
-- community_members: email lowercased + UNIQUE
-- =============================================================================
-- Bisher konnten Duplikate entstehen, wenn die gleiche Email aus
-- verschiedenen Quellen mit unterschiedlicher Groß-/Kleinschreibung
-- ankam (Stripe behält evtl. Mixed-Case, CSV/manuell normalisierte zu
-- lowercase). Folge: gleiche Person taucht mehrfach in der Liste auf.
--
-- Fix:
--   1. Alle bestehenden Emails auf lowercase normalisieren
--   2. UNIQUE INDEX auf lower(email) — verhindert künftige Duplikate
--      hart auf DB-Level
--
-- Vorher: bestehende Duplikate aufräumen via Cleanup-API
-- (POST /api/admin/community/dedupe). Sonst schlägt diese Migration fehl.
-- Daher: Migration nur anwenden, NACHDEM Cleanup gelaufen ist.
-- =============================================================================

-- Schritt 1: Emails normalisieren
UPDATE public.community_members
SET email = LOWER(email)
WHERE email <> LOWER(email);

-- Schritt 2: UNIQUE INDEX auf lower(email).
-- Falls noch Duplikate existieren, schlägt das fehl — dann erst Cleanup
-- über UI (/admin/community → Dedupe-Button) laufen lassen.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_community_members_email_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_community_members_email_unique
      ON public.community_members (LOWER(email));
  END IF;
END $$;
