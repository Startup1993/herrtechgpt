-- Coaching-Cockpit: Blocker als erledigt markieren, Erinnerungen mit Beschreibung.

alter table public.coaching_events drop constraint if exists coaching_events_kind_check;
alter table public.coaching_events add constraint coaching_events_kind_check check (kind in (
  'whatsapp_in', 'whatsapp_out', 'note', 'schedule_change', 'plan_change',
  'task_done', 'task_reopened', 'milestone_done', 'material_added',
  'login', 'client_win', 'client_blocker', 'blocker_resolved', 'mood', 'invite_sent', 'coach_reply', 'sync'
));

-- Erinnerungen sagen jetzt, was konkret zu tun ist. {Vorname} wird beim Anlegen ersetzt.
update public.coaching_programs set template = jsonb_set(jsonb_set(template, '{coach_cadence}', '[
  {"title": "Recap raus: WhatsApp-Kurztext und Mail", "offset_hours": 2, "description": "Recap-PDF aus dem Plugin an {Vorname} schicken: drei Sätze per WhatsApp (was war, was bis zum nächsten Call ansteht, wann der nächste Call ist) plus Mail mit PDF."},
  {"title": "WhatsApp: Erste Aufgabe angefangen?", "offset_days": 1, "description": "Eine kurze WhatsApp an {Vorname}: Hast du mit der ersten Aufgabe angefangen? Wo hakt es? Eine Frage, kein Roman."},
  {"title": "Mid-Week-Check per WhatsApp", "offset_days": 3, "description": "Zwischenstand bei {Vorname} abfragen: Welche Aufgaben sind durch, was blockiert? Bei einem Blocker direkt einen Fix oder ein kurzes Loom anbieten."},
  {"title": "Erinnerung an offene Aufgaben", "offset_days": 5, "description": "Offene Aufgaben von {Vorname} im Cockpit prüfen und freundlich erinnern, was bis zum Call noch fertig sein muss. Fertiges kurz loben."},
  {"title": "Termin für den nächsten Call bestätigen", "offset_days": 6, "description": "Termin und Meet-Link für den nächsten Call per WhatsApp bestätigen und fragen, was {Vorname} mitbringen soll (Zugänge, offene Fragen)."}
]'::jsonb), '{coach_prep}', '[
  {"title": "Call vorbereiten: Lage lesen, Drehbuch öffnen", "offset_days": -1, "description": "Lage von {Vorname} im Cockpit lesen (Blocker, offene Aufgaben, Themen), dann im Plugin /call-vorbereiten ausführen und das Drehbuch bereitlegen."}
]'::jsonb)
where key = 'coaching_1zu1';

-- Bestehende offene Erinnerungen nachziehen (so auf der Live-DB ausgeführt).
with tpl as (
  select s->>'title' as title, s->>'description' as description
  from coaching_programs p, jsonb_array_elements(p.template->'coach_cadence') s where p.key = 'coaching_1zu1'
  union all
  select s->>'title', s->>'description'
  from coaching_programs p, jsonb_array_elements(p.template->'coach_prep') s where p.key = 'coaching_1zu1'
), renamed as (
  select t2.id,
    case split_part(t2.title, ' · ', 1)
      when 'WhatsApp: Schon angefangen?' then 'WhatsApp: Erste Aufgabe angefangen?'
      when 'Call vorbereiten: Verlauf lesen, Drehbuch öffnen' then 'Call vorbereiten: Lage lesen, Drehbuch öffnen'
      else split_part(t2.title, ' · ', 1) end as first_part,
    case when position(' · ' in t2.title) > 0 then substring(t2.title from position(' · ' in t2.title)) else '' end as rest,
    split_part(e.client_name, ' ', 1) as vorname
  from coaching_tasks t2 join coaching_enrollments e on e.id = t2.enrollment_id
  where t2.assignee = 'coach' and t2.kind = 'cadence' and t2.status = 'open' and t2.description is null
)
update coaching_tasks t
set title = r.first_part || r.rest, description = replace(tpl.description, '{Vorname}', r.vorname)
from renamed r join tpl on tpl.title = r.first_part
where t.id = r.id;

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
      select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'description', t.description, 'due_at', t.due_at, 'kind', t.kind, 'milestone_id', t.milestone_id) order by t.due_at nulls last), '[]'::jsonb)
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
        and not exists (
          select 1 from coaching_events r
          where r.enrollment_id = e.id
            and ((r.kind = 'coach_reply' and r.occurred_at > b.occurred_at)
              or (r.kind = 'blocker_resolved' and (r.payload->>'resolves' = b.id::text or r.occurred_at > b.occurred_at)))
        )
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
          and r.kind in ('client_win', 'client_blocker', 'blocker_resolved', 'task_done', 'coach_reply', 'schedule_change', 'sync', 'whatsapp_in', 'whatsapp_out', 'milestone_done')
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
