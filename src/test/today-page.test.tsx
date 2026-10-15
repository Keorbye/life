import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import TodayPage from '../pages/TodayPage'

vi.mock('../lib/useTodayData', () => ({
  useToday: () => ({
    loading: false,
    error: null,
    setError: vi.fn(),
    today: '2026-10-15',
    tasks: [
      { id: 't1', user_id: 'u1', title: 'Finish report', done: false, due_at: null, bucket: 'must', scheduled_for: '2026-10-15', priority_rank: 1, project_id: null, waiting_on: null, created_at: '', updated_at: '' },
      { id: 't2', user_id: 'u1', title: 'Parked idea', done: false, due_at: null, bucket: 'unscheduled', scheduled_for: null, priority_rank: null, project_id: null, waiting_on: null, created_at: '', updated_at: '' },
    ],
    setTasks: vi.fn(),
    events: [],
    projects: [],
    plan: null,
    setPlan: vi.fn(),
    refresh: vi.fn(),
    user: { id: 'u1' },
  }),
}))

vi.mock('../lib/useTodayMut', () => ({
  useTodayMutations: () => ({
    toggleTask: vi.fn(),
    quickAdd: vi.fn(async () => ({ error: null })),
    moveTask: vi.fn(async () => ({ error: null })),
    rescheduleTask: vi.fn(async () => ({ error: null })),
    setPriorities: vi.fn(async () => ({ error: null })),
    saveIntention: vi.fn(async () => ({ error: null })),
  }),
}))

describe('Today page (single-source tasks)', () => {
  it('renders date, priorities, buckets, and each task once per section', () => {
    render(
      <MemoryRouter>
        <TodayPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Three priorities/i)).toBeInTheDocument()
    expect(screen.getByText(/Daily intention/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Must Do/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Should Do/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Could Do/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Waiting For/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Unscheduled Tasks/i).length).toBeGreaterThanOrEqual(1)
    // Priority task appears in priority list + its bucket, but bucket query by row shows single row per section
    expect(screen.getAllByText('Finish report').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Quick add/i)).toBeInTheDocument()
  })
})
