import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, ProjectStatus } from '../lib/types'
import { PROJECT_STATUSES } from '../lib/types'
import { useProjectsData } from '../lib/useProjects'
import { monthGridDays, endOfMonth, startOfMonth, endOfWeek, startOfWeek } from '../lib/calendar-utils'
import { Alert, Button } from '../components/ui'
import { GalleryView, ProjectBoard, ProjectListView, TimelineView } from '../components/ProjectViews'
import { ProjectModal } from '../components/ProjectModal'

type View = 'gallery' | 'board' | 'list' | 'calendar' | 'timeline'
const VIEWS: { key: View; label: string }[] = [
  { key: 'gallery', label: 'Gallery' },
  { key: 'board', label: 'Board' },
  { key: 'list', label: 'List' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'timeline', label: 'Timeline' },
]

export default function ProjectsPage() {
  const pm = useProjectsData()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('gallery')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'any'>('any')
  const [modalProject, setModalProject] = useState<Project | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [cursor, setCursor] = useState(() => new Date())

  const visible = useMemo(
    () => pm.projects.filter((p) => statusFilter === 'any' || p.status === statusFilter),
    [pm.projects, statusFilter],
  )

  function openNew() { setModalProject(null); setModalOpen(true) }
  function openEdit(p: Project) { setModalProject(p); setModalOpen(true) }
  function openWorkspace(p: Project) { navigate(`/projects/${p.id}`) }

  async function onSave(patch: Record<string, unknown>): Promise<string | null> {
    if (modalProject) return (await pm.updateProject(modalProject.id, patch)).error
    return (await pm.createProject(patch as Parameters<typeof pm.createProject>[0])).error
  }

  // Calendar window: current month grid range; timeline: 3 months around today.
  const calDays = monthGridDays(cursor)
  const tlStart = startOfWeek(startOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1))))
  const tlEnd = endOfWeek(endOfMonth(new Date(new Date().setMonth(new Date().getMonth() + 1))))

  if (pm.loading) return <p className="py-16 text-center text-[#8a7a65]">Gathering projects…</p>

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c9a24b]">Project management</p>
          <h1 className="mt-1 font-serif text-3xl text-[#3e342c]">Projects</h1>
          <p className="mt-1 text-sm text-[#8a7a65]">Progress is computed from the same task rows as Today, Calendar and the task manager.</p>
        </div>
        <Button onClick={openNew}>+ New project</Button>
      </div>

      {pm.error && <Alert kind="error">{pm.error}</Alert>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Project views">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              role="tab"
              aria-selected={view === v.key}
              onClick={() => setView(v.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${view === v.key ? 'bg-[#5c4a3f] text-[#faf6ef]' : 'text-[#5c4a3f] hover:bg-[#f1e9da]'}`}
            >{v.label}</button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'any')}
          className="rounded-xl border border-[#ddd0b8] bg-[#faf6ef] px-2.5 py-1.5 text-sm"
          aria-label="Filter by project status"
        >
          <option value="any">All statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {view === 'gallery' && (
        <GalleryView projects={visible} tasks={pm.tasks} milestones={pm.milestones} onOpen={openWorkspace} onEdit={openEdit} />
      )}
      {view === 'board' && (
        <ProjectBoard projects={visible} tasks={pm.tasks} onOpen={openWorkspace} onMove={(id, s) => void pm.changeStatus(id, s)} />
      )}
      {view === 'list' && (
        <ProjectListView projects={visible} tasks={pm.tasks} milestones={pm.milestones} onOpen={openWorkspace} />
      )}
      {view === 'calendar' && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Button variant="ghost" onClick={() => setCursor((c) => { const n = new Date(c); n.setMonth(n.getMonth() - 1); return n })} aria-label="Previous month">←</Button>
            <h2 className="font-serif text-lg text-[#3e342c]">{cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
            <Button variant="ghost" onClick={() => setCursor((c) => { const n = new Date(c); n.setMonth(n.getMonth() + 1); return n })} aria-label="Next month">→</Button>
          </div>
          <ProjectMonthGrid projects={visible} days={calDays} cursor={cursor} onOpen={openWorkspace} />
        </div>
      )}
      {view === 'timeline' && (
        <TimelineView projects={visible} windowStart={tlStart} windowEnd={tlEnd} onOpen={openWorkspace} />
      )}

      <p className="pb-4 text-center text-xs text-[#8a7a65]">
        Open a project for its full workspace — tasks, milestones, notes and deadlines in one place.
      </p>

      {modalOpen && (
        <ProjectModal
          project={modalProject}
          onSave={onSave}
          onDelete={pm.deleteProject}
          onClose={() => { setModalOpen(false); void pm.refresh() }}
        />
      )}
    </div>
  )
}
