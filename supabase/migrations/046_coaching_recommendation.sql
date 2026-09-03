-- 046_coaching_recommendation.sql
-- Empfehlungskarte pro Teilnahme (Alumni-Übergang: Club, Sprint, Power Session).
-- Rein additiv.

alter table public.coaching_enrollments
  add column if not exists recommendation_title text,
  add column if not exists recommendation_text text,
  add column if not exists recommendation_url text,
  add column if not exists recommendation_cta text;
