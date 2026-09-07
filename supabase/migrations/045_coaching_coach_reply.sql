-- 045_coaching_coach_reply.sql
-- Neue Ereignis-Art: Antwort des Coaches an den Kunden (sichtbar im Dashboard,
-- Kunde bekommt eine Mail). Nur Constraint-Erweiterung, keine Datenänderung.

alter table public.coaching_events drop constraint if exists coaching_events_kind_check;
alter table public.coaching_events add constraint coaching_events_kind_check check (kind in (
  'whatsapp_in', 'whatsapp_out', 'note', 'schedule_change', 'plan_change',
  'task_done', 'task_reopened', 'milestone_done', 'material_added',
  'login', 'client_win', 'client_blocker', 'mood', 'invite_sent', 'coach_reply'
));
