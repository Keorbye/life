import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Alert, Button, Card, Field } from '../components/ui'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    const result = await updatePassword(password)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="flex justify-center px-4 py-12">
      <Card>
        <h1 className="font-serif text-3xl text-[#3e342c]">Choose a new password</h1>
        <p className="mt-1 text-sm text-[#8a7a65]">You arrived via a secure email link.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <Alert kind="error">{error}</Alert>}
          <Field label="New password (min 8 characters)" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
