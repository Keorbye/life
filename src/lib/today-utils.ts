// Date + scheduling helpers for the Today page. Pure functions, fully tested.

export function toISODate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO(now = new Date()): string {
  return toISODate(now)
}

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return toISODate(dt)
}

export function isOverdue(dueAt: string | null, now = new Date()): boolean {
  if (!dueAt) return false
  return new Date(dueAt).getTime() < now.getTime()
}

export function minutesBetween(startISO: string, endISO: string | null): number | null {
  if (!endISO) return null
  const mins = Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 60000)
  return mins >= 0 ? mins : 0
}

/** Free minutes today given events (clamped to 0). Day window defaults to 8am–10pm. */
export function availableMinutesToday(
  events: { starts_at: string; ends_at: string | null }[],
  now = new Date(),
  dayStartHour = 8,
  dayEndHour = 22,
): number {
  const day = toISODate(now)
  const windowStart = new Date(now)
  windowStart.setHours(dayStartHour, 0, 0, 0)
  const windowEnd = new Date(now)
  windowEnd.setHours(dayEndHour, 0, 0, 0)
  const total = Math.max(0, Math.round((windowEnd.getTime() - windowStart.getTime()) / 60000))

  let busy = 0
  for (const e of events) {
    const s = new Date(e.starts_at)
    if (toISODate(s) !== day) continue
    if (!e.ends_at) {
      busy += 30 // default 30m for open-ended events
      continue
    }
    const end = new Date(e.ends_at)
    const overlapStart = Math.max(s.getTime(), windowStart.getTime())
    const overlapEnd = Math.min(end.getTime(), windowEnd.getTime())
    if (overlapEnd > overlapStart) busy += Math.round((overlapEnd - overlapStart) / 60000)
  }
  return Math.max(0, total - busy)
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
