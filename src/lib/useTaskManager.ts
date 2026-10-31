import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from './supabase'
import { normaliseSubtask, normaliseTask, type TaskPatch } from './useTodayData'
import type { Project, Subtask, Task } from './types'

/**
 * Task manager data: loads ALL task rows + subtasks + projects + goals once.
 * Every view (list/board/calendar/focus lists) reads these same rows.
 */
export function useTaskManager() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [goals, setGoals] = useState<{ id: string; title: string }[]>([])

  const refresh = useCallback(async () => {
    if (!user) {
      setTasks([]); setSubtasks([]); setProjects([]); setGoals([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [tasksRes, subRes, projectsRes, goalsRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: true }),
        supabase.from('task_subtasks').select('*').order('position', { ascending: true }),
        supabase.from('projects').select('id, name').order('created_at', { ascending: true }),
        supabase.from('goals').select('id, title').order('created_at', { ascending: true }),
      ])
      if (tasksRes.error) throw tasksRes.error
      if (subRes.error) throw subRes.error
      if (projectsRes.error) throw projectsRes.error
      if (goalsRes.error) throw goalsRes.error
      setTasks(((tasksRes.data ?? []) as Record<string, unknown>[]).map(normaliseTask))
      setSubtasks(((subRes.data ?? []) as Record<string, unknown>[]).map(normaliseSubtask))
      setProjects((projectsRes.data ?? []) as Project[])
      setGoals((goalsRes.data ?? []) as { id: string; title: string }[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tasks.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void refresh() }, [refresh])

  const patchLocal = useCallback((id: string, patch: TaskPatch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  /** Generic single-row update. Never inserts — same row everywhere. */
  const updateTask = useCallback(async (id: string, patch: TaskPatch): Promise<{ error: string | null }> => {
    patchLocal(id, patch)
    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    if (error) {
      await refresh()
      return { error: error.message }
    }
    return { error: null }
  }, [patchLocal, refresh])

  const toggleDone = useCallback((id: string, done: boolean) =>
    updateTask(id, { done }), [updateTask])

  const moveToStatus = useCallback((id: string, status: Task['status']) =>
    updateTask(id, { status }), [updateTask])

  const postpone = useCallback(async (id: string, patch: { due_at: string | null; scheduled_for: string | null }) => {
    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    if (error) {
      await refresh()
      return { error: error.message }
    }
    patchLocal(id, patch)
    return { error: null }
  }, [patchLocal, refresh])

  const createTask = useCallback(async (input: Record<string, unknown>): Promise<{ error: string | null; task: Task | null }> => {
    if (!user) return { error: 'Not signed in.', task: null }
    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, ...input })
      .select('*')
      .single()
    if (error) return { error: error.message, task: null }
    const task = normaliseTask(data as Record<string, unknown>)
    setTasks((prev) => [...prev, task])
    return { error: null, task }
  }, [user])

  const deleteTask = useCallback(async (id: string): Promise<{ error: string | null }> => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setSubtasks((prev) => prev.filter((s) => s.task_id !== id))
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      await refresh()
      return { error: error.message }
    }
    return { error: null }
  }, [refresh])

  // ---- Subtasks (child rows of a task — never promoted to task rows) ----

  const addSubtask = useCallback(async (taskId: string, title: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in.' }
    const trimmed = title.trim()
    if (!trimmed) return { error: 'Give the subtask a name.' }
    const position = subtasks.filter((s) => s.task_id === taskId).length
    const { data, error } = await supabase
      .from('task_subtasks')
      .insert({ user_id: user.id, task_id: taskId, title: trimmed, position })
      .select('*')
      .single()
    if (error) return { error: error.message }
    setSubtasks((prev) => [...prev, normaliseSubtask(data as Record<string, unknown>)])
    return { error: null }
  }, [user, subtasks])

  const toggleSubtask = useCallback(async (id: string, done: boolean) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, done } : s)))
    const { error } = await supabase.from('task_subtasks').update({ done }).eq('id', id)
    if (error) await refresh()
  }, [refresh])

  const deleteSubtask = useCallback(async (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id))
    const { error } = await supabase.from('task_subtasks').delete().eq('id', id)
    if (error) await refresh()
  }, [refresh])

  return {
    loading, error, setError, tasks, subtasks, projects, goals, refresh, user,
    createTask, updateTask, toggleDone, moveToStatus, postpone, deleteTask,
    addSubtask, toggleSubtask, deleteSubtask,
  }
}
