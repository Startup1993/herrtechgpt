-- Newsletter-Signups für Coming-Soon-Landing
-- - email: unique, lowercase
-- - status: 'pending' (Default), 'invited' (nachdem Admin Einladung verschickt), 'registered' (User hat sich registriert)
-- - source: z.B. 'coming-soon', 'newsletter', 'referral' (für spätere Auswertung)
-- - invited_at / registered_at: Zeitstempel für Statusübergänge
-- RLS: Anon darf INSERT (via service-role in Server Action eh nicht nötig, aber safe),
--      SELECT/UPDATE/DELETE nur via service-role (Admin).

CREATE TABLE IF NOT EXISTS public.newsletter_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'registered')),
  source text NOT NULL DEFAULT 'coming-soon',
  created_at timestamptz NOT NULL DEFAULT now(),
  invited_at timestamptz,
  registered_at timestamptz,
  invited_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS newsletter_signups_status_idx ON public.newsletter_signups(status);
CREATE INDEX IF NOT EXISTS newsletter_signups_created_at_idx ON public.newsletter_signups(created_at DESC);

ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

-- Keine Anon-Policies: Inserts laufen über die Server Action mit service-role.
-- Dadurch ist die Tabelle für Anon/Authenticated komplett gesperrt.

-- Trigger: Wenn sich ein neuer Auth-User mit einer E-Mail registriert,
-- die in newsletter_signups steht, Status auf 'registered' setzen.
CREATE OR REPLACE FUNCTION public.handle_newsletter_signup_registered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.newsletter_signups
     SET status = 'registered',
         registered_at = now(),
         invited_user_id = NEW.id
   WHERE lower(email) = lower(NEW.email)
     AND status <> 'registered';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_newsletter ON auth.users;
CREATE TRIGGER on_auth_user_created_newsletter
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_newsletter_signup_registered();
