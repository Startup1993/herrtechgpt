-- ═══════════════════════════════════════════════════════════════════
-- 044_coaching_cockpit.sql
-- Coaching-Cockpit: Kunden-Dashboard "Mein Coaching" + Coach-Cockpit.
-- Generischer Programm-Motor (1:1 Coaching als erste Vorlage).
-- Nur additiv: neue Tabellen, ein privater Storage-Bucket, RLS.
-- ═══════════════════════════════════════════════════════════════════

-- ── Programme (Vorlagen) ─────────────────────────────────────────────
create table if not exists public.coaching_programs (
  key text primary key,
  title text not null,
  kind text not null default 'coaching_1zu1'
    check (kind in ('coaching_1zu1', 'ninety_days', 'power_day', 'group')),
  duration_days int not null default 28,
  template jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Teilnahmen (Kunde × Programm) ────────────────────────────────────
create table if not exists public.coaching_enrollments (
  id uuid primary key default gen_random_uuid(),
  program_key text not null references public.coaching_programs(key) on delete restrict,
  profile_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_email text,
  company text,
  coach_name text,
  coach_profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  world_mode text not null default 'program_only'
    check (world_mode in ('program_only', 'program_plus_toolbox', 'full')),
  starts_at date,
  ends_at date,
  track text,
  persona text,
  north_star text,
  success_quote text,
  intro_text text,
  nps int check (nps between 0 and 10),
  upsell_status text,
  case_study boolean not null default false,
  notion_url text,
  drive_url text,
  whatsapp_url text,
  community_url text,
  last_client_seen_at timestamptz,
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coaching_enrollments_profile_idx on public.coaching_enrollments (profile_id);
create index if not exists coaching_enrollments_status_idx on public.coaching_enrollments (status);

-- ── Meilensteine (Kickoff, Calls, Check-ins, Monate) ─────────────────
create table if not exists public.coaching_milestones (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.coaching_enrollments(id) on delete cascade,
  kind text not null default 'call' check (kind in ('kickoff', 'call', 'checkin', 'month')),
  number int not null default 1,
  title text not null,
  goal text,
  success_criterion text,
  scheduled_at timestamptz,
  status text not null default 'planned' check (status in ('planned', 'scheduled', 'done', 'cancelled')),
  summary text,
  decisions text,
  done_items text,
  open_items text,
  bring_along text,
  recording_url text,
  recap_url text,
  recap_storage_path text,
  meeting_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coaching_milestones_enrollment_idx on public.coaching_milestones (enrollment_id, sort_order);

-- ── Aufgaben (Kunde und Coach) ───────────────────────────────────────
create table if not exists public.coaching_tasks (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.coaching_enrollments(id) on delete cascade,
  milestone_id uuid references public.coaching_milestones(id) on delete set null,
  title text not null,
  description text,
  instructions text,
  copy_prompt text,
  link_url text,
  due_at timestamptz,
  assignee text not null default 'client' check (assignee in ('client', 'coach')),
  kind text not null default 'homework' check (kind in ('homework', 'promise', 'cadence')),
  status text not null default 'open' check (status in ('open', 'done', 'skipped')),
  completed_at timestamptz,
  proof_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coaching_tasks_enrollment_idx on public.coaching_tasks (enrollment_id, assignee, status);
create index if not exists coaching_tasks_due_idx on public.coaching_tasks (due_at) where status = 'open';

-- ── Ziele (die 3 Workflows) ──────────────────────────────────────────
create table if not exists public.coaching_goals (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.coaching_enrollments(id) on delete cascade,
  milestone_id uuid references public.coaching_milestones(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'running', 'stuck')),
  status_note text,
  stuck_since timestamptz,
  baseline text,
  result text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coaching_goals_enrollment_idx on public.coaching_goals (enrollment_id, sort_order);

-- ── Material (Skills, Skripte, Dokumente) ────────────────────────────
create table if not exists public.coaching_materials (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.coaching_enrollments(id) on delete cascade,
  milestone_id uuid references public.coaching_milestones(id) on delete set null,
  kind text not null default 'document'
    check (kind in ('skill', 'script', 'document', 'analysis', 'recording', 'other')),
  title text not null,
  description text,
  version text,
  external_url text,
  storage_path text,
  file_name text,
  instructions text,
  visibility text not null default 'internal' check (visibility in ('internal', 'client')),
  first_opened_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coaching_materials_enrollment_idx on public.coaching_materials (enrollment_id, visibility);

-- ── Verlauf (alles, was zwischen den Calls passiert) ─────────────────
create table if not exists public.coaching_events (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.coaching_enrollments(id) on delete cascade,
  author_profile_id uuid references public.profiles(id) on delete set null,
  author_name text,
  kind text not null check (kind in (
    'whatsapp_in', 'whatsapp_out', 'note', 'schedule_change', 'plan_change',
    'task_done', 'task_reopened', 'milestone_done', 'material_added',
    'login', 'client_win', 'client_blocker', 'mood', 'invite_sent'
  )),
  body text,
  payload jsonb not null default '{}'::jsonb,
  mood_score int check (mood_score between 1 and 5),
  client_visible boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists coaching_events_enrollment_idx on public.coaching_events (enrollment_id, created_at desc);

-- ── updated_at auto-touch ────────────────────────────────────────────
create or replace function public.coaching_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists coaching_programs_touch on public.coaching_programs;
create trigger coaching_programs_touch before update on public.coaching_programs
  for each row execute function public.coaching_touch_updated_at();
drop trigger if exists coaching_enrollments_touch on public.coaching_enrollments;
create trigger coaching_enrollments_touch before update on public.coaching_enrollments
  for each row execute function public.coaching_touch_updated_at();
drop trigger if exists coaching_milestones_touch on public.coaching_milestones;
create trigger coaching_milestones_touch before update on public.coaching_milestones
  for each row execute function public.coaching_touch_updated_at();
drop trigger if exists coaching_tasks_touch on public.coaching_tasks;
create trigger coaching_tasks_touch before update on public.coaching_tasks
  for each row execute function public.coaching_touch_updated_at();
drop trigger if exists coaching_goals_touch on public.coaching_goals;
create trigger coaching_goals_touch before update on public.coaching_goals
  for each row execute function public.coaching_touch_updated_at();
drop trigger if exists coaching_materials_touch on public.coaching_materials;
create trigger coaching_materials_touch before update on public.coaching_materials
  for each row execute function public.coaching_touch_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────
-- Kunde: liest nur eigene Teilnahme und deren kundenseitige Zeilen.
-- Alle Schreibzugriffe (Kunde und Coach) laufen über API-Routen mit
-- Service-Role nach serverseitiger Prüfung. Admins lesen alles.

alter table public.coaching_programs enable row level security;
alter table public.coaching_enrollments enable row level security;
alter table public.coaching_milestones enable row level security;
alter table public.coaching_tasks enable row level security;
alter table public.coaching_goals enable row level security;
alter table public.coaching_materials enable row level security;
alter table public.coaching_events enable row level security;

drop policy if exists "coaching_programs_read" on public.coaching_programs;
create policy "coaching_programs_read" on public.coaching_programs
  for select to authenticated using (true);

drop policy if exists "coaching_enrollments_own_read" on public.coaching_enrollments;
create policy "coaching_enrollments_own_read" on public.coaching_enrollments
  for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "coaching_milestones_own_read" on public.coaching_milestones;
create policy "coaching_milestones_own_read" on public.coaching_milestones
  for select to authenticated
  using (
    exists (
      select 1 from public.coaching_enrollments e
      where e.id = enrollment_id
        and (e.profile_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
    )
  );

-- Kunde sieht nur seine eigenen Aufgaben, nie die Coach-Aufgaben.
drop policy if exists "coaching_tasks_own_read" on public.coaching_tasks;
create policy "coaching_tasks_own_read" on public.coaching_tasks
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or (
      assignee = 'client'
      and exists (
        select 1 from public.coaching_enrollments e
        where e.id = enrollment_id and e.profile_id = auth.uid()
      )
    )
  );

drop policy if exists "coaching_goals_own_read" on public.coaching_goals;
create policy "coaching_goals_own_read" on public.coaching_goals
  for select to authenticated
  using (
    exists (
      select 1 from public.coaching_enrollments e
      where e.id = enrollment_id
        and (e.profile_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
    )
  );

-- Kunde sieht nur freigegebenes Material.
drop policy if exists "coaching_materials_own_read" on public.coaching_materials;
create policy "coaching_materials_own_read" on public.coaching_materials
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or (
      visibility = 'client'
      and exists (
        select 1 from public.coaching_enrollments e
        where e.id = enrollment_id and e.profile_id = auth.uid()
      )
    )
  );

-- Kunde sieht nur als kundensichtbar markierte Ereignisse (nie Stimmung, nie Notizen).
drop policy if exists "coaching_events_own_read" on public.coaching_events;
create policy "coaching_events_own_read" on public.coaching_events
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or (
      client_visible = true
      and exists (
        select 1 from public.coaching_enrollments e
        where e.id = enrollment_id and e.profile_id = auth.uid()
      )
    )
  );

-- ── Storage: privater Bucket für Recaps, Skills, Dokumente ───────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('coaching-files', 'coaching-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

-- Zugriff ausschließlich über signierte URLs (Service-Role), keine
-- direkten Client-Policies. Admin-Upload läuft über die API-Route.

-- ── Seed: das 1:1 Coaching als erste Vorlage ─────────────────────────
insert into public.coaching_programs (key, title, kind, duration_days, template)
values (
  'coaching_1zu1',
  'Claude 1:1 Coaching',
  'coaching_1zu1',
  28,
  '{
    "milestones": [
      {"kind": "kickoff", "number": 0, "title": "Kickoff", "goal": "Nordstern, Track und die 3 Workflows festmachen", "offset_days": 0},
      {"kind": "call", "number": 1, "title": "Call 1 · Fundament", "goal": "Claude sauber aufgesetzt, erster Workflow live", "offset_days": 7},
      {"kind": "call", "number": 2, "title": "Call 2 · Workflow 2", "goal": "Zweiter Workflow live, der Kunde tippt selbst", "offset_days": 14},
      {"kind": "call", "number": 3, "title": "Call 3 · Workflow 3", "goal": "Dritter Workflow, der größte Hebel", "offset_days": 21},
      {"kind": "call", "number": 4, "title": "Call 4 · System und Übergabe", "goal": "Aus drei Workflows wird ein System. Der Kunde fährt, der Coach schaut zu.", "offset_days": 28},
      {"kind": "checkin", "number": 30, "title": "Tag-30 Check-in", "goal": "Läuft es noch? Wo hakt es? Nächster Schritt.", "offset_days": 58}
    ],
    "coach_cadence": [
      {"title": "Recap raus: WhatsApp-Kurztext und Mail", "offset_hours": 2},
      {"title": "WhatsApp: Schon angefangen?", "offset_days": 1},
      {"title": "Mid-Week-Check per WhatsApp", "offset_days": 3},
      {"title": "Erinnerung an offene Aufgaben", "offset_days": 5},
      {"title": "Termin für den nächsten Call bestätigen", "offset_days": 6}
    ],
    "coach_prep": [
      {"title": "Call vorbereiten: Verlauf lesen, Drehbuch öffnen", "offset_days": -1}
    ]
  }'::jsonb
)
on conflict (key) do nothing;
