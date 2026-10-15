// Pure calendar logic: ranges, recurrence expansion, overlap detection.
// No Supabase calls here — fully unit-tested.

export type CalRange = { start: Date; end: Date | null }

export function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

export function endOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(23, 59, 59, 999)
  return c
}

export function startOfWeek(d: Date, weekStartsOn: 0 | 1 = 1): Date {
  const c = startOfDay(d)
  const day = c.getDay()
  const diff = weekStartsOn === 1 ? (day === 0 ? -6 : 1 - day) : -day
  c.setDate(c.getDate() + diff)
  return c
}

export function endOfWeek(d: Date, weekStartsOn: 0 | 1 = 1): Date {
  const s = startOfWeek(d, weekStartsOn)
  s.setDate(s.getDate() + 6)
  return endOfDay(s)
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function monthGridDays(cursor: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const start = startOfWeek(startOfMonth(cursor), weekStartsOn)
  const end = endOfWeek(endOfMonth(cursor), weekStartsOn)
  const days: Date[] = []
  const c = new Date(start)
  while (c.getTime() <= end.getTime()) {
    days.push(new Date(c))
    c.setDate(c.getDate() + 1)
  }
  return days
}

export type Recurrence = 'daily' | 'weekly' | 'monthly' | null

/** Expand a recurring event into occurrences within [from, to]. Non-recurring returns itself if overlapping. */
export function expandRecurrence(
  startsAt: string,
  endsAt: string | null,
  rule: Recurrence,
  until: string | null,
  from: Date,
  to: Date,
  maxOccurrences = 366,
): CalRange[] {
  const baseStart = new Date(startsAt)
  const baseEnd = endsAt ? new Date(endsAt) : null
  const durationMs = baseEnd ? baseEnd.getTime() - baseStart.getTime() : 0
  const untilDate = until ? endOfDay(new Date(`${until}T00:00:00`)) : to

  if (!rule) {
    const s = baseStart
    const e = baseEnd
    if (s.getTime() > to.getTime()) return []
    if (e && e.getTime() < from.getTime()) return []
    if (!e && s.getTime() < from.getTime()) return []
    return [{ start: s, end: e }]
  }

  const out: CalRange[] = []
  const cursor = new Date(baseStart)
  let count = 0
  while (cursor.getTime() <= to.getTime() && cursor.getTime() <= untilDate.getTime() && count < maxOccurrences) {
    const occStart = new Date(cursor)
    const occEnd = baseEnd ? new Date(occStart.getTime() + durationMs) : null
    if (occEnd ? occEnd.getTime() >= from.getTime() && occStart.getTime() <= to.getTime()
      : occStart.getTime() >= from.getTime() && occStart.getTime() <= to.getTime()) {
      out.push({ start: occStart, end: occEnd })
    }
    if (rule === 'daily') cursor.setDate(cursor.getDate() + 1)
    else if (rule === 'weekly') cursor.setDate(cursor.getDate() + 7)
    else cursor.setMonth(cursor.getMonth() + 1)
    count += 1
    // Stop if the original was in the future relative to range start and we've passed it (non-recurring guard not needed)
    if (cursor.getTime() > to.getTime()) break
  }
  return out
}

export type OverlapGroup = { ids: string[]; count: number }

/** Detect overlapping timed events. Returns map of event id -> overlapping ids. Warn only, never mutates. */
export function detectOverlaps(items: { id: string; start: Date; end: Date | null; allDay?: boolean }[]): Map<string, string[]> {
  const timed = items.filter((i) => !i.allDay && i.end && i.end.getTime() > i.start.getTime())
  const result = new Map<string, string[]>()
  for (const item of items) result.set(item.id, [])
  for (let a = 0; a < timed.length; a += 1) {
    for (let b = a + 1; b < timed.length; b += 1) {
      const x = timed[a]
      const y = timed[b]
      const xEnd = x.end as Date
      const yEnd = y.end as Date
      const overlaps = x.start.getTime() < yEnd.getTime() && y.start.getTime() < xEnd.getTime()
      if (overlaps) {
        result.get(x.id)?.push(y.id)
        result.get(y.id)?.push(x.id)
      }
    }
  }
  return result
}

/** All-day events never trigger overlap warnings (they span the whole day by design). */
export function overlapWarningText(count: number): string {
  if (count <= 0) return ''
  return count === 1 ? 'Overlaps 1 other appointment' : `Overlaps ${count} other appointments`
}
