import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from './supabase'
import type { MoodEntry, MoodMood, MoodStressLevel, MoodEnergyLevel } from './types'

export function useMood() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])

  const refresh = useCallback(async () => {
    if (!user) {
      setMoodEntries([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('mood_entries')
        .select('*')
        .order('entry_date', { ascending: false })
      if (dbError) throw dbError
      setMoodEntries((data ?? []) as MoodEntry[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load mood data.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const logMood = useCallback(async (mood: MoodMood, stressLevel: MoodStressLevel, energyLevel: MoodEnergyLevel, notes?: string) => {
    if (!user) return { error: 'Not signed in.' }
    const { error } = await supabase
      .from('mood_entries')
      .insert({ user_id: user.id, mood, stress_level: stressLevel, energy_level: energyLevel, notes })
    if (error) return { error: error.message }
    setMoodEntries((prev) => [{ id: '', mood, stress_level: stressLevel, energy_level: energyLevel, notes, entry_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: user.id } as MoodEntry, ...prev])
    return { error: null }
  }, [user])

  return { loading, error, setError, moodEntries, setMoodEntries, refresh, logMood, user }
}