-- Task & action manager (part 6): one task row powers every view.
-- Extends tasks in place — list/board/calendar/focus lists all read the same rows.
-- done boolean is kept in sync with status='done' by trigger (Today reads done; board reads status).

alter table public.tasks
  add column if not exists description text,
  add column if not exists status text not null default 'todo'
    check (status in ('todo','in_progress','blocked','done')),
  add column if not exists priority text not null default 'medium'
    check (priority in ('low','medium','high')),
  add column if not exists category text not null default 'personal'
    check (category in ('personal','work','health','family','finance','learning','spiritual','other')),
  add column if not exists scheduled_time time,
  add column if not exists estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  add column if not exists energy text check (energy is null or energy in ('low','medium','high')),
  add column if not exists notes text,
  add column if not exists is_quick boolean not null default false,
  add column if not exists goal_id uuid references public.goals(id) on delete set null;

-- done <-> status sync: whichever column the user changes drives the other.
create or replace function public.sync_task_done_status()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE'
     and new.done is distinct from old.done
     and new.status is distinct from old.status then
    -- both changed explicitly: status wins
    new.done := (new.status = 'done');
  elsif tg_op = 'UPDATE' and new.done is distinct from old.done then
    -- completion toggled (checkbox): drive status
    new.status := case when new.done then 'done' else 'todo' end;
  else
    -- status changed (board/modal) or insert: mirror into done
    new.done := (new.status = 'done');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_task_done_status on public.tasks;
create trigger trg_task_done_status before insert or update on public.tasks
  for each row execute function public.sync_task_done_status();

-- Subtasks belong to a task (never become task rows themselves).
create table if not exists public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_task_subtasks_updated on public.task_subtasks;
create trigger trg_task_subtasks_updated before update on public.task_subtasks
  for each row execute function public.set_updated_at();

alter table public.task_subtasks enable row level security;

drop policy if exists "task_subtasks_owner_all" on public.task_subtasks;
create policy "task_subtasks_owner_all" on public.task_subtasks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
