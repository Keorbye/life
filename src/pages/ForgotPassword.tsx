import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Alert, Button, Card, Field } from '../components/ui'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const result = await resetPassword(email)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  return (
    <div className="flex justify-center px-4 py-12">
      <Card>
        <h1 className="font-serif text-3xl text-[#3e342c]">Reset password</h1>
        <p className="mt-1 text-sm text-[#8a7a65]">We'll email you a secure reset link.</p>
        {sent ? (
          <div className="mt-6 space-y-3">
            <Alert kind="success">Reset link sent — check your inbox (and spam folder).</Alert>
            <Link to="/login" className="block text-center text-sm font-semibold text-[#5c4a3f] underline">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && <Alert kind="error">{error}</Alert>}
            <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
