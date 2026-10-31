-- Life migration 10: Pomodoro & Focus Timers
-- Includes built-in concentration timers, break timers, and stopwatch tools

create table if not exists public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('pomodoro', 'break', 'stopwatch')),
  duration_minutes integer not null default 25,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  completed boolean not null default false,
  task_id uuid references public.tasks(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_pomodoro()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pomodoro_sessions_updated on public.pomodoro_sessions;
create trigger trg_pomodoro_sessions_updated before update on public.pomodoro_sessions
  for each row execute function public.set_updated_at_pomodoro();