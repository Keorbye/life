// Database types — regenerated via `supabase gen types` after migration.
// Tables are created empty (no rows) with RLS owner-only policies so
// future calendar, task, project, goal, note, journal and cycle features
// can be built without reworking auth.

export type Profile = {
  id: string
  email: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export type OwnedRow = {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

// Placeholder row shapes for future features (tables exist, UI not built yet)
export type CalendarEvent = OwnedRow & {
  title: string
  starts_at: string
  ends_at: string | null
  description: string | null
}
export type Task = OwnedRow & {
  title: string
  done: boolean
  due_at: string | null
}
export type Project = OwnedRow & { name: string; description: string | null }
export type Goal = OwnedRow & { title: string; done: boolean }
export type Note = OwnedRow & { title: string; body: string | null }
export type JournalEntry = OwnedRow & { body: string; entry_date: string }
export type CycleEntry = OwnedRow & { entry_date: string; notes: string | null }

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile }
      calendar_events: { Row: CalendarEvent }
      tasks: { Row: Task }
      projects: { Row: Project }
      goals: { Row: Goal }
      notes: { Row: Note }
      journal_entries: { Row: JournalEntry }
      cycle_entries: { Row: CycleEntry }
    }
  }
}

export const FUTURE_TABLES = [
  'calendar_events',
  'tasks',
  'projects',
  'goals',
  'notes',
  'journal_entries',
  'cycle_entries',
] as const
