-- =============================================================================
-- Monetarisierungs-Grundgerüst (Stripe)
-- =============================================================================
-- S/M/L Abos mit Basic- und Community-Preisen, Credit-System, Top-ups.
-- Payment-Provider: Stripe (Products + Prices + Subscriptions + Checkout).
-- RLS streng: User liest nur eigene Subscriptions/Wallet/Transactions.
-- Admins CRUD auf Plans, Packs, Costs.
--
-- Price-Band-Logik:
--   access_tier='premium' (KI Marketing Club)  → Community-Preis
--   access_tier IN ('basic','alumni')          → Basic-Preis
--
-- Credits:
--   monthly_balance    → verfällt am Reset-Tag
--   purchased_balance  → rolliert 12 Monate (FIFO via purchased_expires_at)
-- Beim Verbrauch: erst monthly_balance abbauen, dann purchased_balance.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) PLANS — S/M/L Konfiguration (Admin-editierbar)
-- -----------------------------------------------------------------------------
-- Stripe-Modell: Ein Product pro Plan (z.B. "Herr Tech World S"),
-- mit 4 Prices (basic monthly, community monthly, basic yearly, community yearly).
-- Wir speichern hier die Price-IDs (price_xxx), die im Checkout übergeben werden.
CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,                      -- 'plan_s', 'plan_m', 'plan_l'
  tier text NOT NULL,                       -- 'S' | 'M' | 'L'
  name text NOT NULL,
  description text,
  price_basic_cents integer NOT NULL,       -- Monatspreis Alumni/Basic in Cent
  price_community_cents integer NOT NULL,   -- Monatspreis Community (0 für S)
  price_yearly_basic_cents integer,         -- optional: 11 Monate × monatlich
  price_yearly_community_cents integer,
  credits_per_month integer NOT NULL,
  stripe_product_id text,                   -- Stripe Product-ID (prod_xxx) — 1× pro Plan
  stripe_price_basic_monthly text,          -- Stripe Price-ID (price_xxx) Basic monatlich
  stripe_price_community_monthly text,      -- Stripe Price-ID Community monatlich
  stripe_price_basic_yearly text,           -- Stripe Price-ID Basic jährlich
  stripe_price_community_yearly text,       -- Stripe Price-ID Community jährlich
  features jsonb DEFAULT '[]'::jsonb,       -- UI: Liste von Feature-Bullets
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT plans_tier_check CHECK (tier IN ('S', 'M', 'L'))
);

CREATE INDEX IF NOT EXISTS idx_plans_active ON public.plans(active, sort_order);

-- -----------------------------------------------------------------------------
-- 2) SUBSCRIPTIONS — aktives Abo pro User (1:1, weil nur ein Plan gleichzeitig)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active',    -- active | trialing | past_due | cancelled | ended
  price_band text NOT NULL,                 -- 'basic' | 'community' (eingefroren beim Start)
  billing_cycle text NOT NULL DEFAULT 'monthly', -- 'monthly' | 'yearly'
  stripe_subscription_id text UNIQUE,       -- Stripe sub_xxx
  stripe_price_id text,                     -- Welche Price-ID bei Stripe läuft (für Migration bei Preisänderung)
  started_at timestamptz DEFAULT now(),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamptz,
  ended_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'ended')),
  CONSTRAINT subscriptions_price_band_check CHECK (price_band IN ('basic', 'community')),
  CONSTRAINT subscriptions_billing_cycle_check CHECK (billing_cycle IN ('monthly', 'yearly'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end) WHERE status = 'active';

-- Nur ein aktives/past_due Abo pro User
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_user
  ON public.subscriptions(user_id)
  WHERE status IN ('active', 'past_due');

-- -----------------------------------------------------------------------------
-- 3) CREDIT WALLETS — Kontostand pro User
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_balance integer NOT NULL DEFAULT 0,        -- Verfällt am reset_at
  monthly_allowance integer NOT NULL DEFAULT 0,      -- Soll-Betrag pro Monat (aus Plan)
  purchased_balance integer NOT NULL DEFAULT 0,      -- Top-ups, rollieren
  reset_at timestamptz,                              -- Wann monthly_balance neu gesetzt wird
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT credit_wallets_monthly_balance_nonneg CHECK (monthly_balance >= 0),
  CONSTRAINT credit_wallets_purchased_balance_nonneg CHECK (purchased_balance >= 0)
);

