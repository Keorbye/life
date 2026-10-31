-- Life migration 12: Knowledge & Insight Logs (Resources)
-- Track topics or spaces of ongoing interest.
-- Book summaries, reading lists, research items, reference frameworks
-- supporting hobbies or career

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('book', 'article', 'research', 'framework', 'reference', 'other')),
  category text not null check (category in ('career', 'hobbies', 'health', 'finance', 'education', 'other')),
  summary text,
  author text,
  read_status text not null default 'unread' check (read_status in ('unread', 'reading', 'read', 'favorite')),
  progress_percentage integer not null default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  tags text[], -- Array of tags for categorization
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_resources()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_resources_updated on public.resources;
create trigger trg_resources_updated before update on public.resources
  for each row execute function public.set_updated_at_resources();