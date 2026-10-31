import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from './supabase'
import type { Area, AreaCategory } from './types'

export function useAreas() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [areas, setAreas] = useState<Area[]>([])

  const refresh = useCallback(async () => {
    if (!user) {
      setAreas([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('areas')
        .select('*')
        .order('name')
      if (dbError) throw dbError
      setAreas((data ?? []) as Area[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load areas data.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createArea = useCallback(async (name: string, category: AreaCategory, targetFrequency?: string, notes?: string) => {
    if (!user) return { error: 'Not signed in.' }
    const { error } = await supabase
      .from('areas')
      .insert({ user_id: user.id, name, category, target_frequency: targetFrequency || null, notes })
    if (error) return { error: error.message }
    setAreas((prev) => [{ id: '', user_id: user.id, name, category, target_frequency: targetFrequency || null, notes, current_streak: 0, best_streak: 0, last_activity_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Area, ...prev])
    return { error: null }
  }, [user])

  const updateStreak = useCallback(async (areaId: string, currentStreak: number, bestStreak: number, lastActivityDate?: string) => {
    if (!user) return { error: 'Not signed in.' }
    const { error } = await supabase
      .from('areas')
      .update({ current_streak: currentStreak, best_streak: bestStreak, last_activity_date: lastActivityDate || null })
      .eq('id', areaId)
    if (error) return { error: error.message }
    setAreas(prev => prev.map(a => a.id === areaId ? { ...a, current_streak: currentStreak, best_streak: bestStreak, last_activity_date: lastActivityDate || null } : a))
    return { error: null }
  }, [user])

  return { loading, error, setError, areas, setAreas, refresh, createArea, updateStreak, user }
}