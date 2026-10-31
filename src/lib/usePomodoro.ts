import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from './supabase'
import type { PomodoroSession, PomodoroSessionType } from './types'

export function usePomodoro() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<PomodoroSession[]>([])

  const refresh = useCallback(async () => {
    if (!user) {
      setSessions([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .order('started_at', { ascending: false })
      if (dbError) throw dbError
      setSessions((data ?? []) as PomodoroSession[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load pomodoro data.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const startSession = useCallback(async (type: PomodoroSessionType, durationMinutes: number, taskId?: string) => {
    if (!user) return { error: 'Not signed in.' }
    const { error } = await supabase
      .from('pomodoro_sessions')
      .insert({ user_id: user.id, type, duration_minutes: durationMinutes, started_at: new Date().toISOString(), task_id: taskId || null })
    if (error) return { error: error.message }
    setSessions((prev) => [{ id: '', user_id: user.id, type, duration_minutes: durationMinutes, started_at: new Date().toISOString(), ended_at: null, completed: false, task_id, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as PomodoroSession, ...prev])
    return { error: null }
  }, [user])

  const endSession = useCallback(async (sessionId: string, completed: boolean) => {
    if (!user) return { error: 'Not signed in.' }
    const { error } = await supabase
      .from('pomodoro_sessions')
      .update({ ended_at: new Date().toISOString(), completed })
      .eq('id', sessionId)
    if (error) return { error: error.message }
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, completed, ended_at: new Date().toISOString() } : s))
    return { error: null }
  }, [user])

  const getStats = useCallback(async () => {
    if (!user) return { error: 'Not signed in.', sessions: [] as PomodoroSession[] }
    const { data, error: dbError } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', user.id)
    if (dbError) return { error: dbError.message, sessions: [] }
    return { error: null, sessions: data as PomodoroSession[] }
  }, [user])

  return { loading, error, setError, sessions, setSessions, refresh, startSession, endSession, getStats, user }
}