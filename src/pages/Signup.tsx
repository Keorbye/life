import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Alert, Button, Card, Field } from '../components/ui'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
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
    const result = await signUp(email, password)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate(result.needsVerification ? '/verify?pending=1' : '/dashboard', { replace: true })
  }

  return (
    <div className="flex justify-center px-4 py-12">
      <Card>
        <h1 className="font-serif text-3xl text-[#3e342c]">Create your space</h1>
        <p className="mt-1 text-sm text-[#8a7a65]">A calm, private home for your plans.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <Alert kind="error">{error}</Alert>}
          <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <Field label="Password (min 8 characters)" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" minLength={8} />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[#8a7a65]">
          Already have an account? <Link to="/login" className="font-semibold text-[#5c4a3f] underline">Log in</Link>
        </p>
      </Card>
    </div>
  )
}
