-- 049: Coaching-Cockpit aus der World entfernen.
-- Das Coaching läuft seit 28.09.2026 über Kunden-Cockpits als Claude-Artifacts
-- (Plugin herr-tech-coaching 2.0). Code ist mit PR #224 raus.
-- Daten vorher gesichert: Drive Coaching/_World-Export/2026-09-29.
-- Der leere Bucket coaching-files wird über die Storage-API gelöscht
-- (direktes Löschen in storage.* blockt Supabase).

drop function if exists public.coaching_admin_overview();

drop table if exists
  public.coaching_events,
  public.coaching_materials,
  public.coaching_goals,
  public.coaching_tasks,
  public.coaching_milestones,
  public.coaching_enrollments,
  public.coaching_programs
  cascade;

drop function if exists public.coaching_touch_updated_at();

delete from public.app_settings where key = 'coaching_client_access';
delete from public.email_templates where key like 'coaching\_%';
