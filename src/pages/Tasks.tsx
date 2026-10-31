import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Task } from '../lib/types'
import {
  EMPTY_FILTERS, filterTasks, nextActions, postponeTaskDates,
  quickList, unscheduledInbox, waitingList, type TaskFilters,
} from '../lib/task-utils'
import { todayISO } from '../lib/today-utils'
import { useTaskManager } from '../lib/useTaskManager'
import { Alert, Button } from '../components/ui'
import { BoardView, ListView } from '../components/TaskViews'
import { FilterBar, FocusSection, TaskCalendar } from '../components/TaskFilters'
import { TaskModal } from '../components/TaskModal'

type View = 'list' | 'board' | 'calendar' | 'next' | 'quick' | 'waiting' | 'inbox'
const VIEWS: { key: View; label: string }[] = [
  { key: 'list', label: 'List' },
  { key: 'board', label: 'Board' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'next', label: 'Next Actions' },
  { key: 'quick', label: 'Quick list' },
  { key: 'waiting', label: 'Waiting For' },
  { key: 'inbox', label: 'Inbox' },
]

export default function TasksPage() {
  const tm = useTaskManager()
  const [view, setView] = useState<View>('list')
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS)
  const [modalTask, setModalTask] = useState<Task | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [calCursor, setCalCursor] = useState(() => new Date())
  const today = todayISO()

  const filtered = useMemo(() => filterTasks(tm.tasks, filters, today), [tm.tasks, filters, today])

  function openNew() { setModalTask(null); setModalOpen(true) }
  function openEdit(t: Task) { setModalTask(t); setModalOpen(true) }

  async function onSave(patch: Record<string, unknown>): Promise<string | null> {
    if (modalTask) return (await tm.updateTask(modalTask.id, patch)).error
    return (await tm.createTask(patch)).error
  }

  async function onPostpone(id: string, days: number) {
    const task = tm.tasks.find((t) => t.id === id)
    if (!task) return
    const res = await tm.postpone(id, postponeTaskDates(task, days, today))
    if (res.error) tm.setError(res.error)
  }

  const handlers = {
    onToggle: (id: string, done: boolean) => void tm.toggleDone(id, done),
    onEdit: openEdit,
    onPostpone,
  }

  if (tm.loading) return <p className="py-16 text-center text-[#8a7a65]">Gathering tasks…</p>

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c9a24b]">Task manager</p>
          <h1 className="mt-1 font-serif text-3xl text-[#3e342c]">Actions</h1>
          <p className="mt-1 text-sm text-[#8a7a65]">
            Every view reads the same task rows as{' '}
            <Link to="/today" className="underline">Today</Link> and{' '}
            <Link to="/calendar" className="underline">Calendar</Link> — no duplicates.
          </p>
        </div>
        <Button onClick={openNew}>+ New task</Button>
      </div>

      {tm.error && <Alert kind="error">{tm.error}</Alert>}

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Task views">
        {VIEWS.map((v) => (
          <button
            key={v.key}

      {view === 'list' && (
        <ListView {...handlers} tasks={filtered} projects={tm.projects} onMoveStatus={(id, s) => void tm.moveToStatus(id, s)} />
      )}
      {view === 'board' && (
        <BoardView {...handlers} tasks={filtered} projects={tm.projects} onMoveStatus={(id, s) => void tm.moveToStatus(id, s)} />
      )}
      {view === 'calendar' && (
        <TaskCalendar
          tasks={filtered}
          cursor={calCursor}
          onShift={(m) => setCalCursor((c) => { const n = new Date(c); n.setMonth(n.getMonth() + m); return n })}
          onEdit={openEdit}
        />
      )}
      {view === 'next' && (
        <FocusSection title="Next actions" hint="Open, actionable, not blocked — ordered by urgency.">
          <ListView {...handlers} tasks={nextActions(filtered, today)} projects={tm.projects} emptyText="Nothing pressing. Enjoy the space." />
        </FocusSection>
      )}
      {view === 'quick' && (
        <FocusSection title="Quick list" hint="Tasks pinned for fast access.">
          <ListView {...handlers} tasks={quickList(filtered)} projects={tm.projects} emptyText="Pin tasks from the edit screen to gather them here." />
        </FocusSection>
      )}
      {view === 'waiting' && (
        <FocusSection title="Waiting for" hint="Blocked on someone or something.">
          <ListView {...handlers} tasks={waitingList(filtered)} projects={tm.projects} emptyText="Not waiting on anything." />
        </FocusSection>
      )}
      {view === 'inbox' && (
        <FocusSection title="Unscheduled inbox" hint="Captured but not yet given a day. Triage when ready.">
          <ListView {...handlers} tasks={unscheduledInbox(filtered)} projects={tm.projects} emptyText="Inbox zero. Well done." />
        </FocusSection>
      )}

      <p className="pb-4 text-center text-xs text-[#8a7a65]">
        Completing, postponing or editing updates the single task row — Today and Calendar reflect it immediately.
      </p>

      {modalOpen && (
        <TaskModal
          task={modalTask}
          subtasks={tm.subtasks}
          projects={tm.projects}
          goals={tm.goals}
          onSave={onSave}
          onDelete={tm.deleteTask}
          onClose={() => { setModalOpen(false); void tm.refresh() }}
          onAddSubtask={tm.addSubtask}
          onToggleSubtask={(id, done) => void tm.toggleSubtask(id, done)}
          onDeleteSubtask={(id) => void tm.deleteSubtask(id)}
        />
      )}
    </div>
  )
}

            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${view === v.key ? 'bg-[#5c4a3f] text-[#faf6ef]' : 'text-[#5c4a3f] hover:bg-[#f1e9da]'}`}
          >{v.label}</button>
        ))}
      </div>

      <FilterBar filters={filters} onChange={setFilters} projects={tm.projects} />
