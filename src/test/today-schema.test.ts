import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const todaySql = readFileSync(join(process.cwd(), 'supabase/migrations/0004_today_support.sql'), 'utf8')
const rlsSql = readFileSync(join(process.cwd(), 'supabase/migrations/0003_rls_policies.sql'), 'utf8')

describe('Today schema (no-duplicate design)', () => {
  it('adds bucket + scheduling columns to tasks instead of new tables', () => {
    expect(todaySql).toMatch(/alter table public\.tasks/i)
    expect(todaySql).toMatch(/bucket/i)
    expect(todaySql).toMatch(/scheduled_for/i)
    expect(todaySql).toMatch(/priority_rank/i)
    // No duplicate-task tables
    expect(todaySql).not.toMatch(/create table public\.today_/i)
    expect(todaySql).not.toMatch(/create table public\.priorities/i)
  })

  it('creates one daily_plans row per user per day with RLS', () => {
    expect(todaySql).toMatch(/create table if not exists public\.daily_plans/i)
    expect(todaySql).toMatch(/unique \(user_id, plan_date\)/i)
    expect(todaySql).toMatch(/daily_plans enable row level security/i)
    expect(todaySql).toMatch(/auth\.uid\(\)/i)
  })

  it('keeps owner-only RLS intact', () => {
    expect(rlsSql).toMatch(/tasks_owner_all/i)
    expect(rlsSql).toMatch(/using \(user_id = auth\.uid\(\)\)/i)
  })
})
