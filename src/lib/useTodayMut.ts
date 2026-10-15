import { useCallback } from 'react'
import { supabase } from './supabase'
import { normaliseTask, type TaskPatch } from './useTodayData'
import type { DailyPlan, Task, TaskBucket } from './types'

type SetTasks = React.Dispatch<React.SetStateAction<Task[]>>

export function useTodayMutations(
  userId: string | undefined,
  today: string,
  tasks: Task[],
  setTasks: SetTasks,
  setPlan: React.Dispatch<React.SetStateAction<DailyPlan | null>>,
  refresh: () => Promise<void>,
) {
  const toggleTask = useCallback(async (id: string, done: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)))
    const { error } = await supabase.from('tasks').update({ done }).eq('id', id)
    if (error) await refresh()
  }, [setTasks, refresh])

  const quickAdd = useCallback(async (title: string, bucket: TaskBucket = 'must', dueAt: string | null = null) => {
    if (!userId) return { error: 'Not signed in.' }
    const trimmed = title.trim()
    if (!trimmed) return { error: 'Give the task a name first.' }
    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: userId, title: trimmed, bucket, due_at: dueAt })
      .select('*')
      .single()
    if (error) return { error: error.message }
    setTasks((prev) => [...prev, normaliseTask(data as Record<string, unknown>)])
    return { error: null }
  }, [userId, setTasks])

  const moveTask = useCallback(async (id: string, patch: TaskPatch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    if (error) {
      await refresh()
      return { error: error.message }
    }
    return { error: null }
  }, [setTasks, refresh])

  // Reschedule = single UPDATE of scheduled_for on the same row. Never inserts.
  const rescheduleTask = useCallback(async (id: string, nextISODate: string) =>
    moveTask(id, { scheduled_for: nextISODate }), [moveTask])

  // Priorities reference task ids; exactly 3 slots, others cleared. No copies.
  const setPriorities = useCallback(async (ids: (string | null)[]) => {
    const ranked = ids.slice(0, 3)
    setTasks((prev) => prev.map((t) => {
      const idx = ranked.indexOf(t.id)
      return { ...t, priority_rank: (idx === -1 ? null : ((idx + 1) as 1 | 2 | 3)) }
    }))
    try {
      for (const t of tasks) {
        if (t.priority_rank !== null && !ranked.includes(t.id)) {
          const { error } = await supabase.from('tasks').update({ priority_rank: null }).eq('id', t.id)
          if (error) throw error
        }
      }
      for (let i = 0; i < ranked.length; i += 1) {
        const id = ranked[i]
        if (!id) continue
        const { error } = await supabase.from('tasks').update({ priority_rank: (i + 1) as 1 | 2 | 3 }).eq('id', id)
        if (error) throw error
      }
      return { error: null }
    } catch (err) {
      await refresh()
      return { error: err instanceof Error ? err.message : 'Could not save priorities.' }
    }
  }, [tasks, setTasks, refresh])

  const saveIntention = useCallback(async (text: string) => {
    if (!userId) return { error: 'Not signed in.' }
    const { data, error } = await supabase
      .from('daily_plans')
      .upsert({ user_id: userId, plan_date: today, intention: text.trim() || null }, { onConflict: 'user_id,plan_date' })
      .select('*')
      .single()
    if (error) return { error: error.message }
    setPlan(data as DailyPlan)
    return { error: null }
  }, [userId, today, setPlan])

  return { toggleTask, quickAdd, moveTask, rescheduleTask, setPriorities, saveIntention }
}
