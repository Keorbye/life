// Pure project logic: grouping, progress, next action, timeline geometry.
// No Supabase calls here — fully unit-tested. Rows are referenced, never copied.

import type { Project, ProjectMilestone, ProjectStatus, Task } from './types'
import { PROJECT_STATUSES } from './types'
import { compareForAction, taskProgress } from './task-utils'
import { todayISO } from './today-utils'

export type ProjectProgress = { done: number; remaining: number; total: number; percent: number }

/** Progress derived from the project's task rows — never stored, never stale. */
export function projectProgress(tasks: Task[], projectId: string): ProjectProgress {
  return taskProgress(tasks.filter((t) => t.project_id === projectId))
}

export function groupByStatus(projects: Project[]): { status: ProjectStatus; label: string; hint: string; projects: Project[] }[] {
  return PROJECT_STATUSES.map((s) => ({
    ...s,
    projects: projects.filter((p) => p.status === s.key),
  }))
}

/** The single next action for a project: first actionable open task. */
export function projectNextAction(tasks: Task[], projectId: string): Task | null {
  const open = tasks.filter((t) => t.project_id === projectId && !t.done)
  if (open.length === 0) return null
  return open.sort(compareForAction)[0] ?? null
}

/** Upcoming + overdue deadlines for a project: tasks with due dates, sorted. */
export function projectDeadlines(tasks: Task[], projectId: string, includeDone = false): Task[] {
  return tasks
    .filter((t) => t.project_id === projectId && t.due_at != null && (includeDone || !t.done))
    .sort((a, b) => new Date(a.due_at as string).getTime() - new Date(b.due_at as string).getTime())
}

export function milestoneProgress(milestones: ProjectMilestone[]): { done: number; total: number } {
  return { done: milestones.filter((m) => m.done).length, total: milestones.length }
}

export function upcomingMilestones(milestones: ProjectMilestone[], today = todayISO()): ProjectMilestone[] {
  return milestones
    .filter((m) => !m.done && m.due_at != null)
    .sort((a, b) => new Date(a.due_at as string).getTime() - new Date(b.due_at as string).getTime())
    .concat(milestones.filter((m) => !m.done && m.due_at == null))
}

/** Is the project deadline within `days` of today (or past)? */
export function deadlineState(project: Project, today = todayISO()): 'none' | 'overdue' | 'soon' | 'later' {
  if (!project.due_at) return 'none'
  const due = todayISO(new Date(project.due_at))
  if (due < today) return 'overdue'
  if (due <= addDays(today, 7)) return 'soon'
  return 'later'
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

export type TimelineBar = {
  project: Project
  /** Percent positions within the window, clamped to [0, 100]. */
  leftPercent: number
  widthPercent: number
  dueInside: boolean
}

/**
 * Gantt-style bars over a date window. Projects without any dates are skipped
 * (they show in the list view instead). Start defaults to creation day; a
 * project with only a deadline gets a bar ending at the deadline.
 */
export function timelineBars(projects: Project[], windowStart: Date, windowEnd: Date): TimelineBar[] {
  const wStart = windowStart.getTime()
  const wEnd = windowEnd.getTime()
  const span = Math.max(1, wEnd - wStart)
  const out: TimelineBar[] = []
  for (const p of projects) {
    if (p.status === 'archived') continue
    const end = p.due_at ? new Date(p.due_at).getTime() : null
    const start = p.start_at ? new Date(`${p.start_at}T00:00:00`).getTime() : null
    if (start == null && end == null) continue
    const s = start ?? (end as number) - 14 * 24 * 3600 * 1000 // default 2-week bar
    const e = end ?? Math.min(wEnd, s + 30 * 24 * 3600 * 1000) // open-ended: 30 days from start
    if (e < wStart || s > wEnd) continue
    const clampedStart = Math.max(s, wStart)
    const clampedEnd = Math.min(e, wEnd)
    const leftPercent = ((clampedStart - wStart) / span) * 100
    const widthPercent = Math.max(2, ((clampedEnd - clampedStart) / span) * 100)
    out.push({
      project: p,
      leftPercent: Math.min(98, leftPercent),
      widthPercent: Math.min(100 - leftPercent, widthPercent),
      dueInside: end != null && end >= wStart && end <= wEnd,
    })
  }
  return out.sort((a, b) => a.leftPercent - b.leftPercent)
}

/** Status change helper — returns the patch for a single UPDATE (same row). */
export function statusPatch(status: ProjectStatus): { status: ProjectStatus } {
  return { status }
}
