import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from './supabase'
import type { Resource, ResourceType, ResourceCategory, ResourceReadStatus, ResourcePriority } from './types'

export function useResources() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resources, setResources] = useState<Resource[]>([])

  const refresh = useCallback(async () => {
    if (!user) {
      setResources([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('resources')
        .select('*')
        .order('title')
      if (dbError) throw dbError
      setResources((data ?? []) as Resource[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load resources data.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addResource = useCallback(async (title: string, type: ResourceType, category: ResourceCategory, summary?: string, author?: string, priority: ResourcePriority = 'medium', tags: string[] = [], sourceUrl?: string) => {
    if (!user) return { error: 'Not signed in.' }
    const { error } = await supabase
      .from('resources')
      .insert({ user_id: user.id, title, type, category, summary: summary || null, author: author || null, read_status: 'unread', progress_percentage: 0, priority, tags: tags || [], source_url: sourceUrl || null })
    if (error) return { error: error.message }
    setResources((prev) => [{ id: '', user_id: user.id, title, type, category, summary: summary || null, author: author || null, read_status: 'unread', progress_percentage: 0, priority, tags: tags || [], source_url: sourceUrl || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Resource, ...prev])
    return { error: null }
  }, [user])

  const updateProgress = useCallback(async (resourceId: string, progress: number, readStatus: ResourceReadStatus) => {
    if (!user) return { error: 'Not signed in.' }
    const { error } = await supabase
      .from('resources')
      .update({ progress_percentage: progress, read_status: readStatus })
      .eq('id', resourceId)
    if (error) return { error: error.message }
    setResources(prev => prev.map(r => r.id === resourceId ? { ...r, progress_percentage: progress, read_status: readStatus } : r))
    return { error: null }
  }, [user])

  return { loading, error, setError, resources, setResources, refresh, addResource, updateProgress, user }
}