// Pure task/action logic: filters, view selections, reschedule math.
// No Supabase calls here — fully unit-tested. All functions return the same
// task rows (by reference) — views never receive copies.

import type { Task, TaskBucket, TaskPriority, TaskStatus } from './types'
import { addDaysISO, todayISO } from './today-utils'

export type DueWindow = 'any' | 'overdue' | 'today' | 'week' | 'none'
export type TimeFit = 'any' | 'quick' | 'half' | 'hour' | 'deep'

export type TaskFilters = {
  priority: TaskPriority | 'any'
  status: TaskStatus | 'any'
  due: DueWindow
  projectId: string | 'any' | 'none'
  fitsMinutes: number | null // null = no time filter
  energy: 'low' | 'medium' | 'high' | 'any'
}

export const EMPTY_FILTERS: TaskFilters = {
  priority: 'any',
  status: 'any',
  due: 'any',
  projectId: 'any',
  fitsMinutes: null,
  energy: 'any',
}

/** Time-fit presets for the "available time" filter. */
export const TIME_FITS: { key: TimeFit; label: string; minutes: number | null }[] = [
  { key: 'any', label: 'Any length', minutes: null },
  { key: 'quick', label: 'Quick (≤ 15 min)', minutes: 15 },
  { key: 'half', label: 'Half hour (≤ 30 min)', minutes: 30 },
  { key: 'hour', label: 'Up to an hour', minutes: 60 },
  { key: 'deep', label: 'Deep work (≥ 60 min)', minutes: -60 },
]

export function dueBucket(dueAt: string | null, today = todayISO()): DueWindow {
  if (!dueAt) return 'none'
  const key = todayISO(new Date(dueAt))
  if (new Date(`${key}T23:59:59.999`) < new Date(`${today}T00:00:00`)) return 'overdue'
  if (key === today) return 'today'
  if (key <= addDaysISO(today, 7)) return 'week'
  return 'any'
}

/** Apply all filters. positive fitsMinutes = at most; negative = at least (deep work). */
export function filterTasks(tasks: Task[], f: TaskFilters, today = todayISO()): Task[] {
  return tasks.filter((t) => {
    if (f.priority !== 'any' && t.priority !== f.priority) return false
    if (f.status !== 'any' && t.status !== f.status) return false
    if (f.due !== 'any' && dueBucket(t.due_at, today) !== f.due) return false
    if (f.projectId === 'none' && t.project_id !== null) return false
    if (f.projectId !== 'any' && f.projectId !== 'none' && t.project_id !== f.projectId) return false
    if (f.energy !== 'any' && t.energy !== f.energy) return false
    if (f.fitsMinutes !== null) {
      if (f.fitsMinutes < 0) {
        const min = -f.fitsMinutes
        if (t.estimated_minutes == null || t.estimated_minutes < min) return false
      } else if (t.estimated_minutes != null && t.estimated_minutes > f.fitsMinutes) {
        return false
      }
    }
    return true
  })
}

/** GTD next actions: open, actionable (bucket must/should/could), not blocked. */
export function nextActions(tasks: Task[], today = todayISO()): Task[] {
  const actionable: TaskBucket[] = ['must', 'should', 'could']
  return tasks
    .filter((t) => !t.done && t.status !== 'blocked' && actionable.includes(t.bucket))
    .sort((a, b) => compareForAction(a, b, today))
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const

/** Urgency-first ordering: overdue → today → priority → due date. */
export function compareForAction(a: Task, b: Task, today = todayISO()): number {
  const bucketRank = (t: Task): number => {
    const w = dueBucket(t.due_at, today)
    if (w === 'overdue') return 0
    if (w === 'today') return 1
    if (t.scheduled_for && t.scheduled_for <= today) return 2
    return 3
  }
  const br = bucketRank(a) - bucketRank(b)
  if (br !== 0) return br
  const pp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  if (pp !== 0) return pp
  const ad = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER
  const bd = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER
  return ad - bd
}

export function quickList(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.is_quick && !t.done)
}

export function waitingList(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.done && (t.bucket === 'waiting' || t.waiting_on != null))
}

export function unscheduledInbox(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.done && t.bucket === 'unscheduled' && t.scheduled_for == null)
}

/** Board columns: group by status, preserving action order inside each column. */
export function boardColumns(tasks: Task[]): { status: TaskStatus; tasks: Task[] }[] {
  const statuses: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done']
  return statuses.map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status).sort((a, b) => compareForAction(a, b)),
  }))
}

export type PostponeResult = { due_at: string | null; scheduled_for: string | null }

/**
 * Postpone a task by days: shifts due date and scheduled day together.
 * Tasks with no dates get their scheduled day from today so the shift is visible.
 */
export function postponeTaskDates(task: Task, days: number, today = todayISO()): PostponeResult {
  const base = task.due_at ? todayISO(new Date(task.due_at)) : (task.scheduled_for ?? today)
  const next = addDaysISO(base, days)
  return {
    due_at: task.due_at ? shiftIsoDate(task.due_at, next) : null,
    scheduled_for: task.scheduled_for ? next : null,
  }
}

function shiftIsoDate(iso: string, newDay: string): string {
  const d = new Date(iso)
  const [y, m, day] = newDay.split('-').map(Number)
  d.setFullYear(y, m - 1, day)
  return d.toISOString()
}

/** Combine scheduled_for date + scheduled_time into a sortable label. */
export function scheduleLabel(t: Task): string {
  if (!t.scheduled_for) return ''
  if (!t.scheduled_time) return t.scheduled_for
  return `${t.scheduled_for} ${t.scheduled_time.slice(0, 5)}`
}

/** Tasks on a given day: scheduled that day OR due that day (same rows, deduped by id). */
export function tasksForDay(tasks: Task[], day: string): Task[] {
  const seen = new Set<string>()
  const out: Task[] = []
  for (const t of tasks) {
    if (t.done) continue
    const dueDay = t.due_at ? todayISO(new Date(t.due_at)) : null
    if ((t.scheduled_for === day || dueDay === day) && !seen.has(t.id)) {
      seen.add(t.id)
      out.push(t)
    }
  }
  return out.sort((a, b) => compareForAction(a, b, day))
}

/** Progress helper shared by project cards: done vs remaining counts. */
export function taskProgress(tasks: { done: boolean }[]): { done: number; remaining: number; total: number; percent: number } {
  const total = tasks.length
  const done = tasks.filter((t) => t.done).length
  return { done, remaining: total - done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
}

