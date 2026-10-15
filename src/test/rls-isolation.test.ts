import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(join(process.cwd(), 'supabase/migrations/0003_rls_policies.sql'), 'utf8')
const tablesSql = readFileSync(join(process.cwd(), 'supabase/migrations/0002_future_tables.sql'), 'utf8')
const profilesSql = readFileSync(join(process.cwd(), 'supabase/migrations/0001_profiles.sql'), 'utf8')

const EXPECTED_TABLES = [
  'profiles',
  'calendar_events',
  'tasks',
  'projects',
  'goals',
  'notes',
  'journal_entries',
  'cycle_entries',
]

describe('RLS isolation (static migration check)', () => {
  it('creates all 8 tables', () => {
    const combined = migration + tablesSql + profilesSql
    for (const table of EXPECTED_TABLES) {
      expect(combined).toMatch(new RegExp(`create table if not exists public\\.${table}`, 'i'))
    }
  })

  it('enables RLS on every table', () => {
    for (const table of EXPECTED_TABLES) {
      expect(migration).toMatch(new RegExp(`alter table public\\.${table} enable row level security`, 'i'))
    }
  })

  it('defines owner-only authenticated policies using auth.uid()', () => {
    for (const table of EXPECTED_TABLES) {
      const policyRe = new RegExp(`create policy[^;]*on public\\.${table}[\\s\\S]*?auth\\.uid\\(\\)`, 'i')
      expect(migration).toMatch(policyRe)
    }
    // No permissive public/anon policies
    expect(migration).not.toMatch(/to\s+(public|anon)\s+using\s*\(\s*true\s*\)/i)
  })

  it('includes an isolation self-test block', () => {
    expect(migration).toMatch(/RLS isolation check/i)
  })
})
