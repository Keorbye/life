import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from './supabase'
import type { CalendarEvent, EventCategory, Project, Task } from './types'
import { normaliseTask } from './useTodayData'

export type EventInput = {
  title: string
  starts_at: string
  ends_at: string | null
  description: string | null
  is_all_day: boolean
  category: EventCategory
  color: string | null
  location: string | null
  link_url: string | null
  reminder_minutes: number | null
  project_id: string | null
  task_id: string | null
  recurrence_rule: 'daily' | 'weekly' | 'monthly' | null
  recurrence_until: string | null
}

export function normaliseEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: String(row.id),
    user_id: String(row.user_id ?? ''),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    title: String(row.title ?? ''),
    starts_at: String(row.starts_at ?? ''),
    ends_at: (row.ends_at as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    is_all_day: Boolean(row.is_all_day),
    category: ((row.category as EventCategory) ?? 'personal'),
    color: (row.color as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    link_url: (row.link_url as string | null) ?? null,
    reminder_minutes: (row.reminder_minutes as number | null) ?? null,
    project_id: (row.project_id as string | null) ?? null,
    task_id: (row.task_id as string | null) ?? null,
    recurrence_rule: (row.recurrence_rule as CalendarEvent['recurrence_rule']) ?? null,
    recurrence_until: (row.recurrence_until as string | null) ?? null,
  }
}

export function useCalendar(rangeStart: Date, rangeEnd: Date) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  const startISO = rangeStart.toISOString()
  const endISO = rangeEnd.toISOString()

  const refresh = useCallback(async () => {
    if (!user) {
      setEvents([])
      setTasks([])
      setProjects([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      // Events overlapping the visible range (same rows Today reads — stays synced).
      const [eventsRes, tasksRes, projectsRes] = await Promise.all([
        supabase.from('calendar_events').select('*')
          .or(`and(starts_at.gte.${startISO},starts_at.lte.${endISO}),and(starts_at.lte.${startISO},ends_at.gte.${startISO})`)
          .order('starts_at', { ascending: true }),
        supabase.from('tasks').select('*').order('due_at', { ascending: true }),
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
      ])
      if (eventsRes.error) throw eventsRes.error
      if (tasksRes.error) throw tasksRes.error
      if (projectsRes.error) throw projectsRes.error
      setEvents(((eventsRes.data ?? []) as Record<string, unknown>[]).map(normaliseEvent))
      setTasks(((tasksRes.data ?? []) as Record<string, unknown>[]).map(normaliseTask))
      setProjects((projectsRes.data ?? []) as Project[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load calendar.')
    } finally {
      setLoading(false)
    }
  }, [user, startISO, endISO])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { loading, error, setError, events, setEvents, tasks, projects, refresh, user }
}

export async function createEvent(userId: string, input: EventInput) {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ user_id: userId, ...input })
    .select('*')
    .single()
  if (error) return { error: error.message, event: null }
  return { error: null, event: normaliseEvent(data as Record<string, unknown>) }
}

export async function updateEvent(id: string, patch: Partial<EventInput>) {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) return { error: error.message, event: null }
  return { error: null, event: normaliseEvent(data as Record<string, unknown>) }
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}
