-- Tracking von Einladungs-E-Mails pro Nutzer
-- - invitation_sent_count: wie oft wurde ein Magic-Link verschickt
-- - invitation_last_sent_at: Zeitpunkt des letzten Versands (für Rate-Limiting im UI)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invitation_sent_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invitation_last_sent_at timestamptz;
