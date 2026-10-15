import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a24b]">Private · Calm · Yours</p>
      <h1 className="mx-auto mt-3 max-w-3xl font-serif text-5xl leading-tight text-[#3e342c]">
        A gentle home for planning your life
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-[#5c4a3f]">
        Secure sign-in, private data, and space for calendars, tasks, goals, notes, journals, and more — built calmly, one step at a time.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/signup" className="rounded-xl bg-[#5c4a3f] px-6 py-3 text-sm font-semibold text-[#faf6ef] hover:bg-[#3e342c]">
          Create account
        </Link>
        <Link to="/login" className="rounded-xl border border-[#5c4a3f] px-6 py-3 text-sm font-semibold text-[#5c4a3f] hover:bg-[#f1e9da]">
          Log in
        </Link>
      </div>
      <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
        {[
          { title: 'Secure by default', body: 'Email verification, password reset, PKCE sessions, and row-level security.' },
          { title: 'Private to you', body: 'Every row is owned by your user id. No sharing, no leaks.' },
          { title: 'Ready to grow', body: 'Database prepared for 7 future features — none built yet.' },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-[#e7dcc8] bg-white/70 p-5">
            <h2 className="font-serif text-lg text-[#3e342c]">{f.title}</h2>
            <p className="mt-1 text-sm text-[#5c4a3f]">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
