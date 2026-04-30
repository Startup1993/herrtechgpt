-- ═══════════════════════════════════════════════════════════════════
-- 041_community_credit_grant.sql — Monatlicher Credit-Grant-Tracker
-- ═══════════════════════════════════════════════════════════════════
--
-- Zweck: Wenn das Abo-System deaktiviert ist (app_settings.subscriptions_enabled
-- = false), gibt es keine Plan-S-Subscription mehr für Community-Mitglieder.
-- Damit fehlt auch der Stripe-Invoice-Webhook-Trigger der heute monatlich
-- Credits gutschreibt.
--
-- Stattdessen läuft ein Vercel-Cron (/api/cron/community-credit-grant)
-- 1× täglich und gewährt Credits an alle aktiven Community-Mitglieder
-- deren letzter Grant >= 1 Kalendermonat zurückliegt.
--
-- Diese Spalte trackt den letzten Grant-Zeitpunkt pro Mitglied. NULL = noch
-- nie Credits erhalten (z.B. neuer Beitritt vor Cron-Lauf), wird vom Cron
-- als "fällig" behandelt.
-- ═══════════════════════════════════════════════════════════════════

alter table community_members
  add column if not exists last_credit_grant_at timestamptz;

comment on column community_members.last_credit_grant_at is
  'Zeitstempel des letzten monatlichen Credit-Grants. Cron prüft '
  'last_credit_grant_at + interval ''1 month'' <= now() (Kalendermonat). '
  'NULL = nie erhalten, wird beim nächsten Cron-Lauf gesetzt. '
  'Nur relevant wenn subscriptions_enabled=false; bei aktivem Abo-System '
  'kommen Credits via Stripe-Invoice-Webhook und diese Spalte bleibt NULL.';

-- Partial Index: nur die Zeilen die der Cron tatsächlich abfragt.
-- Spart Speicher und macht den täglichen Cron-Query schnell.
create index if not exists idx_community_members_credit_grant_due
  on community_members (last_credit_grant_at)
  where skool_status = 'active' and profile_id is not null;
