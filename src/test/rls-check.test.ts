import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const mig3 = readFileSync(join(process.cwd(), 'supabase/migrations/0003_rls_policies.sql'), 'utf8')
const mig2 = readFileSync(join(process.cwd(), 'supabase/migrations/0002_future_tables.sql'), 'utf8')
const mig1 = readFileSync(join(process.cwd(), 'supabase/migrations/0001_profiles.sql'), 'utf8')
const mig4 = readFileSync(join(process.cwd(), 'supabase/migrations/0004_today_support.sql'), 'utf8')

const TABLES = ['profiles', 'calendar_events', 'tasks', 'projects', 'goals', 'notes', 'journal_entries', 'cycle_entries', 'daily_plans']
const ALL_SQL = mig1 + mig2 + mig3 + mig4
const RLS_SQL = mig3 + mig4

describe('RLS isolation (static migration check)', () => {
  it('creates all 9 tables', () => {
    for (const t of TABLES) {
      expect(ALL_SQL.toLowerCase()).toContain(`create table if not exists public.${t}`)
    }
  })

  it('enables RLS on every table', () => {
    for (const t of TABLES) {
      expect(RLS_SQL.toLowerCase()).toContain(`alter table public.${t} enable row level security`)
    }
  })

  it('defines owner-only authenticated policies using auth.uid()', () => {
    const lower = RLS_SQL.toLowerCase()
    for (const t of TABLES) {
      expect(lower).toContain(`on public.${t}`)
    }
    expect(lower).toContain('auth.uid()')
    expect(lower).not.toContain('to public using (true)')
    expect(lower).not.toContain('to anon using (true)')
  })

  it('includes an isolation self-test block', () => {
    expect(mig3).toMatch(/RLS isolation check/i)
  })
})
