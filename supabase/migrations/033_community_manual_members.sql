-- =============================================================================
-- community_members: manuelle Einträge ermöglichen
-- =============================================================================
-- Bisher mussten alle community_members einen stripe_customer_id haben.
-- Das schließt Skool-Mitglieder aus, die nicht über Stripe gekauft haben:
--   - Admins (Florian, Jacob, Cheten, ...)
--   - Free-Mitglieder, die Cheten manuell ins Skool gepackt hat
--   - CSV-Importe aus Skool-Member-Export
--
-- Änderungen:
--   1. stripe_customer_id wird nullable (UNIQUE bleibt — Postgres erlaubt
--      mehrere NULLs in UNIQUE-Spalten).
--   2. source-Spalte zeigt Herkunft des Eintrags. Sync-Job überschreibt
--      nur source='stripe'-Members; manuelle Einträge bleiben safe.
-- =============================================================================

ALTER TABLE public.community_members
  ALTER COLUMN stripe_customer_id DROP NOT NULL;

ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'stripe';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'community_members' AND constraint_name = 'community_members_source_check'
  ) THEN
    ALTER TABLE public.community_members
      ADD CONSTRAINT community_members_source_check
      CHECK (source IN ('stripe', 'manual', 'csv', 'skool'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_community_members_source
  ON public.community_members(source) WHERE source != 'stripe';