-- Ablauf-Tracking für gekaufte Credits (FIFO, 12 Monate)
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_total integer NOT NULL,
  credits_remaining integer NOT NULL,
  expires_at timestamptz NOT NULL,
  pack_id text,
  stripe_checkout_session_id text,          -- cs_xxx (Idempotenz beim Webhook)
  stripe_payment_intent_id text,            -- pi_xxx (Fallback-Referenz)
  created_at timestamptz DEFAULT now(),
  CONSTRAINT credit_purchases_remaining_nonneg CHECK (credits_remaining >= 0),
  CONSTRAINT credit_purchases_remaining_max CHECK (credits_remaining <= credits_total)
);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_expires
  ON public.credit_purchases(user_id, expires_at)
  WHERE credits_remaining > 0;

-- -----------------------------------------------------------------------------
-- 4) CREDIT TRANSACTIONS — Audit-Log (jede Bewegung)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,                  -- positiv = Gutschrift, negativ = Verbrauch
  balance_after_monthly integer,            -- Snapshot für Debugging
  balance_after_purchased integer,
  reason text NOT NULL,                     -- 'monthly_grant' | 'monthly_reset' | 'topup' | 'usage' | 'refund' | 'admin_adjust'
  feature text,                             -- bei usage: 'chat' | 'carousel' | 'image_gen' | 'video_gen_second' | ...
  feature_units integer,                    -- z.B. Anzahl Sekunden bei Video-Gen
  reference_id text,                        -- conversation_id, order_id, etc.
  note text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT credit_transactions_reason_check CHECK (
    reason IN ('monthly_grant', 'monthly_reset', 'topup', 'usage', 'refund', 'admin_adjust')
  )
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_tx_feature ON public.credit_transactions(feature) WHERE feature IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5) CREDIT PACKS — Top-up-Pakete (Admin-editierbar)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_packs (
  id text PRIMARY KEY,                      -- 'pack_100', 'pack_500', 'pack_2000'
  name text NOT NULL,
  credits integer NOT NULL,
  price_basic_cents integer NOT NULL,
  price_community_cents integer NOT NULL,
  stripe_product_id text,                   -- Stripe Product-ID (prod_xxx)
  stripe_price_basic text,                  -- Stripe Price-ID (price_xxx) Basic
  stripe_price_community text,              -- Stripe Price-ID Community
  expiry_months integer DEFAULT 12,         -- Rolling-Window in Monaten
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_packs_active ON public.credit_packs(active, sort_order);

-- -----------------------------------------------------------------------------
-- 6) FEATURE CREDIT COSTS — Was kostet welche Aktion? (Admin-editierbar)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_credit_costs (
  feature text PRIMARY KEY,                 -- 'chat' | 'carousel' | 'image_gen' | 'video_gen_second' | ...
  label text NOT NULL,                      -- Anzeigename im Admin
  credits_per_unit integer NOT NULL,
  unit text NOT NULL DEFAULT 'action',      -- 'action' | 'second' | 'minute' | '1000chars'
  category text,                            -- 'chat' | 'toolbox' | 'video'
  description text,
  active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 7) STRIPE EVENTS — Webhook-Event-Log (Idempotenz)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,            -- Stripe evt_xxx für Idempotenz
  event_type text NOT NULL,                 -- z.B. 'customer.subscription.updated'
  payload jsonb NOT NULL,
  processed_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_unprocessed
  ON public.stripe_events(created_at)
  WHERE processed_at IS NULL;

-- -----------------------------------------------------------------------------
-- 8) PROFILES ERWEITERUNG — stripe_customer_id
-- -----------------------------------------------------------------------------
-- Ein Customer bleibt über mehrere Subscriptions hinweg bestehen
-- (z.B. bei Kündigung + Re-Abschluss, oder parallelem Top-up-Kauf).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_credit_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Plans: alle eingeloggten User lesen (für Pricing-Seite), Admins schreiben
CREATE POLICY "plans_read_authenticated" ON public.plans
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "plans_admin_all" ON public.plans
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "plans_service_role" ON public.plans
  FOR ALL TO service_role USING (true);

-- Credit Packs: gleiche Logik wie Plans
CREATE POLICY "credit_packs_read_authenticated" ON public.credit_packs
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "credit_packs_admin_all" ON public.credit_packs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "credit_packs_service_role" ON public.credit_packs
  FOR ALL TO service_role USING (true);

-- Feature Credit Costs: alle User lesen (UI zeigt Kosten vor Action), Admins schreiben
CREATE POLICY "feature_costs_read_authenticated" ON public.feature_credit_costs
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "feature_costs_admin_all" ON public.feature_credit_costs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "feature_costs_service_role" ON public.feature_credit_costs
  FOR ALL TO service_role USING (true);

