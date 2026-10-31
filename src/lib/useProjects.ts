import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from './supabase'
import { normaliseTask } from './useTodayData'
import type { Project, ProjectMilestone, ProjectStatus, Task } from './types'

function normaliseMilestone(row: Record<string, unknown>): ProjectMilestone {
  return {
    id: String(row.id),
    user_id: String(row.user_id ?? ''),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    project_id: String(row.project_id),
    title: String(row.title ?? ''),
    due_at: (row.due_at as string | null) ?? null,
    done: Boolean(row.done),
    position: Number(row.position ?? 0),
  }
}

export type ProjectInput = {
  name: string
  description: string | null
  status: ProjectStatus
  category: Project['category']
  start_at: string | null
  due_at: string | null
  notes: string | null
  color: string | null
}

/**
 * Project management data: projects + milestones + ALL tasks (for progress,
 * next action, deadlines). Progress is computed from task rows — never stored.
 */
export function useProjectsData() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const refresh = useCallback(async () => {
    if (!user) {
      setProjects([]); setMilestones([]); setTasks([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [projRes, msRes, tasksRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
        supabase.from('project_milestones').select('*').order('position', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: true }),
      ])
      if (projRes.error) throw projRes.error
      if (msRes.error) throw msRes.error
      if (tasksRes.error) throw tasksRes.error
      setProjects((projRes.data ?? []) as Project[])
      setMilestones(((msRes.data ?? []) as Record<string, unknown>[]).map(normaliseMilestone))
      setTasks(((tasksRes.data ?? []) as Record<string, unknown>[]).map(normaliseTask))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load projects.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void refresh() }, [refresh])

  const createProject = useCallback(async (input: ProjectInput): Promise<{ error: string | null; project: Project | null }> => {
    if (!user) return { error: 'Not signed in.', project: null }
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, ...input })
      .select('*')
      .single()
    if (error) return { error: error.message, project: null }
    const project = data as Project
    setProjects((prev) => [...prev, project])
    return { error: null, project }
  }, [user])

  const updateProject = useCallback(async (id: string, patch: Partial<ProjectInput>): Promise<{ error: string | null }> => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    const { error } = await supabase.from('projects').update(patch).eq('id', id)
    if (error) {
      await refresh()
      return { error: error.message }
    }
    return { error: null }
  }, [refresh])

  const changeStatus = useCallback(async (id: string, status: ProjectStatus) =>
    updateProject(id, { status }), [updateProject])

  const deleteProject = useCallback(async (id: string): Promise<{ error: string | null }> => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setMilestones((prev) => prev.filter((m) => m.project_id !== id))
    setTasks((prev) => prev.map((t) => (t.project_id === id ? { ...t, project_id: null } : t)))
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) {
      await refresh()
      return { error: error.message }
    }
    return { error: null }
  }, [refresh])

  // ---- Milestones (child rows of a project) ----

  const addMilestone = useCallback(async (projectId: string, title: string, dueAt: string | null): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in.' }
    const trimmed = title.trim()
    if (!trimmed) return { error: 'Give the milestone a name.' }
    const position = milestones.filter((m) => m.project_id === projectId).length
    const { data, error } = await supabase
      .from('project_milestones')
      .insert({ user_id: user.id, project_id: projectId, title: trimmed, due_at: dueAt, position })
      .select('*')
      .single()
    if (error) return { error: error.message }
    setMilestones((prev) => [...prev, normaliseMilestone(data as Record<string, unknown>)])
    return { error: null }
  }, [user, milestones])

  const toggleMilestone = useCallback(async (id: string, done: boolean) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, done } : m)))
    const { error } = await supabase.from('project_milestones').update({ done }).eq('id', id)
    if (error) await refresh()
  }, [refresh])

  const deleteMilestone = useCallback(async (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
    const { error } = await supabase.from('project_milestones').delete().eq('id', id)
    if (error) await refresh()
  }, [refresh])

  // ---- Task rows inside the workspace (the same rows Today/Calendar read) ----

  const createTaskForProject = useCallback(async (projectId: string, input: Record<string, unknown>): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in.' }
    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, project_id: projectId, ...input })
      .select('*')
      .single()
    if (error) return { error: error.message }
    setTasks((prev) => [...prev, normaliseTask(data as Record<string, unknown>)])
    return { error: null }
  }, [user])

  const toggleTaskDone = useCallback(async (id: string, done: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)))
    const { error } = await supabase.from('tasks').update({ done }).eq('id', id)
    if (error) await refresh()
  }, [refresh])

  const postponeTask = useCallback(async (id: string, days: number) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return { error: 'Task not found.' }
    const { postponeTaskDates } = await import('./task-utils')
    const patch = postponeTaskDates(task, days)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    if (error) await refresh()
    return { error: error?.message ?? null }
  }, [tasks, refresh])

  return {
    loading, error, setError, projects, milestones, tasks, refresh, user,
    createProject, updateProject, changeStatus, deleteProject,
    addMilestone, toggleMilestone, deleteMilestone,
    createTaskForProject, toggleTaskDone, postponeTask,
  }
}
