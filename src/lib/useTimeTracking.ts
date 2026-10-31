import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from './supabase'
import type { TimeTrackingEntry } from './types'

export function useTimeTracking() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeTrackingEntry[]>([])

  const refresh = useCallback(async () => {
    if (!user) {
      setTimeEntries([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('time_tracking')
        .select('*')
        .order('date', { ascending: false })
      if (dbError) throw dbError
      setTimeEntries((data ?? []) as TimeTrackingEntry[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load time tracking data.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const trackTime = useCallback(async (label: string, colorCode: string, minutes: number) => {
    if (!user) return { error: 'Not signed in.' }
    const { error } = await supabase
      .from('time_tracking')
      .insert({ user_id: user.id, label, color_code, minutes, date: new Date().toISOString().split('T')[0] })
    if (error) return { error: error.message }
    setTimeEntries((prev) => [{ id: '', label, color_code, minutes, date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: user.id } as TimeTrackingEntry, ...prev])
    return { error: null }
  }, [user])

  const getTimeByLabel = useCallback(async (label: string) => {
    if (!user) return { error: 'Not signed in.' }
    const { data, error: dbError } = await supabase
      .from('time_tracking')
      .select('*')
      .eq('label', label)
    if (dbError) return { error: dbError.message }
    return { error: null, data: data as TimeTrackingEntry[] }
  }, [user])

  return { loading, error, setError, timeEntries, setTimeEntries, refresh, trackTime, getTimeByLabel, user }
}