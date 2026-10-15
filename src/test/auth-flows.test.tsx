import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import SignupPage from '../pages/Signup'

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ signUp: vi.fn() }),
}))

describe('Signup flow', () => {
  it('renders signup form with email verification messaging path', () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('rejects short passwords client-side', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.co')
    await userEvent.type(screen.getByLabelText(/password/i), 'short')
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 8 characters/i)
  })
})
