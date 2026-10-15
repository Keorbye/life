import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from './supabase'
import { todayISO } from './today-utils'
import type { CalendarEvent, DailyPlan, Project, Task, TaskBucket } from './types'

export function normaliseTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    user_id: String(row.user_id ?? ''),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    title: String(row.title ?? ''),
    done: Boolean(row.done),
    due_at: (row.due_at as string | null) ?? null,
    bucket: ((row.bucket as TaskBucket) ?? 'unscheduled'),
    scheduled_for: (row.scheduled_for as string | null) ?? null,
    priority_rank: (row.priority_rank as 1 | 2 | 3 | null) ?? null,
    project_id: (row.project_id as string | null) ?? null,
    waiting_on: (row.waiting_on as string | null) ?? null,
  }
}

export type TaskPatch = Partial<Pick<Task, 'bucket' | 'scheduled_for' | 'priority_rank' | 'due_at' | 'waiting_on'>>

export function useToday() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [plan, setPlan] = useState<DailyPlan | null>(null)
  const today = useMemo(() => todayISO(), [])

  const refresh = useCallback(async () => {
    if (!user) {
      setTasks([])
      setEvents([])
      setProjects([])
      setPlan(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date()
      dayEnd.setHours(23, 59, 59, 999)
      const [tasksRes, eventsRes, projectsRes, planRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: true }),
        supabase.from('calendar_events').select('*')
          .gte('starts_at', dayStart.toISOString()).lte('starts_at', dayEnd.toISOString())
          .order('starts_at', { ascending: true }),
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
        supabase.from('daily_plans').select('*').eq('plan_date', today).maybeSingle(),
      ])
      if (tasksRes.error) throw tasksRes.error
      if (eventsRes.error) throw eventsRes.error
      if (projectsRes.error) throw projectsRes.error
      if (planRes.error) throw planRes.error
      setTasks(((tasksRes.data ?? []) as Record<string, unknown>[]).map(normaliseTask))
      setEvents((eventsRes.data ?? []) as CalendarEvent[])
      setProjects((projectsRes.data ?? []) as Project[])
      setPlan((planRes.data ?? null) as DailyPlan | null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load today.')
    } finally {
      setLoading(false)
    }
  }, [user, today])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { loading, error, setError, today, tasks, setTasks, events, projects, plan, setPlan, refresh, user }
}
