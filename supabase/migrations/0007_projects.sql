-- Project management (part 7): projects extend in place — Today, Calendar and the
-- task manager keep reading the same rows. Progress is derived from tasks, never stored.

alter table public.projects
  add column if not exists status text not null default 'active'
    check (status in ('active','upcoming','paused','completed','archived')),
  add column if not exists category text not null default 'personal'
    check (category in ('personal','work','health','family','finance','learning','spiritual','other')),
  add column if not exists start_at date,
  add column if not exists due_at timestamptz,
  add column if not exists notes text,
  add column if not exists color text;

-- Milestones: ordered checkpoints inside a project (owner-only RLS).
create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_project_milestones_updated on public.project_milestones;
create trigger trg_project_milestones_updated before update on public.project_milestones
  for each row execute function public.set_updated_at();

alter table public.project_milestones enable row level security;

drop policy if exists "project_milestones_owner_all" on public.project_milestones;
create policy "project_milestones_owner_all" on public.project_milestones
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
