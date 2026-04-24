-- Toolbox-Tools: zentrale Quelle für Kachel-Seite + Sidebar-Liste
-- Admins können Reihenfolge, Coming-Soon-Status und Metadaten pflegen.

create table if not exists public.toolbox_tools (
  id text primary key,
  title text not null,
  subtitle text,
  description text not null,
  href text,
  icon_name text not null default 'Wrench',
  icon_bg text not null default 'bg-gradient-to-br from-primary to-primary-hover',
  sort_order int not null default 0,
  coming_soon boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists toolbox_tools_sort_idx on public.toolbox_tools (sort_order);

-- RLS: alle authentifizierten User dürfen lesen, nur Admins schreiben.
alter table public.toolbox_tools enable row level security;

drop policy if exists "toolbox_tools_read_all" on public.toolbox_tools;
create policy "toolbox_tools_read_all"
  on public.toolbox_tools for select
  to authenticated
  using (true);

drop policy if exists "toolbox_tools_admin_write" on public.toolbox_tools;
create policy "toolbox_tools_admin_write"
  on public.toolbox_tools for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- updated_at auto-touch
create or replace function public.toolbox_tools_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists toolbox_tools_touch_updated_at on public.toolbox_tools;
create trigger toolbox_tools_touch_updated_at
  before update on public.toolbox_tools
  for each row execute function public.toolbox_tools_touch_updated_at();

-- Seed: aktuelle 3 Tools in Nav-Reihenfolge (Karussell → Video Editor → Video Creator)
insert into public.toolbox_tools
  (id, title, subtitle, description, href, icon_name, icon_bg, sort_order, coming_soon, published)
values
  (
    'carousel',
    'Karussell-Generator',
    'Pay-per-Use',
    'Instagram-Karussell-Slides aus deinem Text.',
    '/dashboard/ki-toolbox/carousel',
    'Palette',
    'bg-gradient-to-br from-pink-500 to-rose-600',
    10,
    false,
    true
  ),
  (
    'video-editor',
    'KI Video Editor',
    'Pay-per-Use',
    'KI analysiert Szenen und schlägt Schnitte vor.',
    '/dashboard/ki-toolbox/video-editor',
    'Film',
    'bg-gradient-to-br from-blue-500 to-indigo-600',
    20,
    true,
    true
  ),
  (
    'video-creator',
    'KI Video Creator',
    'Premium',
    'Komplette KI-Videos aus Prompt, URL oder Upload. Szenen, Bilder, Voiceover, Export.',
    '/dashboard/ki-toolbox/video-creator',
    'Video',
    'bg-gradient-to-br from-primary to-primary-hover',
    30,
    false,
    true
  )
on conflict (id) do nothing;
