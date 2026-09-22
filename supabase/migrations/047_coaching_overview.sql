-- Coaching-Cockpit Schritt 1: echte Ereigniszeit, Quelle, Sammel-Ereignis "sync",
-- vorberechnete Übersicht für die Coach-Startseite.

alter table public.coaching_events add column if not exists occurred_at timestamptz;
update public.coaching_events set occurred_at = created_at where occurred_at is null;
alter table public.coaching_events alter column occurred_at set not null;
alter table public.coaching_events alter column occurred_at set default now();

alter table public.coaching_events add column if not exists source text not null default 'coach';
alter table public.coaching_events drop constraint if exists coaching_events_source_check;
alter table public.coaching_events add constraint coaching_events_source_check check (source in ('coach', 'client', 'plugin', 'system'));
update public.coaching_events set source = 'client' where kind in ('client_win', 'client_blocker', 'task_done', 'task_reopened', 'login');
update public.coaching_events set source = 'plugin' where source = 'coach' and (author_name ilike '%import%' or author_name ilike '%plugin%');

alter table public.coaching_events drop constraint if exists coaching_events_kind_check;
alter table public.coaching_events add constraint coaching_events_kind_check check (kind in (
  'whatsapp_in', 'whatsapp_out', 'note', 'schedule_change', 'plan_change',
  'task_done', 'task_reopened', 'milestone_done', 'material_added',
  'login', 'client_win', 'client_blocker', 'mood', 'invite_sent', 'coach_reply', 'sync'
));

create index if not exists coaching_events_enrollment_occurred_idx on public.coaching_events (enrollment_id, occurred_at desc);

-- Eine Zeile pro Teilnahme mit allem, was die Startseite braucht. Ersetzt das Laden
-- aller Aufgaben und aller Ereignisse bei jedem Aufruf.
create or replace function public.coaching_admin_overview()
returns setof jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'enrollment', to_jsonb(e),
    'milestones', (
      select coalesce(jsonb_agg(to_jsonb(m) order by m.sort_order, m.scheduled_at), '[]'::jsonb)
      from coaching_milestones m where m.enrollment_id = e.id
    ),
    'goals', (
      select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'title', g.title, 'status', g.status) order by g.sort_order), '[]'::jsonb)
      from coaching_goals g where g.enrollment_id = e.id
    ),
    'tasks', (
      select jsonb_build_object(
        'open_client',   count(*) filter (where t.assignee = 'client' and t.status = 'open'),
        'overdue_client',count(*) filter (where t.assignee = 'client' and t.status = 'open' and t.due_at < now()),
        'done_client',   count(*) filter (where t.assignee = 'client' and t.status = 'done'),
        'coach_open',    count(*) filter (where t.assignee = 'coach' and t.status = 'open' and not t.stale and not t.expired),
        'coach_due',     count(*) filter (where t.assignee = 'coach' and t.status = 'open' and not t.stale and not t.expired and t.due_at <= now() + interval '1 day'),
        'coach_expired', count(*) filter (where t.assignee = 'coach' and t.status = 'open' and t.expired)
      )
      from (
        select t.*,
          coalesce(t.kind = 'cadence' and (mm.status in ('done', 'cancelled') or t.due_at < now() - interval '2 days'), false) as stale,
          coalesce(t.kind <> 'cadence' and t.due_at < now() - interval '14 days', false) as expired
        from coaching_tasks t
        left join coaching_milestones mm on mm.id = t.milestone_id
        where t.enrollment_id = e.id
      ) t
    ),
    'coach_tasks', (
      select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'due_at', t.due_at, 'kind', t.kind, 'milestone_id', t.milestone_id) order by t.due_at nulls last), '[]'::jsonb)
      from (
        select t.* from coaching_tasks t
        left join coaching_milestones mm on mm.id = t.milestone_id
        where t.enrollment_id = e.id and t.assignee = 'coach' and t.status = 'open'
          and not coalesce(t.kind = 'cadence' and (mm.status in ('done', 'cancelled') or t.due_at < now() - interval '2 days'), false)
          and not coalesce(t.kind <> 'cadence' and t.due_at < now() - interval '14 days', false)
        order by t.due_at nulls last limit 20
      ) t
    ),
    'blocker', (
      select jsonb_build_object('body', b.body, 'at', b.occurred_at)
      from coaching_events b
      where b.enrollment_id = e.id and b.kind = 'client_blocker' and b.occurred_at > now() - interval '14 days'
        and not exists (select 1 from coaching_events r where r.enrollment_id = e.id and r.kind = 'coach_reply' and r.occurred_at > b.occurred_at)
      order by b.occurred_at desc limit 1
    ),
    'mood', (
      select jsonb_build_object(
        'score', mo.mood_score, 'body', mo.body, 'at', mo.occurred_at,
        'trend', (
          select coalesce(jsonb_agg(s.mood_score order by s.occurred_at), '[]'::jsonb)
          from (select mood_score, occurred_at from coaching_events where enrollment_id = e.id and kind = 'mood' and mood_score is not null order by occurred_at desc limit 8) s
        )
      )
      from coaching_events mo
      where mo.enrollment_id = e.id and mo.kind = 'mood' and mo.mood_score is not null
      order by mo.occurred_at desc limit 1
    ),
    'last_contact', (
      select jsonb_build_object('kind', c.kind, 'at', c.occurred_at)
      from coaching_events c
      where c.enrollment_id = e.id and c.kind in ('whatsapp_in', 'whatsapp_out', 'client_win', 'client_blocker', 'task_done', 'milestone_done', 'invite_sent', 'coach_reply')
      order by c.occurred_at desc limit 1
    ),
    'recent', (
      select coalesce(jsonb_agg(jsonb_build_object('kind', r.kind, 'body', r.body, 'at', r.occurred_at, 'source', r.source, 'author', r.author_name) order by r.occurred_at desc), '[]'::jsonb)
      from (
        select * from coaching_events r
        where r.enrollment_id = e.id and r.occurred_at > now() - interval '48 hours'
          and r.kind in ('client_win', 'client_blocker', 'task_done', 'coach_reply', 'schedule_change', 'sync', 'whatsapp_in', 'whatsapp_out', 'milestone_done')
        order by r.occurred_at desc limit 10
      ) r
    )
  )
  from coaching_enrollments e
  order by e.status, e.created_at desc;
$$;

revoke all on function public.coaching_admin_overview() from public;
revoke all on function public.coaching_admin_overview() from anon, authenticated;
grant execute on function public.coaching_admin_overview() to service_role;
