-- ===========================================================
-- Life - complete database setup (all migrations in order)
-- Paste this whole file into Supabase SQL Editor, then Run.
-- ===========================================================

-- ########## 0001_profiles.sql ##########
-- Life secure foundation migration (part 1: profiles + helpers)
-- No seed data. Owner-only RLS via auth.uid().

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();


-- ########## 0002_future_tables.sql ##########
-- Life secure foundation migration (part 2: future tables, empty)
-- Calendar, tasks, projects, goals, notes, journal, cycle â€” structure only.

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cycle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_calendar_events_updated on public.calendar_events;
create trigger trg_calendar_events_updated before update on public.calendar_events
  for each row execute function public.set_updated_at();
drop trigger if exists trg_tasks_updated on public.tasks;
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function public.set_updated_at();
drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();
drop trigger if exists trg_goals_updated on public.goals;
create trigger trg_goals_updated before update on public.goals
  for each row execute function public.set_updated_at();
drop trigger if exists trg_notes_updated on public.notes;
create trigger trg_notes_updated before update on public.notes
  for each row execute function public.set_updated_at();
drop trigger if exists trg_journal_updated on public.journal_entries;
create trigger trg_journal_updated before update on public.journal_entries
  for each row execute function public.set_updated_at();
drop trigger if exists trg_cycle_updated on public.cycle_entries;
create trigger trg_cycle_updated before update on public.cycle_entries
  for each row execute function public.set_updated_at();


-- ########## 0003_rls_policies.sql ##########
-- Life secure foundation migration (part 3: RLS + isolation self-test)

alter table public.profiles enable row level security;
alter table public.calendar_events enable row level security;
alter table public.tasks enable row level security;
alter table public.projects enable row level security;
alter table public.goals enable row level security;
alter table public.notes enable row level security;
alter table public.journal_entries enable row level security;
alter table public.cycle_entries enable row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "calendar_events_owner_all" on public.calendar_events;
create policy "calendar_events_owner_all" on public.calendar_events
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "tasks_owner_all" on public.tasks;
create policy "tasks_owner_all" on public.tasks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "projects_owner_all" on public.projects;
create policy "projects_owner_all" on public.projects
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "goals_owner_all" on public.goals;
create policy "goals_owner_all" on public.goals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notes_owner_all" on public.notes;
create policy "notes_owner_all" on public.notes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "journal_entries_owner_all" on public.journal_entries;
create policy "journal_entries_owner_all" on public.journal_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "cycle_entries_owner_all" on public.cycle_entries;
create policy "cycle_entries_owner_all" on public.cycle_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Isolation self-test: verifies RLS enabled + owner-only policy on all 8 tables.
do $$
declare
  t text;
  missing text[] := '{}';
begin
  foreach t in array array['profiles','calendar_events','tasks','projects','goals','notes','journal_entries','cycle_entries']
  loop
    if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = t) then
      missing := missing || (t || ':table-missing');
    elsif not exists (
      select 1 from pg_tables where schemaname = 'public' and tablename = t and rowsecurity = true
    ) then
      missing := missing || (t || ':rls-disabled');
    elsif not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and roles = '{authenticated}'
        and (qual ilike '%auth.uid()%' and with_check ilike '%auth.uid()%')
    ) then
      missing := missing || (t || ':owner-policy-missing');
    end if;
  end loop;
  if array_length(missing, 1) > 0 then
    raise exception 'RLS isolation check failed: %', array_to_string(missing, ', ');
  end if;
  raise notice 'RLS isolation check passed for all 8 tables.';
end $$;


-- ########## 0004_today_support.sql ##########
-- Today page support (part 4): task organisation without duplicate rows.
-- One task row can appear in exactly one Today bucket via columns, never copied.

alter table public.tasks
  add column if not exists bucket text not null default 'unscheduled'
    check (bucket in ('must','should','could','waiting','unscheduled')),
  add column if not exists scheduled_for date,
  add column if not exists priority_rank smallint check (priority_rank in (1, 2, 3)),
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists waiting_on text;

-- One daily plan row per user per day for intention + priorities snapshot.
create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null default current_date,
  intention text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

drop trigger if exists trg_daily_plans_updated on public.daily_plans;
create trigger trg_daily_plans_updated before update on public.daily_plans
  for each row execute function public.set_updated_at();

alter table public.daily_plans enable row level security;

drop policy if exists "daily_plans_owner_all" on public.daily_plans;
create policy "daily_plans_owner_all" on public.daily_plans
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ########## 0005_calendar.sql ##########
-- Calendar feature (part 5): rich events without breaking Today sync.
-- Extends calendar_events in place; Today reads the same rows.

alter table public.calendar_events
  add column if not exists is_all_day boolean not null default false,
  add column if not exists category text not null default 'personal'
    check (category in ('personal','work','health','family','finance','learning','spiritual','other')),
  add column if not exists color text,
  add column if not exists location text,
  add column if not exists link_url text,
  add column if not exists reminder_minutes integer check (reminder_minutes is null or reminder_minutes >= 0),
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists task_id uuid references public.tasks(id) on delete set null,
  add column if not exists recurrence_rule text check (recurrence_rule is null or recurrence_rule in ('daily','weekly','monthly')),
  add column if not exists recurrence_until date;

-- Project milestones shown on the calendar (optional dates on projects).
alter table public.projects
  add column if not exists milestone_at timestamptz,
  add column if not exists milestone_label text;

