import { useMemo, useState } from 'react'
import type { CalendarEvent } from '../lib/types'
import type { EventInput } from '../lib/useCalendar'
import { createEvent, deleteEvent, updateEvent, useCalendar } from '../lib/useCalendar'
import { Alert, Button } from '../components/ui'
import { EventModal } from '../components/EventModal'
import type { ModalInit } from '../components/EvBase'
import { MonthGrid, itemsForDay } from '../components/CalMonth'
import { DayView, WeekView } from '../components/CalWeekDay'
import { AgendaView } from '../components/CalAgenda'
import { endOfDay, endOfMonth, endOfWeek, expandRecurrence, monthGridDays, startOfDay, startOfMonth, startOfWeek } from '../lib/calendar-utils'

type View = 'month' | 'week' | 'day' | 'agenda'
const VIEWS: View[] = ['month', 'week', 'day', 'agenda']

export default function CalendarPage() {
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [modal, setModal] = useState<ModalInit | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const range = useMemo(() => {
    if (view === 'month') return { start: startOfWeek(startOfMonth(cursor)), end: endOfWeek(endOfMonth(cursor)) }
    if (view === 'week') return { start: startOfWeek(cursor), end: endOfWeek(cursor) }
    if (view === 'day') return { start: startOfDay(selectedDay), end: endOfDay(selectedDay) }
    const start = startOfDay(selectedDay)
    const end = new Date(start)
    end.setDate(end.getDate() + 29)
    return { start, end: endOfDay(end) }
  }, [view, cursor, selectedDay])

  const { loading, error, setError, events, setEvents, tasks, projects, refresh, user } = useCalendar(range.start, range.end)

  async function onSave(input: EventInput, id?: string): Promise<string | null> {
    if (!user) return 'Not signed in.'
    setActionError(null)
    if (id) {
      const res = await updateEvent(id, input)
      if (res.error) return res.error
      setEvents((prev) => prev.map((e) => (e.id === id ? (res.event as CalendarEvent) : e)))
      return null
    }
    const res = await createEvent(user.id, input)
    if (res.error) return res.error
    if (res.event) setEvents((prev) => [...prev, res.event as CalendarEvent])
    return null
  }

  async function onDelete(id: string): Promise<string | null> {
    setActionError(null)
    const res = await deleteEvent(id)
    if (res.error) return res.error
    setEvents((prev) => prev.filter((e) => e.id !== id))
    return null
  }

  function openNew(day: Date, hour = 9) {
    const start = new Date(day)
    start.setHours(hour, 0, 0, 0)
    const end = new Date(start)
    end.setHours(end.getHours() + 1)
    setModal({ starts_at: start.toISOString(), ends_at: end.toISOString(), is_all_day: false })
  }

  function shift(delta: number) {
    const next = new Date(cursor)
    if (view === 'month') next.setMonth(next.getMonth() + delta)
    else if (view === 'week') next.setDate(next.getDate() + 7 * delta)
    else next.setDate(next.getDate() + delta)
    setCursor(next)
    if (view !== 'month') setSelectedDay(next)
  }

  const reminders = useMemo(() => {
    const now = Date.now()
    const horizon = now + 24 * 3600 * 1000
    return events
      .filter((e) => e.reminder_minutes != null)
      .map((e) => ({ e, fireAt: new Date(e.starts_at).getTime() - (e.reminder_minutes ?? 0) * 60000 }))
      .filter((r) => r.fireAt <= horizon && r.fireAt + 3600000 >= now)
      .sort((a, b) => a.fireAt - b.fireAt)
  }, [events])

  const title = view === 'month'
    ? cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })
    : view === 'week'
      ? `Week of ${startOfWeek(cursor).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
      : (view === 'day' ? selectedDay : selectedDay).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  if (loading) return <p className="py-16 text-center text-[#8a7a65]">Loading calendar…</p>

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      {error && <Alert kind="error">{error}</Alert>}
      {actionError && <Alert kind="error">{actionError}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-3xl text-[#3e342c]">Calendar</h1>
          <span className="text-sm text-[#8a7a65]">{title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="ghost" onClick={() => shift(-1)} aria-label="Previous">‹ Prev</Button>
          <Button variant="ghost" onClick={() => { setCursor(new Date()); setSelectedDay(new Date()) }}>Today</Button>
          <Button variant="ghost" onClick={() => shift(1)} aria-label="Next">Next ›</Button>
          <span className="mx-1 hidden h-5 w-px bg-[#e7dcc8] sm:block" />
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`rounded-lg px-2.5 py-1.5 text-sm font-medium capitalize ${view === v ? 'bg-[#5c4a3f] text-[#faf6ef]' : 'text-[#5c4a3f] hover:bg-[#f1e9da]'}`}
            >
              {v}
            </button>
          ))}
          <Button onClick={() => openNew(selectedDay)} className="ml-1">+ New event</Button>
        </div>
      </div>

      {reminders.length > 0 && (
        <div className="rounded-2xl border border-[#e6d3a3] bg-[#faf3df] p-3" role="status">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5a2e]">Reminders</p>
          <ul className="mt-1 space-y-0.5 text-sm text-[#6b5a2e]">
            {reminders.slice(0, 4).map(({ e, fireAt }) => (
              <li key={e.id}>🔔 {e.title} — {new Date(fireAt).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</li>
            ))}
          </ul>
        </div>
      )}

      {view === 'month' && (
        <MonthGrid
          days={monthGridDays(cursor)}
          monthCursor={cursor}
          onSelectDay={(d) => { setSelectedDay(d); setCursor(d); setView('day') }}
          renderDay={(d) => (
            <>
              {itemsForDay(d, events, tasks, projects).map((it) => (
                it.kind === 'event' ? (
                  <button
                    key={it.id}
                    onClick={(ev) => { ev.stopPropagation(); setModal({ ...it.event }) }}
                    className="block w-full truncate rounded px-1 text-left text-[10px] font-medium"
                    style={{ background: `${it.color}22`, color: '#3e342c', borderLeft: `2px solid ${it.color}` }}
                  >
                    {it.time !== 'All day' ? `${it.time} ` : ''}{it.title}
                  </button>
                ) : (
                  <span key={it.id} className="block truncate text-[10px] text-[#8a7a65]">{it.title}</span>
                )
              ))}
            </>
          )}
        />
      )}

      {view === 'week' && (
        <WeekView
          days={Array.from({ length: 7 }, (_, i) => { const d = startOfWeek(cursor); d.setDate(d.getDate() + i); return d })}
          eventsForDay={(d) => dayEvents(d)}
          onSelectEvent={(e) => setModal({ ...e })}
          onSelectSlot={(d, h) => openNew(d, h)}
        />
      )}

      {view === 'day' && (
        <DayView day={selectedDay} events={dayEvents(selectedDay)} onSelectEvent={(e) => setModal({ ...e })} onSelectSlot={(h) => openNew(selectedDay, h)} />
      )}

      {view === 'agenda' && (
        <AgendaView from={selectedDay} days={30} events={events} tasks={tasks} projects={projects} onSelectEvent={(e) => setModal({ ...e })} />
      )}

      {modal && (
        <EventModal
          init={modal}
          projects={projects}
          tasks={tasks}
          allEvents={events}
          onSave={onSave}
          onDelete={onDelete}
          onClose={() => { setModal(null); setError(null); void refresh() }}
        />
      )}
      <p className="pb-2 text-center text-xs text-[#8a7a65]">
        Events, deadlines and milestones read from the same rows as Today — changes here appear there immediately.
      </p>
    </div>
  )

  function dayEvents(d: Date): CalendarEvent[] {
    const from = startOfDay(d)
    const to = endOfDay(d)
    const out: CalendarEvent[] = []
    for (const e of events) {
      const occ = expandRecurrence(e.starts_at, e.ends_at, e.recurrence_rule, e.recurrence_until, from, to)
      if (occ.length > 0) out.push(e)
    }
    return out
  }
}
