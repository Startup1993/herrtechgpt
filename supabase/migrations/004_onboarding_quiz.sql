-- Onboarding-Quiz Ergebnisse + personalisierter Lernpfad
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS experience_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS primary_goal text DEFAULT '',
  ADD COLUMN IF NOT EXISTS weekly_time text DEFAULT '',
  ADD COLUMN IF NOT EXISTS biggest_challenge text DEFAULT '',
  ADD COLUMN IF NOT EXISTS learning_path jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS learning_path_generated_at timestamptz;
