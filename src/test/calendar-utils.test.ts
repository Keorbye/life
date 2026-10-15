import { describe, expect, it } from 'vitest'
import {
  detectOverlaps,
  expandRecurrence,
  monthGridDays,
  overlapWarningText,
  startOfWeek,
  startOfMonth,
} from '../lib/calendar-utils'

describe('calendar-utils', () => {
  it('month grid covers whole weeks starting Monday', () => {
    const days = monthGridDays(new Date(2026, 9, 15)) // Oct 2026 (Mon-start)
    expect(days.length % 7).toBe(0)
    const first = days[0]
    expect(first.getDay()).toBe(1) // Monday
    // Oct 1 2026 grid starts Mon Sep 28 — includes Oct 1
    const oct1 = new Date(2026, 9, 1)
    expect(days.some((d) => d.getTime() === oct1.getTime())).toBe(true)
    expect(days.some((d) => d.getTime() === new Date(2026, 8, 28).getTime())).toBe(true)
    expect(startOfWeek(new Date(2026, 9, 15)).getDay()).toBe(1)
    expect(startOfMonth(new Date(2026, 9, 15)).getDate()).toBe(1)
  })

  it('detects overlapping timed events but never all-day ones', () => {
    const a = { id: 'a', start: new Date('2026-10-15T09:00:00'), end: new Date('2026-10-15T10:00:00'), allDay: false }
    const b = { id: 'b', start: new Date('2026-10-15T09:30:00'), end: new Date('2026-10-15T10:30:00'), allDay: false }
    const c = { id: 'c', start: new Date('2026-10-15T11:00:00'), end: new Date('2026-10-15T12:00:00'), allDay: false }
    const allDay = { id: 'd', start: new Date('2026-10-15T00:00:00'), end: new Date('2026-10-15T23:59:00'), allDay: true }
    const map = detectOverlaps([a, b, c, allDay])
    expect(map.get('a')).toEqual(['b'])
    expect(map.get('b')).toEqual(['a'])
    expect(map.get('c')).toEqual([])
    expect(map.get('d')).toEqual([]) // all-day never warns
    expect(overlapWarningText(1)).toMatch(/1 other/)
    expect(overlapWarningText(0)).toBe('')
  })

  it('expands weekly recurrence within range only', () => {
    const from = new Date(2026, 9, 12)
    const to = new Date(2026, 9, 26, 23, 59, 59)
    const occ = expandRecurrence(
      '2026-10-13T09:00:00.000Z',
      '2026-10-13T10:00:00.000Z',
      'weekly',
      null,
      from,
      to,
    )
    expect(occ.length).toBe(2) // 13th (outside range start? 12 Oct 00:00 from → included), 20th
    const nonRecurring = expandRecurrence('2026-10-15T09:00:00.000Z', null, null, null, from, to)
    expect(nonRecurring.length).toBe(1)
    const outside = expandRecurrence('2026-11-15T09:00:00.000Z', null, null, null, from, to)
    expect(outside.length).toBe(0)
  })

  it('honours recurrence_until cutoff', () => {
    const from = new Date(2026, 9, 1)
    const to = new Date(2026, 9, 31, 23, 59, 59)
    const occ = expandRecurrence('2026-10-13T09:00:00.000Z', '2026-10-13T10:00:00.000Z', 'daily', '2026-10-15', from, to)
    expect(occ.length).toBe(3) // 13,14,15
  })
})
