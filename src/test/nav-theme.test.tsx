import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Nav from '../components/Nav'
import LandingPage from '../pages/Landing'

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: null, signOut: vi.fn() }),
}))

describe('Responsive navigation + calm theme', () => {
  it('shows login/signup when logged out and toggles mobile nav', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /toggle navigation/i }))
    expect(screen.getByRole('button', { name: /toggle navigation/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders calm landing with secure-by-default messaging', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/gentle home for planning/i)).toBeInTheDocument()
    expect(screen.getByText(/secure by default/i)).toBeInTheDocument()
  })
})
