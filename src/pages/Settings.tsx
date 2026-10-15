import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabase'
import { FUTURE_TABLES } from '../lib/types'
import { Alert, Button, Card, Field } from '../components/ui'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState<{ kind: 'error' | 'success' | 'info'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState('')

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
      if (data?.display_name) setDisplayName(data.display_name)
    })()
  }, [user])

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setStatus(null)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email ?? '', display_name: displayName.trim() || null })
    setBusy(false)
    setStatus(error ? { kind: 'error', text: error.message } : { kind: 'success', text: 'Profile saved.' })
  }

  async function exportData() {
    if (!user) return
    setStatus({ kind: 'info', text: 'Gathering your data…' })
    try {
      const payload: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        user: { id: user.id, email: user.email },
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      payload.profile = profile
      for (const table of FUTURE_TABLES) {
        const { data, error } = await supabase.from(table).select('*')
        if (error) throw error
        payload[table] = data
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `life-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatus({ kind: 'success', text: 'Export downloaded.' })
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : 'Export failed.' })
    }
  }

  async function deleteAccount() {
    if (!user) return
    if (confirmDelete !== 'DELETE') {
      setStatus({ kind: 'error', text: 'Type DELETE to confirm account deletion.' })
      return
    }
    setBusy(true)
    setStatus({ kind: 'info', text: 'Deleting your data…' })
    try {
      // Delete owned rows first (RLS ensures only own rows are removable)
      for (const table of FUTURE_TABLES) {
        const { error } = await supabase.from(table).delete().eq('user_id', user.id)
        if (error) throw error
      }
      await supabase.from('profiles').delete().eq('id', user.id)
      // Auth user deletion requires service role / edge function; sign out and instruct
      await signOut()
      navigate('/', { replace: true })
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : 'Deletion failed.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="font-serif text-4xl text-[#3e342c]">Account settings</h1>
      {status && <Alert kind={status.kind}>{status.text}</Alert>}

      <Card>
        <h2 className="font-serif text-xl text-[#3e342c]">Profile</h2>
        <p className="text-sm text-[#8a7a65]">{user?.email}</p>
        <form onSubmit={saveProfile} className="mt-4 space-y-3">
          <Field label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" maxLength={60} />
          <Button type="submit" disabled={busy}>Save profile</Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-serif text-xl text-[#3e342c]">Data export</h2>
        <p className="mt-1 text-sm text-[#8a7a65]">Download everything stored under your account as JSON.</p>
        <Button onClick={() => void exportData()} className="mt-4">Export my data</Button>
      </Card>

      <Card>
        <h2 className="font-serif text-xl text-[#7c3b3d]">Delete account</h2>
        <p className="mt-1 text-sm text-[#8a7a65]">
          Removes all rows you own. Type <strong>DELETE</strong> to confirm. Auth record removal must be completed in Supabase dashboard (Authentication → Users).
        </p>
        <div className="mt-4 space-y-3">
          <Field label='Type DELETE to confirm' value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder="DELETE" />
          <Button variant="danger" disabled={busy} onClick={() => void deleteAccount()}>Delete all my data</Button>
        </div>
      </Card>
    </div>
  )
}