-- Subscriptions: User sieht nur eigene, Admins sehen alles, Writes nur via Service-Role
CREATE POLICY "subscriptions_read_own" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "subscriptions_admin_read" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "subscriptions_service_role" ON public.subscriptions
  FOR ALL TO service_role USING (true);

-- Credit Wallets: User sieht nur eigenes, Writes via Service-Role (API-Routes)
CREATE POLICY "wallets_read_own" ON public.credit_wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "wallets_admin_read" ON public.credit_wallets
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "wallets_service_role" ON public.credit_wallets
  FOR ALL TO service_role USING (true);

-- Credit Purchases: gleiche Logik wie Wallets
CREATE POLICY "purchases_read_own" ON public.credit_purchases
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "purchases_admin_read" ON public.credit_purchases
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "purchases_service_role" ON public.credit_purchases
  FOR ALL TO service_role USING (true);

-- Credit Transactions: User sieht nur eigene, Writes via Service-Role
CREATE POLICY "tx_read_own" ON public.credit_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "tx_admin_read" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "tx_service_role" ON public.credit_transactions
  FOR ALL TO service_role USING (true);

-- Stripe Events: nur Service-Role + Admin-Read (Debug)
CREATE POLICY "stripe_events_admin_read" ON public.stripe_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "stripe_events_service_role" ON public.stripe_events
  FOR ALL TO service_role USING (true);

-- =============================================================================
-- Auto-Update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plans_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER credit_wallets_updated_at BEFORE UPDATE ON public.credit_wallets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER credit_packs_updated_at BEFORE UPDATE ON public.credit_packs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER feature_credit_costs_updated_at BEFORE UPDATE ON public.feature_credit_costs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =============================================================================
-- SEED: Start-Plans, Start-Packs, Feature-Costs
-- Zahlen abgestimmt mit Jacob (April 2026). Alle im Admin änderbar.
-- =============================================================================

INSERT INTO public.plans (
  id, tier, name, description,
  price_basic_cents, price_community_cents,
  price_yearly_basic_cents, price_yearly_community_cents,
  credits_per_month, sort_order, features
) VALUES
  ('plan_s', 'S', 'Starter',
   'Zum Einsteigen. Herr Tech GPT + KI Toolbox mit 200 Credits.',
   1900, 0,
   19900, 0,
   200, 1,
   '["Herr Tech GPT Zugang", "KI Toolbox Zugang", "200 Credits/Monat"]'::jsonb),

  ('plan_m', 'M', 'Professional',
   'Für aktive Content-Creator. 1.500 Credits/Monat.',
   4900, 2900,
   53900, 31900,
   1500, 2,
   '["Alles aus Starter", "1.500 Credits/Monat", "Priority Support"]'::jsonb),

  ('plan_l', 'L', 'Power',
   'Für Agenturen & Power-User. 5.000 Credits/Monat.',
   9900, 6900,
   108900, 75900,
   5000, 3,
   '["Alles aus Professional", "5.000 Credits/Monat", "Early Access neue Features"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.credit_packs (id, name, credits, price_basic_cents, price_community_cents, sort_order) VALUES
  ('pack_100',  '+100 Credits',    100,  900,  600, 1),
  ('pack_500',  '+500 Credits',    500, 3500, 2500, 2),
  ('pack_2000', '+2.000 Credits', 2000, 9900, 6900, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.feature_credit_costs (feature, label, credits_per_unit, unit, category, description) VALUES
  ('chat',               'Chat-Nachricht',            0, 'action', 'chat',    'Herr Tech GPT Nachricht (Chat ist inklusive, keine Credits)'),
  ('carousel',           'Carousel (7 Slides)',      10, 'action', 'toolbox', 'Instagram-Karussell'),
  ('video_editor_cut',   'Video-Editor Cut',          8, 'action', 'toolbox', 'Einzelner Cut im Video-Editor'),
  ('image_gen',          'Bild-Generierung',          2, 'action', 'video',   'Einzelnes Bild (SDXL / Flux)'),
  ('image_edit',         'Bild-Edit / Upscale',       2, 'action', 'video',   'Bild-Nachbearbeitung'),
  ('video_gen_second',   'Video-Generierung',        15, 'second', 'video',   'Pro Sekunde generiertes Video'),
  ('voiceover_1k_chars', 'Voiceover',                 5, '1000chars', 'video', 'Pro 1.000 Zeichen Voiceover'),
  ('music_gen_30s',      'Musik-Generierung',         5, '30seconds', 'video', 'Pro 30s Musik'),
  ('transcription_min',  'Transkription',             2, 'minute', 'toolbox', 'Pro Minute Audio/Video')
ON CONFLICT (feature) DO NOTHING;
