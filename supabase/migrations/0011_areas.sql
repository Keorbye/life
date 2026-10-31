-- Life migration 11: Life Dashboard Pillars (Areas)
-- Track ongoing responsibilities without an end date.
-- Rolling logs for finance trackers, fitness statistics, habit streaks, mental health check-ins

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in ('finance', 'fitness', 'health', 'family', 'career', 'habits', 'mental_health', 'other')),
  target_frequency text, -- e.g., 'daily', 'weekly', 'monthly', 'yearly'
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_activity_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_areas()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_areas_updated on public.areas;
create trigger trg_areas_updated before update on public.areas
  for each row execute function public.set_updated_at_areas();