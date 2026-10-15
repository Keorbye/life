import { CATEGORY_COLORS } from './EventForm'
import type { CalendarEvent, Project, Task } from '../lib/types'
import { expandRecurrence } from '../lib/calendar-utils'
import { toISODate } from '../lib/today-utils'

export type DayItem =
  | { kind: 'event'; id: string; title: string; time: string; color: string; allDay: boolean; event: CalendarEvent }
  | { kind: 'task'; id: string; title: string }
  | { kind: 'milestone'; id: string; title: string }

export function itemsForDay(
  day: Date,
  events: CalendarEvent[],
  tasks: Task[],
  projects: Project[],
): DayItem[] {
  const dayKey = toISODate(day)
  const from = new Date(day)
  from.setHours(0, 0, 0, 0)
  const to = new Date(day)
  to.setHours(23, 59, 59, 999)

  const items: DayItem[] = []
  for (const e of events) {
    const occ = expandRecurrence(e.starts_at, e.ends_at, e.recurrence_rule, e.recurrence_until, from, to)
    if (occ.length === 0) continue
    const color = e.color ?? CATEGORY_COLORS[e.category] ?? '#c9a24b'
    const time = e.is_all_day
      ? 'All day'
      : new Date(occ[0].start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    items.push({ kind: 'event', id: e.id, title: e.title, time, color, allDay: e.is_all_day, event: e })
  }

  for (const t of tasks) {
    if (t.done || !t.due_at) continue
    const d = new Date(t.due_at)
    if (toISODate(d) !== dayKey) continue
    items.push({ kind: 'task', id: `task-${t.id}`, title: `◈ ${t.title}` })
  }

  for (const p of projects) {
    if (!p.milestone_at) continue
    const d = new Date(p.milestone_at)
    if (toISODate(d) !== dayKey) continue
    items.push({ kind: 'milestone', id: `ms-${p.id}`, title: `⬑ ${p.milestone_label || p.name}` })
  }

  items.sort((a, b) => {
    const rank = (k: DayItem['kind']) => (k === 'event' ? 0 : k === 'task' ? 1 : 2)
    return rank(a.kind) - rank(b.kind)
  })
  return items.slice(0, 4)
}

export function MonthGrid({ days, monthCursor, onSelectDay, renderDay }: {
  days: Date[]
  monthCursor: Date
  onSelectDay: (d: Date) => void
  renderDay: (d: Date) => React.ReactNode
}) {
  const inMonth = (d: Date) => d.getMonth() === monthCursor.getMonth()
  return (
    <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label="Month view">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
        <div key={d} className="pb-1 text-center text-xs font-semibold uppercase tracking-wide text-[#8a7a65]">{d}</div>
      ))}
      {days.map((d, i) => (
        <div
          key={i}
          role="gridcell"
          tabIndex={0}
          onClick={() => onSelectDay(d)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectDay(d) } }}
          className={`min-h-[86px] cursor-pointer rounded-xl border p-1.5 text-left transition hover:border-[#c9a24b] ${
            inMonth(d) ? 'border-[#e7dcc8] bg-white/70' : 'border-transparent bg-[#f1e9da]/40 opacity-60'
          }`}
        >
          <span className="text-xs font-semibold text-[#5c4a3f]">{d.getDate()}</span>
          <div className="mt-1 space-y-0.5">{renderDay(d)}</div>
        </div>
      ))}
    </div>
  )
}
