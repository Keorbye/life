import type { Project, Task } from '../lib/types'
import { TASK_STATUSES, TASK_PRIORITIES, TASK_ENERGIES } from '../lib/types'
import { TIME_FITS, tasksForDay, type TaskFilters } from '../lib/task-utils'
import { monthGridDays } from '../lib/calendar-utils'
import { toISODate } from '../lib/today-utils'
import { Button } from './ui'

export const DEFAULT_FILTERS: TaskFilters = {
  priority: 'any', status: 'any', due: 'any', projectId: 'any', fitsMinutes: null, energy: 'any',
}

export function FilterBar({
  filters, onChange, projects,
}: {
  filters: TaskFilters
  onChange: (f: TaskFilters) => void
  projects: Project[]
}) {
  const set = <K extends keyof TaskFilters>(k: K, v: TaskFilters[K]) => onChange({ ...filters, [k]: v })
  const sel = 'rounded-xl border border-[#ddd0b8] bg-[#faf6ef] px-2.5 py-1.5 text-sm'
  const dirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#e7dcc8] bg-white/60 p-4" role="group" aria-label="Task filters">
      <label className="block text-xs font-medium text-[#5c4a3f]">Priority
        <select value={filters.priority} onChange={(e) => set('priority', e.target.value as TaskFilters['priority'])} className={`${sel} mt-1 block`} aria-label="Filter by priority">
          <option value="any">Any</option>
          {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <label className="block text-xs font-medium text-[#5c4a3f]">Status
        <select value={filters.status} onChange={(e) => set('status', e.target.value as TaskFilters['status'])} className={`${sel} mt-1 block`} aria-label="Filter by status">
          <option value="any">Any</option>
          {TASK_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </label>
      <label className="block text-xs font-medium text-[#5c4a3f]">Due
        <select value={filters.due} onChange={(e) => set('due', e.target.value as TaskFilters['due'])} className={`${sel} mt-1 block`} aria-label="Filter by due date">
          <option value="any">Any</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="week">Next 7 days</option>
          <option value="none">No due date</option>
        </select>
      </label>
      <label className="block text-xs font-medium text-[#5c4a3f]">Project
        <select value={filters.projectId} onChange={(e) => set('projectId', e.target.value)} className={`${sel} mt-1 block`} aria-label="Filter by project">
          <option value="any">Any</option>
          <option value="none">No project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="block text-xs font-medium text-[#5c4a3f]">Available time
        <select value={String(filters.fitsMinutes ?? '')} onChange={(e) => set('fitsMinutes', e.target.value === '' ? null : Number(e.target.value))} className={`${sel} mt-1 block`} aria-label="Filter by available time">
          {TIME_FITS.map((t) => <option key={t.key} value={String(t.minutes ?? '')}>{t.label}</option>)}
        </select>
      </label>
      <label className="block text-xs font-medium text-[#5c4a3f]">Energy
        <select value={filters.energy} onChange={(e) => set('energy', e.target.value as TaskFilters['energy'])} className={`${sel} mt-1 block`} aria-label="Filter by energy">
          <option value="any">Any</option>
          {TASK_ENERGIES.map((en) => <option key={en} value={en}>{en}</option>)}
        </select>
      </label>
      {dirty && (
        <button onClick={() => onChange(DEFAULT_FILTERS)} className="rounded-lg px-2 py-1.5 text-xs font-medium text-[#5c4a3f] underline-offset-4 hover:underline">Clear filters</button>
      )}
    </div>
  )
}

export function FocusSection({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e7dcc8] bg-white/50 p-4">
      <h2 className="font-serif text-xl text-[#3e342c]">{title}</h2>
      <p className="text-xs text-[#8a7a65]">{hint}</p>
      <div className="mt-3">{children}</div>
    </section>

/** Month grid of task rows: scheduled that day OR due that day (deduped by id). */
export function TaskCalendar({
  tasks, cursor, onShift, onEdit,
}: {
  tasks: Task[]
  cursor: Date
  onShift: (months: number) => void
  onEdit: (t: Task) => void
}) {
  const days = monthGridDays(cursor)
  const inMonth = (d: Date) => d.getMonth() === cursor.getMonth()
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Button variant="ghost" onClick={() => onShift(-1)} aria-label="Previous month">←</Button>
        <h2 className="font-serif text-lg text-[#3e342c]">{monthLabel}</h2>
        <Button variant="ghost" onClick={() => onShift(1)} aria-label="Next month">→</Button>
      </div>
      <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label="Task calendar">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="pb-1 text-center text-xs font-semibold uppercase tracking-wide text-[#8a7a65]">{d}</div>
        ))}
        {days.map((d, i) => {
          const dayTasks = tasksForDay(tasks, toISODate(d))
          return (
            <div key={i} role="gridcell" className={`min-h-[86px] rounded-xl border p-1.5 ${inMonth(d) ? 'border-[#e7dcc8] bg-white/70' : 'border-transparent bg-[#f1e9da]/40 opacity-60'}`}>
              <span className="text-xs font-semibold text-[#5c4a3f]">{d.getDate()}</span>
              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <button key={t.id} onClick={() => onEdit(t)} className="block w-full truncate rounded bg-[#f1e9da] px-1 text-left text-[10px] font-medium text-[#3e342c]" title={t.title}>
                    {t.scheduled_time ? `${t.scheduled_time.slice(0, 5)} ` : ''}{t.title}
                  </button>
                ))}
                {dayTasks.length > 3 && <p className="text-[10px] text-[#8a7a65]">+{dayTasks.length - 3} more</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

  )
}
