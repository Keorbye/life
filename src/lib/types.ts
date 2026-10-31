// Shared row shapes. One task/project row lives in exactly one place and is
// referenced by id everywhere (views, priorities, sections) — never copied.

export const FUTURE_TABLES = [
  'calendar_events',
  'tasks',
  'projects',
  'goals',
  'notes',
  'journal_entries',
  'cycle_entries',
  'mood_entries',
  'time_tracking',
  'pomodoro_sessions',
  'areas',
  'resources',
] as const

// Every owner-only table (used by Settings export/delete). Includes tables
// added by later migrations that the Dashboard "coming soon" cards don't list.
export const OWNED_TABLES = [
  ...FUTURE_TABLES,
  'daily_plans',
  'task_subtasks',
  'project_milestones',
] as const

export type OwnedRow = {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

export type TaskBucket = 'must' | 'should' | 'could' | 'waiting' | 'unscheduled'

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskEnergy = 'low' | 'medium' | 'high'
export type ItemCategory = 'personal' | 'work' | 'health' | 'family' | 'finance' | 'learning' | 'spiritual' | 'other'

export type Task = OwnedRow & {
  title: string
  description: string | null
  done: boolean
  status: TaskStatus
  priority: TaskPriority
  category: ItemCategory
  due_at: string | null
  bucket: TaskBucket
  scheduled_for: string | null
  scheduled_time: string | null
  estimated_minutes: number | null
  energy: TaskEnergy | null
  notes: string | null
  is_quick: boolean
  priority_rank: 1 | 2 | 3 | null
  project_id: string | null
  goal_id: string | null
  waiting_on: string | null
}

export type Subtask = OwnedRow & {
  task_id: string
  title: string
  done: boolean
  position: number
}

// Back-compat alias: calendar code historically used EventCategory.
export type EventCategory = ItemCategory

export type CalendarEvent = OwnedRow & {
  title: string
  starts_at: string
  ends_at: string | null
  description: string | null
  is_all_day: boolean
  category: ItemCategory
  color: string | null
  location: string | null
  link_url: string | null
  reminder_minutes: number | null
  project_id: string | null
  task_id: string | null
  recurrence_rule: 'daily' | 'weekly' | 'monthly' | null
  recurrence_until: string | null
}

export type ProjectStatus = 'active' | 'upcoming' | 'paused' | 'completed' | 'archived'

export type Project = OwnedRow & {
  name: string
  description: string | null
  status: ProjectStatus
  category: ItemCategory
  start_at: string | null
  due_at: string | null
  notes: string | null
  color: string | null
  milestone_at: string | null
  milestone_label: string | null
}

export type ProjectMilestone = OwnedRow & {
  project_id: string
  title: string
  due_at: string | null
  done: boolean
  position: number
}

export type DailyPlan = OwnedRow & {
  plan_date: string
  intention: string | null
}

export type Profile = {
  id: string
  email: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export const TODAY_BUCKETS: { key: TaskBucket; label: string; hint: string }[] = [
  { key: 'must', label: 'Must Do', hint: 'Non-negotiable today' },
  { key: 'should', label: 'Should Do', hint: 'Important, flexible timing' },
  { key: 'could', label: 'Could Do', hint: 'If energy allows' },
  { key: 'waiting', label: 'Waiting For', hint: 'Blocked on someone or something' },
  { key: 'unscheduled', label: 'Unscheduled Tasks', hint: 'Parked, no day assigned' },
]

export const TASK_STATUSES: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'done', label: 'Done' },
]

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']
export const TASK_ENERGIES: TaskEnergy[] = ['low', 'medium', 'high']

export const PROJECT_STATUSES: { key: ProjectStatus; label: string; hint: string }[] = [
  { key: 'active', label: 'Active', hint: 'Being worked on now' },
  { key: 'upcoming', label: 'Upcoming', hint: 'Planned to start soon' },
  { key: 'paused', label: 'Paused', hint: 'On hold for now' },
  { key: 'completed', label: 'Completed', hint: 'Finished' },
  { key: 'archived', label: 'Archived', hint: 'Filed away' },
]

// New types for life-log features

export type MoodMood = 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible'
export type MoodStressLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type MoodEnergyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type MoodEntry = OwnedRow & {
  mood: MoodMood
  stress_level: MoodStressLevel
  energy_level: MoodEnergyLevel
  notes: string | null
  entry_date: string
}

export type TimeTrackingEntry = OwnedRow & {
  label: string
  color_code: string
  minutes: number
  date: string
}

export type PomodoroSessionType = 'pomodoro' | 'break' | 'stopwatch'

export type PomodoroSession = OwnedRow & {
  type: PomodoroSessionType
  duration_minutes: number
  started_at: string
  ended_at: string | null
  completed: boolean
  task_id: string | null
  notes: string | null
}

export type AreaCategory = 'finance' | 'fitness' | 'health' | 'family' | 'career' | 'habits' | 'mental_health' | 'other'

export type Area = OwnedRow & {
  name: string
  category: AreaCategory
  target_frequency: string | null
  current_streak: number
  best_streak: number
  last_activity_date: string | null
  notes: string | null
}

export type ResourceType = 'book' | 'article' | 'research' | 'framework' | 'reference' | 'other'
export type ResourceCategory = 'career' | 'hobbies' | 'health' | 'finance' | 'education' | 'other'
export type ResourceReadStatus = 'unread' | 'reading' | 'read' | 'favorite'
export type ResourcePriority = 'low' | 'medium' | 'high'

export type Resource = OwnedRow & {
  title: string
  type: ResourceType
  category: ResourceCategory
  summary: string | null
  author: string | null
  read_status: ResourceReadStatus
  progress_percentage: number
  priority: ResourcePriority
  tags: string[]
  source_url: string | null
}

