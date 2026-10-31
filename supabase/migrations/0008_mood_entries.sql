-- Life migration 8: Mood & Wellbeing Logging
-- Records emotional states, stress levels, energy, and mental health patterns

create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null check (mood in ('excellent', 'good', 'neutral', 'poor', 'terrible')),
  stress_level integer not null check (stress_level >= 0 and stress_level <= 10),
  energy_level integer not null check (energy_level >= 1 and energy_level <= 10),
  notes text,
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_mood()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_mood_entries_updated on public.mood_entries;
create trigger trg_mood_entries_updated before update on public.mood_entries
  for each row execute function public.set_updated_at_mood();