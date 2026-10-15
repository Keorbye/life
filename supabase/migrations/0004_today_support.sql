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
