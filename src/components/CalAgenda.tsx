import { useMemo } from 'react'
import type { CalendarEvent, Project, Task } from '../lib/types'
import { expandRecurrence } from '../lib/calendar-utils'
import { CATEGORY_COLORS } from './EventForm'

export function AgendaView({ from, days, events, tasks, projects, onSelectEvent }: {
  from: Date
  days: number
  events: CalendarEvent[]
  tasks: Task[]
  projects: Project[]
  onSelectEvent: (e: CalendarEvent) => void
}) {
  const rows = useMemo(() => {
    const out: { date: Date; label: string; items: { key: string; text: string; sub: string; color?: string; event?: CalendarEvent }[] }[] = []
    for (let i = 0; i < days; i += 1) {
      const d = new Date(from)
      d.setDate(d.getDate() + i)
      const dayStart = new Date(d)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(d)
      dayEnd.setHours(23, 59, 59, 999)
      const items: { key: string; text: string; sub: string; color?: string; event?: CalendarEvent }[] = []
      for (const e of events) {
        const occ = expandRecurrence(e.starts_at, e.ends_at, e.recurrence_rule, e.recurrence_until, dayStart, dayEnd)
        if (occ.length === 0) continue
        items.push({
          key: `e-${e.id}`,
          text: e.title,
          sub: e.is_all_day ? 'All day' : new Date(occ[0].start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          color: e.color ?? CATEGORY_COLORS[e.category],
          event: e,
        })
      }
      for (const t of tasks) {
        if (t.done || !t.due_at) continue
        const dd = new Date(t.due_at)
        if (dd.toDateString() !== d.toDateString()) continue
        items.push({ key: `t-${t.id}`, text: `◈ ${t.title} (due)`, sub: 'Task deadline' })
      }
      for (const p of projects) {
        if (!p.milestone_at) continue
        const dd = new Date(p.milestone_at)
        if (dd.toDateString() !== d.toDateString()) continue
        items.push({ key: `m-${p.id}`, text: `⬑ ${p.milestone_label || p.name}`, sub: 'Milestone' })
      }
      out.push({
        date: d,
        label: d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }),
        items,
      })
    }
    return out.filter((r) => r.items.length > 0)
  }, [from, days, events, tasks, projects])

  if (rows.length === 0) {
    return <p className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-6 text-center text-sm text-[#8a7a65]">Nothing coming up. Calm.</p>
  }

  return (
    <div className="space-y-3" role="list" aria-label="Agenda view">
      {rows.map((r) => (
        <div key={r.date.toISOString()} className="rounded-2xl border border-[#e7dcc8] bg-white/70 p-4" role="listitem">
          <h3 className="font-serif text-base text-[#3e342c]">{r.label}</h3>
          <ul className="mt-2 space-y-1.5">
            {r.items.map((it) => (
              <li key={it.key}>
                {it.event ? (
                  <button onClick={() => onSelectEvent(it.event as CalendarEvent)} className="flex w-full items-center gap-2 rounded-xl border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-left">
                    <span className="h-6 w-1.5 rounded-full" style={{ background: it.color }} aria-hidden />
                    <span className="flex-1 text-sm font-medium text-[#3e342c]">{it.text}</span>
                    <span className="text-xs text-[#8a7a65]">{it.sub}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-[#f1e9da]/50 px-3 py-2">
                    <span className="flex-1 text-sm text-[#5c4a3f]">{it.text}</span>
                    <span className="text-xs text-[#8a7a65]">{it.sub}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
