-- ═══════════════════════════════════════════════════════════════════
-- 040_app_settings.sql — Globale Plattform-Settings (Key/Value)
-- ═══════════════════════════════════════════════════════════════════
--
-- Zweck: Master-Switches, Defaults und Feature-Flags die der Admin via
-- /admin/monetization/settings konfigurieren kann — ohne Code-Deploy.
--
-- Erste Anwendung: Subscription-System ein/aus + Fallback-Credit-Mengen
-- (Community-Credits/Monat, Starter-Test-Credits). Wenn subscriptions_enabled
-- = false, nutzt das System diese Fallback-Werte statt Plan-Definitionen.
--
-- Read: nur Admin (Server-Components nutzen Admin-Client/service_role).
-- Write: nur Admin via /api/admin/settings.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists app_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

comment on table app_settings is
  'Globale Plattform-Konfiguration (Master-Switches, Defaults, Feature-Flags). '
  'Werte sind jsonb damit beliebige Typen abgelegt werden können (bool, number, string, object).';

alter table app_settings enable row level security;

-- Admin-only Lese- und Schreibzugriff.
-- Server-Components/Routes nutzen service_role wenn Settings öffentlich
-- benötigt werden (z.B. Pricing-Page).
create policy "app_settings_admin_read" on app_settings
  for select to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "app_settings_admin_write" on app_settings
  for all to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Auto-update updated_at on change
create or replace function app_settings_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_settings_updated_at on app_settings;
create trigger app_settings_updated_at
  before update on app_settings
  for each row execute function app_settings_set_updated_at();

-- ─── Initial-Werte ────────────────────────────────────────────────
-- Werden nur eingefügt wenn Key noch nicht existiert (idempotent).

insert into app_settings (key, value, description) values
  (
    'subscriptions_enabled',
    'false'::jsonb,
    'Master-Switch für Abo-System (Plan S/M/L). Wenn false: Pricing-Seite zeigt keine Abos, Subscription-Checkout-API verweigert. Bestehende Abos laufen weiter, aber niemand kann neue abschließen.'
  ),
  (
    'community_monthly_credits',
    '200'::jsonb,
    'Credits pro Monat für Community-Mitglieder (Fallback wenn subscriptions_enabled=false). Wenn Subs aktiv: Wert kommt aus plans.credits_per_month vom mit Skool verknüpften Plan (heute Plan S).'
  ),
  (
    'starter_test_credits',
    '0'::jsonb,
    'Test-Credits beim Kauf eines kleinen Pakets (Funnel-Einstieg) für Nicht-Community-User. 0 = keine Test-Credits, User muss direkt Credit-Pack kaufen. 50 = großzügigerer Einstieg.'
  )
on conflict (key) do nothing;
