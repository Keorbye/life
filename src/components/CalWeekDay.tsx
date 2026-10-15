import type { CalendarEvent } from '../lib/types'
import { detectOverlaps, overlapWarningText } from '../lib/calendar-utils'
import { CATEGORY_COLORS } from './EventForm'

const HOURS = Array.from({ length: 24 }, (_, h) => h)

export function WeekView({ days, eventsForDay, onSelectEvent, onSelectSlot }: {
  days: Date[]
  eventsForDay: (d: Date) => CalendarEvent[]
  onSelectEvent: (e: CalendarEvent) => void
  onSelectSlot: (d: Date, hour: number) => void
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label="Week view">
      {days.map((d, i) => {
        const evts = eventsForDay(d)
        const overlaps = detectOverlaps(evts.map((e) => ({
          id: e.id, start: new Date(e.starts_at), end: e.ends_at ? new Date(e.ends_at) : null, allDay: e.is_all_day,
        })))
        return (
          <div key={i} className="min-h-[320px] rounded-xl border border-[#e7dcc8] bg-white/70 p-1.5">
            <p className="text-center text-xs font-semibold text-[#5c4a3f]">
              {d.toLocaleDateString([], { weekday: 'short' })} {d.getDate()}
            </p>
            <div className="mt-1 space-y-1">
              {evts.map((e) => {
                const warn = (overlaps.get(e.id) ?? []).length
                return (
                  <button
                    key={e.id + e.starts_at}
                    onClick={() => onSelectEvent(e)}
                    className="w-full rounded-lg border-l-4 bg-[#faf6ef] px-1.5 py-1 text-left text-[11px]"
                    style={{ borderLeftColor: e.color ?? CATEGORY_COLORS[e.category] }}
                    title={warn > 0 ? overlapWarningText(warn) : e.title}
                  >
                    <span className="block truncate font-medium text-[#3e342c]">{e.title}</span>
                    <span className="text-[#8a7a65]">
                      {e.is_all_day ? 'All day' : new Date(e.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {warn > 0 && <span className="block font-semibold text-[#b35555]">⚠ overlap</span>}
                  </button>
                )
              })}
              <button
                onClick={() => onSelectSlot(d, 9)}
                className="w-full rounded-lg border border-dashed border-[#ddd0b8] py-1 text-[11px] text-[#b6a98f] hover:bg-[#f1e9da]"
              >
                + 9am
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DayView({ day, events, onSelectEvent, onSelectSlot }: {
  day: Date
  events: CalendarEvent[]
  onSelectEvent: (e: CalendarEvent) => void
  onSelectSlot: (hour: number) => void
}) {
  const overlaps = detectOverlaps(events.map((e) => ({
    id: e.id, start: new Date(e.starts_at), end: e.ends_at ? new Date(e.ends_at) : null, allDay: e.is_all_day,
  })))
  return (
    <div className="rounded-2xl border border-[#e7dcc8] bg-white/70 p-3" role="grid" aria-label="Day view">
      <p className="mb-2 font-serif text-lg text-[#3e342c]">
        {day.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
      <div className="space-y-1">
        {HOURS.map((h) => {
          const slotEvents = events.filter((e) => {
            if (e.is_all_day) return h === 0
            return new Date(e.starts_at).getHours() === h
          })
          return (
            <div key={h} className="flex gap-2 border-t border-[#f1e9da] py-1">
              <span className="w-12 shrink-0 text-right text-[11px] text-[#8a7a65]">
                {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
              </span>
              <div className="flex-1 space-y-1">
                {slotEvents.map((e) => {
                  const warn = (overlaps.get(e.id) ?? []).length
                  return (
                    <button
                      key={e.id + e.starts_at}
                      onClick={() => onSelectEvent(e)}
                      className="w-full rounded-lg border-l-4 bg-[#faf6ef] px-2 py-1 text-left text-xs"
                      style={{ borderLeftColor: e.color ?? CATEGORY_COLORS[e.category] }}
                    >
                      <span className="font-medium text-[#3e342c]">{e.title}</span>
                      {warn > 0 && <span className="ml-2 font-semibold text-[#b35555]">⚠ {overlapWarningText(warn)}</span>}
                    </button>
                  )
                })}
                <button
                  onClick={() => onSelectSlot(h)}
                  className="w-full rounded text-left text-[11px] text-[#d8cbb2] hover:text-[#5c4a3f]"
                  aria-label={`Add event at ${h}:00`}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
