import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsVerification: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function friendlyError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Email or password is incorrect.'
  if (lower.includes('email not confirmed')) return 'Please verify your email first — check your inbox for the link.'
  if (lower.includes('user already registered')) return 'An account with this email already exists. Try logging in.'
  if (lower.includes('password should be')) return 'Password must be at least 8 characters.'
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
    setUser(data.session?.user ?? null)
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await refresh()
      if (mounted) setLoading(false)
    })()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [refresh])

  const signUp = useCallback(async (email: string, password: string) => {
    const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${appUrl}/verify` },
    })
    if (error) return { error: friendlyError(error.message), needsVerification: false }
    // needsVerification when no session was created (email confirmation required)
    return { error: null, needsVerification: !data.session }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return { error: friendlyError(error.message) }
    await refresh()
    return { error: null }
  }, [refresh])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    await refresh()
  }, [refresh])

  const resetPassword = useCallback(async (email: string) => {
    const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${appUrl}/reset-password`,
    })
    if (error) return { error: friendlyError(error.message) }
    return { error: null }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: friendlyError(error.message) }
    return { error: null }
  }, [])

  const value = useMemo(
    () => ({ user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword, refresh }),
    [user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
