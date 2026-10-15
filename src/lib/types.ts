// Shared Today-page row shapes. One task row lives in exactly one bucket
// and is referenced by id everywhere (priorities, sections) — never copied.

export const FUTURE_TABLES = [
  'calendar_events',
  'tasks',
  'projects',
  'goals',
  'notes',
  'journal_entries',
  'cycle_entries',
] as const

export type OwnedRow = {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

export type TaskBucket = 'must' | 'should' | 'could' | 'waiting' | 'unscheduled'

export type Task = OwnedRow & {
  title: string
  done: boolean
  due_at: string | null
  bucket: TaskBucket
  scheduled_for: string | null
  priority_rank: 1 | 2 | 3 | null
  project_id: string | null
  waiting_on: string | null
}

export type EventCategory = 'personal' | 'work' | 'health' | 'family' | 'finance' | 'learning' | 'spiritual' | 'other'

export type CalendarEvent = OwnedRow & {
  title: string
  starts_at: string
  ends_at: string | null
  description: string | null
  is_all_day: boolean
  category: EventCategory
  color: string | null
  location: string | null
  link_url: string | null
  reminder_minutes: number | null
  project_id: string | null
  task_id: string | null
  recurrence_rule: 'daily' | 'weekly' | 'monthly' | null
  recurrence_until: string | null
}

export type Project = OwnedRow & {
  name: string
  description: string | null
  milestone_at: string | null
  milestone_label: string | null
}

export type DailyPlan = OwnedRow & {
  plan_date: string
  intention: string | null
}

export type Profile = {
  id: string
  email: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export const TODAY_BUCKETS: { key: TaskBucket; label: string; hint: string }[] = [
  { key: 'must', label: 'Must Do', hint: 'Non-negotiable today' },
  { key: 'should', label: 'Should Do', hint: 'Important, flexible timing' },
  { key: 'could', label: 'Could Do', hint: 'If energy allows' },
  { key: 'waiting', label: 'Waiting For', hint: 'Blocked on someone or something' },
  { key: 'unscheduled', label: 'Unscheduled Tasks', hint: 'Parked, no day assigned' },
]
