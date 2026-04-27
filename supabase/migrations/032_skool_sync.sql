-- =============================================================================
-- Skool ↔ Herr Tech World Sync
-- =============================================================================
-- Siehe docs/SKOOL_SYNC.md für vollständigen Plan.
--
-- Idee:
--  1. skool_stripe_products       → Admin-verwaltete Whitelist von Stripe-
--                                   Products, deren Kauf Skool-Zugang (und
--                                   damit Plan S gratis) gewährt.
--  2. community_members           → Staging-Tabelle: Stripe-Käufer, auch ohne
--                                   Herr-Tech-Account. Admin lädt manuell ein.
--  3. subscriptions.plan_source   → Woher kommt das Abo (paid | skool_community
--                                   | admin_granted). Nur skool_community-Subs
--                                   werden bei Alumni-Werden beendet.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) SKOOL STRIPE PRODUCTS — Admin-verwaltete Product-ID Whitelist
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skool_stripe_products (
  stripe_product_id text PRIMARY KEY,
  label text NOT NULL,
  access_days integer NOT NULL DEFAULT 365,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skool_products_active
  ON public.skool_stripe_products(active) WHERE active = true;

-- Seed: aktuell bekanntes Produkt aus Stripe-Live
INSERT INTO public.skool_stripe_products (stripe_product_id, label, access_days, notes)
VALUES ('prod_U0auNKeujsyodG', 'KI Marketing Club (€2.990)', 365,
        'Standard-Jahrespaket, gesehen 19. Feb. Weitere Varianten hinzufügen wenn bekannt.')
ON CONFLICT (stripe_product_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2) COMMUNITY MEMBERS — Staging-Tabelle (Stripe-Käufer, pre-Claim)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identität aus Stripe
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  name text,

  -- Skool-Mitgliedschaftsstatus
  skool_status text NOT NULL DEFAULT 'active'
    CHECK (skool_status IN ('active', 'alumni', 'cancelled')),
  skool_access_started_at timestamptz,
  skool_access_expires_at timestamptz,

  -- Letzter Kauf (für Audit / Renewal-Detection)
  last_purchase_at timestamptz,
  last_stripe_product_id text,
  last_stripe_price_id text,
  last_stripe_payment_intent text,
  purchase_count integer NOT NULL DEFAULT 1,

  -- Admin-Einladung (Magic-Link-Token, 30 Tage gültig)
  invitation_token text UNIQUE,
  invitation_token_expires timestamptz,
  invited_at timestamptz,
  invitation_sent_count integer NOT NULL DEFAULT 0,
  last_invited_at timestamptz,

  -- Nach Claim: Verknüpfung mit echtem Profil
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_members_status_expiry
  ON public.community_members(skool_status, skool_access_expires_at);
CREATE INDEX IF NOT EXISTS idx_community_members_email
  ON public.community_members(lower(email));
CREATE INDEX IF NOT EXISTS idx_community_members_token
  ON public.community_members(invitation_token)
  WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_members_profile
  ON public.community_members(profile_id)
  WHERE profile_id IS NOT NULL;

-- updated_at Trigger
CREATE OR REPLACE FUNCTION public.tg_community_members_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_community_members_updated_at ON public.community_members;
CREATE TRIGGER trg_community_members_updated_at
  BEFORE UPDATE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_community_members_updated_at();

-- -----------------------------------------------------------------------------
-- 3) SUBSCRIPTIONS.plan_source — Woher kommt das Abo?
-- -----------------------------------------------------------------------------
-- 'paid'             → User zahlt selbst via Stripe-Subscription
-- 'skool_community'  → Plan S gratis, gekoppelt an Skool-Mitgliedschaft
-- 'admin_granted'    → Admin hat manuell vergeben
--
-- Nur Subs mit plan_source='skool_community' werden beim Alumni-Werden
-- automatisch beendet. 'paid' und 'admin_granted' bleiben unangetastet.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_source text NOT NULL DEFAULT 'paid';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'subscriptions' AND constraint_name = 'subscriptions_plan_source_check'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_plan_source_check
      CHECK (plan_source IN ('paid', 'skool_community', 'admin_granted'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_source
  ON public.subscriptions(plan_source)
  WHERE status IN ('active', 'past_due');

-- -----------------------------------------------------------------------------
-- 4) RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.skool_stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Skool-Products: nur Admin liest/schreibt. Service-Role für Webhook.
CREATE POLICY "skool_products_admin_all" ON public.skool_stripe_products
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "skool_products_service_role" ON public.skool_stripe_products
  FOR ALL TO service_role USING (true);

-- community_members: Admin voll. User liest nur eigenen (nach Claim).
-- Service-Role für Webhook / Cron.
CREATE POLICY "community_members_admin_all" ON public.community_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "community_members_read_own" ON public.community_members
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "community_members_service_role" ON public.community_members
  FOR ALL TO service_role USING (true);
