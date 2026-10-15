import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Nav() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-[#5c4a3f] text-[#faf6ef]' : 'text-[#5c4a3f] hover:bg-[#f1e9da]'
    }`

  return (
    <header className="sticky top-0 z-10 border-b border-[#e7dcc8] bg-[#faf6ef]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3" aria-label="Main">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold text-[#3e342c]">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#e8b4b8] via-[#c9a24b] to-[#a8b89a] text-lg" aria-hidden>
            ✿
          </span>
          Life
        </Link>

        <button
          className="rounded-lg border border-[#ddd0b8] px-3 py-2 text-sm md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <div className={`items-center gap-1 md:flex ${open ? 'absolute left-0 right-0 top-full flex flex-col bg-[#faf6ef] p-3 shadow-lg md:static md:flex-row md:bg-transparent md:p-0 md:shadow-none' : 'hidden md:flex'}`}>
          {user ? (
            <>
              <NavLink to="/today" className={linkClass} onClick={() => setOpen(false)}>Today</NavLink>
              <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>Dashboard</NavLink>
              <NavLink to="/settings" className={linkClass} onClick={() => setOpen(false)}>Settings</NavLink>
              <span className="hidden px-2 text-xs text-[#8a7a65] sm:inline" title={user.email}>
                {user.email}
              </span>
              <button
                onClick={() => { void signOut() }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#5c4a3f] hover:bg-[#f1e9da]"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>Log in</NavLink>
              <NavLink to="/signup" className={linkClass} onClick={() => setOpen(false)}>Sign up</NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
