import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Alert, Button, Card, Field } from '../components/ui'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const result = await signIn(email, password)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="flex justify-center px-4 py-12">
      <Card>
        <h1 className="font-serif text-3xl text-[#3e342c]">Welcome back</h1>
        <p className="mt-1 text-sm text-[#8a7a65]">Your session is private to this device.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <Alert kind="error">{error}</Alert>}
          <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <Field label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-[#5c4a3f] underline">Forgot password?</Link>
          <Link to="/signup" className="font-semibold text-[#5c4a3f] underline">Create account</Link>
        </div>
      </Card>
    </div>
  )
}
