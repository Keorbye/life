import type { CalendarEvent, Project, Task } from '../lib/types'
import { TaskRow } from './TodayBits'

export function SchedulePanel({
  events, upcoming, dueToday, onToggle, onReschedule, projectName,
}: {
  events: CalendarEvent[]
  upcoming: Task[]
  dueToday: Task[]
  onToggle: (id: string, done: boolean) => void
  onReschedule: (id: string, iso: string) => void
  projectName: (id: string | null) => string | undefined
}) {
  return (
    <section className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-5">
      <h2 className="font-serif text-xl text-[#3e342c]">Scheduled events</h2>
      {events.length === 0 ? (
        <p className="mt-2 text-sm text-[#8a7a65]">Nothing on the calendar today. Open space.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {events.map((e) => (
            <li key={e.id} className="rounded-xl border border-[#e7dcc8] bg-white/80 px-3 py-2.5">
              <span className="block text-sm font-medium text-[#3e342c]">{e.title}</span>
              <span className="text-xs text-[#8a7a65]">
                {new Date(e.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                {e.ends_at ? ` – ${new Date(e.ends_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      <h3 className="mt-5 font-serif text-lg text-[#3e342c]">Tasks due today</h3>
      {dueToday.length === 0 ? (
        <p className="mt-1 text-sm text-[#8a7a65]">Nothing due today.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {dueToday.map((t) => (
            <TaskRow key={t.id} task={t} projectName={projectName(t.project_id)} onToggle={(done) => onToggle(t.id, done)} onReschedule={(iso) => onReschedule(t.id, iso)} />
          ))}
        </ul>
      )}
      <h3 className="mt-5 font-serif text-lg text-[#3e342c]">Upcoming deadlines</h3>
      {upcoming.length === 0 ? (
        <p className="mt-1 text-sm text-[#8a7a65]">No deadlines in the next 7 days.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {upcoming.map((t) => (
            <TaskRow key={t.id} task={t} projectName={projectName(t.project_id)} onToggle={(done) => onToggle(t.id, done)} onReschedule={(iso) => onReschedule(t.id, iso)} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function ProjectsPanel({ projects, openCount }: { projects: Project[]; openCount: (id: string) => number }) {
  return (
    <section className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-5">
      <h2 className="font-serif text-xl text-[#3e342c]">Active projects</h2>
      {projects.length === 0 ? (
        <p className="mt-2 text-sm text-[#8a7a65]">No projects yet. Rows created later will appear here.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {projects.slice(0, 6).map((p) => {
            const count = openCount(p.id)
            return (
              <li key={p.id} className="rounded-xl border border-[#e7dcc8] bg-white/80 px-3 py-2.5">
                <span className="block text-sm font-medium text-[#3e342c]">{p.name}</span>
                <span className="text-xs text-[#8a7a65]">{count} open task{count === 1 ? '' : 's'}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
