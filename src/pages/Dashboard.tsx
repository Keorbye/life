import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { FUTURE_TABLES } from '../lib/types'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-2xl border border-[#e7dcc8] bg-white/70 p-8 shadow-sm">
        <p className="text-sm text-[#8a7a65]">Signed in as {user?.email}</p>
        <h1 className="mt-1 font-serif text-4xl text-[#3e342c]">Your foundation is ready</h1>
        <p className="mt-2 max-w-2xl text-[#5c4a3f]">
          Authentication, private sessions, and per-user database policies are in place.
          Calendar, tasks, projects, goals, notes, journals, and cycle tracking are prepared in the schema — not built yet.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FUTURE_TABLES.map((table) => (
          <div key={table} className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-5">
            <h2 className="font-serif text-lg capitalize text-[#3e342c]">{table.replace(/_/g, ' ')}</h2>
            <p className="mt-1 text-sm text-[#8a7a65]">Schema ready · UI coming soon</p>
            <span className="mt-3 inline-block rounded-full bg-[#f1e9da] px-3 py-1 text-xs font-semibold text-[#5c4a3f]">
              Private to you
            </span>
          </div>
        ))}
        <Link to="/settings" className="rounded-2xl border border-dashed border-[#c9a24b] bg-[#faf3df]/60 p-5 transition hover:bg-[#faf3df]">
          <h2 className="font-serif text-lg text-[#3e342c]">Account settings</h2>
          <p className="mt-1 text-sm text-[#6b5a2e]">Manage profile, export data, or delete account →</p>
        </Link>
      </div>
    </div>
  )
}
