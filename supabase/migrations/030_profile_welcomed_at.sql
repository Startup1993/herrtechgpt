-- Welcome-Screen-Gate: einmaliger "Willkommen in der Herr Tech World"-Screen
-- nach erstem Login. Wenn welcomed_at NULL → Welcome-Screen zeigen.
-- Nach Klick auf "Los geht's" wird Zeitstempel gesetzt, danach skippt er.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcomed_at timestamptz;
