import { describe, expect, it } from 'vitest'
import { addDaysISO, availableMinutesToday, formatMinutes, isOverdue, toISODate, todayISO } from '../lib/today-utils'

describe('Today helpers', () => {
  it('formats today ISO and long date parts', () => {
    expect(todayISO(new Date(2026, 9, 15))).toBe('2026-10-15')
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(addDaysISO('2026-10-15', 1)).toBe('2026-10-16')
    expect(addDaysISO('2026-10-15', -1)).toBe('2026-10-14')
  })

  it('detects overdue only for past due dates', () => {
    expect(isOverdue(null)).toBe(false)
    expect(isOverdue(new Date(Date.now() - 3600000).toISOString())).toBe(true)
    expect(isOverdue(new Date(Date.now() + 3600000).toISOString())).toBe(false)
  })

  it('computes available minutes minus overlapping events', () => {
    const now = new Date(2026, 9, 15, 9, 0, 0)
    // 8am-10pm window = 840 mins. One 60-min meeting 9-10am leaves 780.
    const free = availableMinutesToday(
      [{ starts_at: new Date(2026, 9, 15, 9, 0, 0).toISOString(), ends_at: new Date(2026, 9, 15, 10, 0, 0).toISOString() }],
      now,
    )
    expect(free).toBe(780)
    expect(formatMinutes(780)).toBe('13h')
    expect(formatMinutes(45)).toBe('45m')
  })

  it('ignores events on other days', () => {
    const now = new Date(2026, 9, 15, 9, 0, 0)
    const free = availableMinutesToday(
      [{ starts_at: new Date(2026, 9, 16, 9, 0, 0).toISOString(), ends_at: new Date(2026, 9, 16, 10, 0, 0).toISOString() }],
      now,
    )
    expect(free).toBe(840)
  })
})
