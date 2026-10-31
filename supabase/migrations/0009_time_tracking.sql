-- Life migration 9: Time Tracking by Label
-- Records time separately for each custom subject with color labels and statistics

create table if not exists public.time_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  color_code text not null default '#3b82f6',
  minutes integer not null default 0,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_time_tracking()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_time_tracking_updated on public.time_tracking;
create trigger trg_time_tracking_updated before update on public.time_tracking
  for each row execute function public.set_updated_at_time_tracking();