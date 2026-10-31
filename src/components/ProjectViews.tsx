import type { Project, ProjectMilestone, ProjectStatus, Task } from '../lib/types'
import { PROJECT_STATUSES } from '../lib/types'
import { deadlineState, groupByStatus, milestoneProgress, projectNextAction, projectProgress, timelineBars } from '../lib/project-utils'
import { ProgressBar } from './ui'

const STATUS_BADGE: Record<ProjectStatus, string> = {
  active: 'bg-[#eef3e7] text-[#4c5a40]',
  upcoming: 'bg-[#faf3df] text-[#6b5a2e]',
  paused: 'bg-[#f1e9da] text-[#5c4a3f]',
  completed: 'bg-[#eef3e7] text-[#4c5a40]',
  archived: 'bg-[#f1e9da] text-[#8a7a65]',
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const label = PROJECT_STATUSES.find((s) => s.key === status)?.label ?? status
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[status]}`}>{label}</span>
}

function DeadlineChip({ project }: { project: Project }) {
  const state = deadlineState(project)
  if (state === 'none') return null
  const style = state === 'overdue' ? 'bg-[#f9e8e8] text-[#7c3b3d]' : state === 'soon' ? 'bg-[#faf3df] text-[#6b5a2e]' : 'bg-[#f1e9da] text-[#5c4a3f]'
  const when = project.due_at ? new Date(project.due_at).toLocaleDateString() : ''
  return <span className={`rounded-full px-2 py-0.5 text-xs ${style}`}>{state === 'overdue' ? 'Overdue · ' : 'Due '}{when}</span>
}

/** Shared summary line: completed vs remaining + next action. */
export function ProjectSummary({ project, tasks, milestones }: { project: Project; tasks: Task[]; milestones: ProjectMilestone[] }) {
  const prog = projectProgress(tasks, project.id)
  const next = projectNextAction(tasks, project.id)
  const ms = milestoneProgress(milestones.filter((m) => m.project_id === project.id))
  return (
    <div className="mt-2 space-y-2">
      <ProgressBar percent={prog.percent} done={prog.done} total={prog.total} />
      <div className="flex flex-wrap gap-2 text-xs text-[#8a7a65]">
        {ms.total > 0 && <span>{ms.done}/{ms.total} milestones</span>}
        {prog.total === 0 && <span>No tasks yet</span>}
      </div>
      {next && (
        <p className="text-xs text-[#5c4a3f]"><span className="font-semibold">Next:</span> {next.title}</p>
      )}
    </div>
  )
}

/** Gallery: visual cards with progress. */
export function GalleryView({
  projects, tasks, milestones, onOpen, onEdit,
}: {
  projects: Project[]
  tasks: Task[]
  milestones: ProjectMilestone[]
  onOpen: (p: Project) => void
  onEdit: (p: Project) => void
}) {
  if (projects.length === 0) {
    return <p className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-6 text-center text-sm text-[#8a7a65]">No projects yet. Create one to give your tasks a home.</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Project gallery">
      {projects.map((p) => (
        <article
          key={p.id}
          role="listitem"
          className="cursor-pointer rounded-2xl border border-[#e7dcc8] bg-white/70 p-5 transition hover:border-[#c9a24b]"
          style={p.color ? { borderLeft: `4px solid ${p.color}` } : undefined}
          onClick={() => onOpen(p)}
        >
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-serif text-lg text-[#3e342c]">{p.name}</h2>
            <StatusBadge status={p.status} />
          </div>
          {p.description && <p className="mt-1 line-clamp-2 text-sm text-[#8a7a65]">{p.description}</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#8a7a65]">
            <span className="rounded-full bg-[#f1e9da] px-2 py-0.5">{p.category}</span>
            <DeadlineChip project={p} />
          </div>
          <ProjectSummary project={p} tasks={tasks} milestones={milestones} />
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(p) }}
            className="mt-3 text-xs font-medium text-[#5c4a3f] underline-offset-4 hover:underline"
            aria-label={`Edit ${p.name}`}
          >Edit</button>
        </article>
      ))}
    </div>
  )

/** Board: columns by lifecycle status. Same project rows. */
export function ProjectBoard({
  projects, tasks, onOpen, onMove,
}: {
  projects: Project[]
  tasks: Task[]
  onOpen: (p: Project) => void
  onMove: (id: string, status: ProjectStatus) => void
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-5" role="list" aria-label="Project board">
      {groupByStatus(projects).map((col) => (
        <section key={col.status} className="rounded-2xl border border-[#e7dcc8] bg-white/50 p-3" aria-label={`${col.label} column`}>
          <h3 className="font-serif text-base text-[#3e342c]">
            {col.label}
            <span className="ml-2 rounded-full bg-[#f1e9da] px-2 py-0.5 text-xs font-semibold text-[#5c4a3f]">{col.projects.length}</span>
          </h3>
          <ul className="mt-2 space-y-2">
            {col.projects.map((p) => (
              <li key={p.id} className="rounded-xl border border-[#e7dcc8] bg-white/80 px-3 py-2.5">
                <button onClick={() => onOpen(p)} className="block w-full text-left" aria-label={`Open ${p.name}`}>
                  <p className="text-sm font-medium text-[#3e342c]">{p.name}</p>
                </button>
                <div className="mt-1"><ProgressBar percent={projectProgress(tasks, p.id).percent} /></div>
                <div className="mt-1.5 flex flex-wrap justify-end gap-1">
                  {PROJECT_STATUSES.filter((s) => s.key !== p.status).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => onMove(p.id, s.key)}
                      className="rounded-lg border border-[#e7dcc8] px-1.5 py-0.5 text-[11px] text-[#5c4a3f] hover:bg-[#f1e9da]"
                      aria-label={`Move ${p.name} to ${s.label}`}
                    >{s.label}</button>

/** List: compact rows with status + progress + next action. */
export function ProjectListView({
  projects, tasks, milestones, onOpen,
}: {
  projects: Project[]
  tasks: Task[]
  milestones: ProjectMilestone[]
  onOpen: (p: Project) => void
}) {
  if (projects.length === 0) {
    return <p className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-6 text-center text-sm text-[#8a7a65]">No projects yet.</p>
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#e7dcc8] bg-white/60">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#e7dcc8] text-xs uppercase tracking-wide text-[#8a7a65]">
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Progress</th>
            <th className="px-4 py-3">Deadline</th>
            <th className="px-4 py-3">Next action</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const next = projectNextAction(tasks, p.id)
            return (
              <tr key={p.id} className="border-b border-[#f1e9da] last:border-0 hover:bg-[#faf6ef]">
                <td className="px-4 py-3">
                  <button onClick={() => onOpen(p)} className="font-medium text-[#3e342c] hover:underline" aria-label={`Open ${p.name}`}>{p.name}</button>
                  <p className="text-xs text-[#8a7a65]">{p.category}{milestones.filter((m) => m.project_id === p.id && m.done).length > 0 ? ` · ${milestoneProgress(milestones.filter((m) => m.project_id === p.id)).done}/${milestoneProgress(milestones.filter((m) => m.project_id === p.id)).total} milestones` : ''}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="w-40 px-4 py-3"><ProgressBar percent={projectProgress(tasks, p.id).percent} /></td>
                <td className="px-4 py-3"><DeadlineChip project={p} /></td>
                <td className="px-4 py-3 text-xs text-[#5c4a3f]">{next ? next.title : <span className="text-[#8a7a65]">—</span>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Timeline: gantt-style bars over a date window. */
export function TimelineView({
  projects, windowStart, windowEnd, onOpen,
}: {
  projects: Project[]
  windowStart: Date
  windowEnd: Date
  onOpen: (p: Project) => void
}) {
  const bars = timelineBars(projects, windowStart, windowEnd)
  const months: string[] = []
  const cur = new Date(windowStart.getFullYear(), windowStart.getMonth(), 1)
  while (cur <= windowEnd) {
    months.push(cur.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }))
    cur.setMonth(cur.getMonth() + 1)
  }
  if (bars.length === 0) {
    return <p className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-6 text-center text-sm text-[#8a7a65]">No dated projects in this window. Set a start date or deadline to see bars.</p>
  }
  return (
    <div className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-4" role="list" aria-label="Project timeline">
      <div className="mb-2 grid grid-cols-[140px_1fr] gap-2 text-xs text-[#8a7a65]">

/** Calendar: month grid showing project deadlines, milestones and start dates. */
export function ProjectMonthGrid({
  projects, days, cursor, onOpen,
}: {
  projects: Project[]
  days: Date[]
  cursor: Date
  onOpen: (p: Project) => void
}) {
  const inMonth = (d: Date) => d.getMonth() === cursor.getMonth()
  const dayKey = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  return (
    <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label="Project calendar">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
        <div key={d} className="pb-1 text-center text-xs font-semibold uppercase tracking-wide text-[#8a7a65]">{d}</div>
      ))}
      {days.map((day, i) => {
        const key = dayKey(day)
        const items: { id: string; label: string; kind: 'deadline' | 'milestone' | 'start'; project: Project }[] = []
        for (const p of projects) {
          if (p.due_at && dayKey(new Date(p.due_at)) === key) {
            items.push({ id: `d-${p.id}`, label: `⚑ ${p.name}`, kind: 'deadline', project: p })
          }
          if (p.start_at === key) {
            items.push({ id: `s-${p.id}`, label: `▶ ${p.name}`, kind: 'start', project: p })
          }
        }
        return (
          <div key={i} role="gridcell" className={`min-h-[86px] rounded-xl border p-1.5 ${inMonth(day) ? 'border-[#e7dcc8] bg-white/70' : 'border-transparent bg-[#f1e9da]/40 opacity-60'}`}>
            <span className="text-xs font-semibold text-[#5c4a3f]">{day.getDate()}</span>
            <div className="mt-1 space-y-0.5">
              {items.slice(0, 3).map((it) => (
                <button
                  key={it.id}
                  onClick={() => onOpen(it.project)}
                  className={`block w-full truncate rounded px-1 text-left text-[10px] font-medium ${it.kind === 'deadline' ? 'bg-[#f9e8e8] text-[#7c3b3d]' : 'bg-[#eef3e7] text-[#4c5a40]'}`}
                  title={`${it.project.name} — ${it.kind}`}
                >{it.label}</button>
              ))}
              {items.length > 3 && <p className="text-[10px] text-[#8a7a65]">+{items.length - 3} more</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

        <span />
        <div className="flex justify-between">{months.map((m) => <span key={m}>{m}</span>)}</div>
      </div>
      <ul className="space-y-2">
        {bars.map((b) => (
          <li key={b.project.id} role="listitem" className="grid grid-cols-[140px_1fr] items-center gap-2">
            <button onClick={() => onOpen(b.project)} className="truncate text-left text-sm font-medium text-[#3e342c] hover:underline" aria-label={`Open ${b.project.name}`}>{b.project.name}</button>
            <div className="relative h-6 rounded-lg bg-[#f1e9da]/60">
              <button
                onClick={() => onOpen(b.project)}
                className="absolute top-0 h-6 rounded-lg px-1 text-left text-[10px] font-semibold text-white"
                style={{
                  left: `${b.leftPercent}%`,
                  width: `${b.widthPercent}%`,
                  background: b.project.color ?? (b.dueInside && deadlineState(b.project) === 'overdue' ? '#b35555' : '#7d8b6f'),
                }}
                aria-label={`${b.project.name} bar, ${Math.round(b.widthPercent)}% of window`}
              >
                <span className="line-clamp-1">{b.project.name}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

                  ))}
                </div>
              </li>
            ))}
            {col.projects.length === 0 && <li className="text-xs text-[#8a7a65]">Empty.</li>}
          </ul>
        </section>
      ))}
    </div>
  )
}

}
