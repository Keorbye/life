import type { Project, Task, TaskStatus } from '../lib/types'
import { TASK_STATUSES } from '../lib/types'
import { boardColumns, scheduleLabel } from '../lib/task-utils'

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-[#f1e9da] text-[#5c4a3f]',
  in_progress: 'bg-[#faf3df] text-[#6b5a2e]',
  blocked: 'bg-[#f9e8e8] text-[#7c3b3d]',
  done: 'bg-[#eef3e7] text-[#4c5a40]',
}

const PRIORITY_DOT: Record<string, string> = {
  high: '#b35555',
  medium: '#c9a24b',
  low: '#a8b89a',
}

/** Compact task card used by every manager view — the same row object. */
export function ActionCard({
  task, projectName, onToggle, onEdit, onMoveStatus, onPostpone, showStatus = false,
}: {
  task: Task
  projectName?: string
  onToggle: (done: boolean) => void
  onEdit: () => void
  onMoveStatus?: (status: TaskStatus) => void
  onPostpone?: (days: number) => void
  showStatus?: boolean
}) {
  const statusLabel = TASK_STATUSES.find((s) => s.key === task.status)?.label ?? task.status
  return (
    <li className={`rounded-xl border px-3 py-2.5 ${task.done ? 'border-[#d9e2cb] bg-[#f2f5ec]' : 'border-[#e7dcc8] bg-white/80'}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.done}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label={`Mark ${task.title} ${task.done ? 'not done' : 'done'}`}
          className="mt-1 h-4 w-4 accent-[#7d8b6f]"
        />
        <div className="min-w-0 flex-1">
          <button onClick={onEdit} className="block w-full text-left" aria-label={`Edit ${task.title}`}>
            <p className={`text-sm font-medium ${task.done ? 'text-[#8a7a65] line-through' : 'text-[#3e342c]'}`}>{task.title}</p>
          </button>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#8a7a65]">
            <span className="h-2 w-2 rounded-full" style={{ background: PRIORITY_DOT[task.priority] }} title={`${task.priority} priority`} aria-label={`${task.priority} priority`} />
            {showStatus && <span className={`rounded-full px-2 py-0.5 ${STATUS_STYLES[task.status]}`}>{statusLabel}</span>}
            {projectName && <span className="rounded-full bg-[#f1e9da] px-2 py-0.5">{projectName}</span>}
            {task.due_at && <span>Due {new Date(task.due_at).toLocaleDateString()}</span>}
            {scheduleLabel(task) && <span>Sched {scheduleLabel(task)}</span>}
            {task.estimated_minutes != null && <span>~{task.estimated_minutes}m</span>}
            {task.energy && <span>{task.energy} energy</span>}
            {task.waiting_on && <span>Waiting on {task.waiting_on}</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {!task.done && onPostpone && (
            <>
              <button onClick={() => onPostpone(1)} className="rounded-lg px-2 py-1 text-xs font-medium text-[#5c4a3f] hover:bg-[#f1e9da]" aria-label={`Postpone ${task.title} by a day`}>+1d</button>
              <button onClick={() => onPostpone(7)} className="rounded-lg px-2 py-1 text-xs font-medium text-[#5c4a3f] hover:bg-[#f1e9da]" aria-label={`Postpone ${task.title} by a week`}>+1w</button>
            </>
          )}
        </div>
      </div>
      {onMoveStatus && !task.done && (
        <div className="mt-1.5 flex items-center justify-end gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-[#b6a98f]">Move to</span>
          {TASK_STATUSES.filter((s) => s.key !== 'done' && s.key !== task.status).map((s) => (
            <button
              key={s.key}
              onClick={() => onMoveStatus(s.key)}
              className="rounded-lg border border-[#e7dcc8] px-1.5 py-0.5 text-[11px] text-[#5c4a3f] hover:bg-[#f1e9da]"
              aria-label={`Move ${task.title} to ${s.label}`}
            >{s.label}</button>
          ))}
        </div>
      )}
    </li>
  )
}


/** Kanban board grouped by status. Same rows as list/calendar views. */
export function BoardView({
  tasks, projects, onToggle, onEdit, onMoveStatus, onPostpone,
}: {
  tasks: Task[]
  projects: Project[]
  onToggle: (id: string, done: boolean) => void
  onEdit: (t: Task) => void
  onMoveStatus: (id: string, status: TaskStatus) => void
  onPostpone: (id: string, days: number) => void
}) {
  const nameOf = (id: string | null) => (id ? projects.find((p) => p.id === id)?.name : undefined)
  return (
    <div className="grid gap-3 lg:grid-cols-4" role="list" aria-label="Task board">
      {boardColumns(tasks).map((col) => (
        <section key={col.status} className="rounded-2xl border border-[#e7dcc8] bg-white/50 p-3" aria-label={`${col.status} column`}>
          <h3 className="font-serif text-base text-[#3e342c]">
            {TASK_STATUSES.find((s) => s.key === col.status)?.label}
            <span className="ml-2 rounded-full bg-[#f1e9da] px-2 py-0.5 text-xs font-semibold text-[#5c4a3f]">{col.tasks.length}</span>
          </h3>
          <ul className="mt-2 space-y-2">
            {col.tasks.map((t) => (
              <ActionCard
                key={t.id}
                task={t}
                projectName={nameOf(t.project_id)}
                onToggle={(done) => onToggle(t.id, done)}
                onEdit={() => onEdit(t)}
                onMoveStatus={(s) => onMoveStatus(t.id, s)}
                onPostpone={(days) => onPostpone(t.id, days)}
              />
            ))}
            {col.tasks.length === 0 && <li className="text-xs text-[#8a7a65]">Empty. Calm.</li>}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** Flat list with status chips — the default manager view. */
export function ListView({
  tasks, projects, onToggle, onEdit, onMoveStatus, onPostpone, emptyText,
}: {
  tasks: Task[]
  projects: Project[]
  onToggle: (id: string, done: boolean) => void
  onEdit: (t: Task) => void
  onMoveStatus?: (id: string, status: TaskStatus) => void
  onPostpone: (id: string, days: number) => void
  emptyText?: string
}) {
  const nameOf = (id: string | null) => (id ? projects.find((p) => p.id === id)?.name : undefined)
  if (tasks.length === 0) {
    return <p className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-6 text-center text-sm text-[#8a7a65]">{emptyText ?? 'Nothing here. Calm.'}</p>
  }
  return (
    <ul className="space-y-2" role="list">
      {tasks.map((t) => (
        <ActionCard
          key={t.id}
          task={t}
          projectName={nameOf(t.project_id)}
          onToggle={(done) => onToggle(t.id, done)}
          onEdit={() => onEdit(t)}
          onMoveStatus={onMoveStatus ? (s) => onMoveStatus(t.id, s) : undefined}
          onPostpone={(days) => onPostpone(t.id, days)}
          showStatus
        />
      ))}
    </ul>
  )
}
