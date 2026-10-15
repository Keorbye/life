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
