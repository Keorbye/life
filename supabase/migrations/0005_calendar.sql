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
