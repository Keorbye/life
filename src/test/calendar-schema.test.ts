import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const mig5 = readFileSync(join(process.cwd(), 'supabase/migrations/0005_calendar.sql'), 'utf8')
const mig3 = readFileSync(join(process.cwd(), 'supabase/migrations/0003_rls_policies.sql'), 'utf8')

describe('calendar schema (migration 0005)', () => {
  it('extends calendar_events with feature columns in place (no duplicate table)', () => {
    const lower = mig5.toLowerCase()
    expect(lower).toContain('alter table public.calendar_events')
    for (const col of ['is_all_day', 'category', 'color', 'location', 'link_url', 'reminder_minutes', 'project_id', 'task_id', 'recurrence_rule', 'recurrence_until']) {
      expect(lower).toContain(col)
    }
    // Never a second events table (keeps Today sync on one source)
    expect(lower).not.toContain('create table if not exists public.events')
    expect(lower).not.toContain('create table if not exists public.calendar_events_copy')
  })

  it('adds project milestones for calendar display', () => {
    expect(mig5.toLowerCase()).toContain('alter table public.projects')
    expect(mig5.toLowerCase()).toContain('milestone_at')
  })

  it('keeps owner-only RLS on calendar_events', () => {
    expect(mig3).toMatch(/calendar_events_owner_all/i)
    expect(mig3).toMatch(/using \(user_id = auth\.uid\(\)\)/i)
    // 0005 adds no permissive policies
    expect(mig5.toLowerCase()).not.toContain('create policy')
  })
})
