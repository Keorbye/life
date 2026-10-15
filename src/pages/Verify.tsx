import { useSearchParams, Link } from 'react-router-dom'
import { Alert, Card } from '../components/ui'

export default function VerifyPage() {
  const [params] = useSearchParams()
  const pending = params.get('pending') === '1'

  return (
    <div className="flex justify-center px-4 py-12">
      <Card>
        <h1 className="font-serif text-3xl text-[#3e342c]">Check your inbox</h1>
        {pending ? (
          <div className="mt-4 space-y-3">
            <Alert kind="info">
              We sent a verification link to your email. Click it to finish creating your account, then log in.
            </Alert>
            <p className="text-sm text-[#8a7a65]">
              Didn't get it? Check spam, then try signing up again or use password reset.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Alert kind="success">
              Email verified — you can now log in. If you landed here from the email link, your verification is complete.
            </Alert>
          </div>
        )}
        <div className="mt-6 flex gap-3 text-sm">
          <Link to="/login" className="font-semibold text-[#5c4a3f] underline">Go to login</Link>
          <Link to="/forgot-password" className="text-[#5c4a3f] underline">Resend via password reset</Link>
        </div>
      </Card>
    </div>
  )
}
