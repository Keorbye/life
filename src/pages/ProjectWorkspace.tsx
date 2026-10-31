import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useProjectsData } from '../lib/useProjects'
import { deadlineState, milestoneProgress, projectDeadlines, projectNextAction, projectProgress, upcomingMilestones } from '../lib/project-utils'
import { Alert, Button, ProgressBar } from '../components/ui'
import { ActionCard } from '../components/TaskViews'
import { TaskModal } from '../components/TaskModal'
import { ProjectModal } from '../components/ProjectModal'

export default function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>()
  const pm = useProjectsData()
  const navigate = useNavigate()
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [msTitle, setMsTitle] = useState('')
  const [msDue, setMsDue] = useState('')
  const [noteText, setNoteText] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const project = useMemo(() => pm.projects.find((p) => p.id === projectId) ?? null, [pm.projects, projectId])
  const myTasks = useMemo(() => pm.tasks.filter((t) => t.project_id === projectId), [pm.tasks, projectId])
  const myMilestones = useMemo(() => pm.milestones.filter((m) => m.project_id === projectId), [pm.milestones, projectId])

  if (pm.loading) return <p className="py-16 text-center text-[#8a7a65]">Opening workspace…</p>
  if (!project) {
    return (
      <div className="py-16 text-center">
        <p className="text-[#8a7a65]">Project not found.</p>
        <Link to="/projects" className="mt-2 inline-block text-[#5c4a3f] underline">Back to projects</Link>
      </div>
    )
  }

  const prog = projectProgress(myTasks, project.id)
  const next = projectNextAction(myTasks, project.id)
  const deadlines = projectDeadlines(myTasks, project.id)
  const ms = milestoneProgress(myMilestones)
  const nextMs = upcomingMilestones(myMilestones).find((m) => m.due_at)
  const notes = noteText ?? project.notes ?? ''
  const dState = deadlineState(project)

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      {pm.error && <Alert kind="error">{pm.error}</Alert>}
      <Link to="/projects" className="text-sm text-[#5c4a3f] underline">← All projects</Link>

      <header className="rounded-2xl border border-[#e7dcc8] bg-white/70 p-6" style={project.color ? { borderLeft: `4px solid ${project.color}` } : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-[#3e342c]">{project.name}</h1>
            <p className="mt-1 text-sm text-[#8a7a65]">{project.category} · {project.status}</p>
            {project.description && <p className="mt-2 max-w-2xl text-sm text-[#5c4a3f]">{project.description}</p>}
          </div>
          <Button variant="ghost" onClick={() => setEditOpen(true)}>Edit project</Button>
        </div>
        <div className="mt-4 max-w-md">
          <ProgressBar percent={prog.percent} done={prog.done} total={prog.total} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {project.start_at && <span className="rounded-full bg-[#f1e9da] px-3 py-1 text-[#5c4a3f]">Started {project.start_at}</span>}
          {project.due_at && (
            <span className={`rounded-full px-3 py-1 ${dState === 'overdue' ? 'bg-[#f9e8e8] text-[#7c3b3d]' : 'bg-[#faf3df] text-[#6b5a2e]'}`}>
              Deadline {new Date(project.due_at).toLocaleDateString()}{dState === 'overdue' ? ' · overdue' : ''}
            </span>
          )}
          {ms.total > 0 && <span className="rounded-full bg-[#eef3e7] px-3 py-1 text-[#4c5a40]">{ms.done}/{ms.total} milestones</span>}
        </div>
      </header>

      {next && (
        <section className="rounded-2xl border border-[#e6d3a3] bg-[#faf3df]/70 p-4" aria-label="Next action">
          <h2 className="font-serif text-lg text-[#6b5a2e]">Next action</h2>
          <p className="mt-1 text-sm text-[#6b5a2e]">{next.title}</p>
        </section>
      )}

      <section className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#3e342c]">Tasks <span className="rounded-full bg-[#f1e9da] px-2 py-0.5 text-xs">{prog.done}/{prog.total}</span></h2>
          <Button onClick={() => setTaskModalOpen(true)}>+ Add task</Button>
        </div>
        <ul className="mt-3 space-y-2">
          {myTasks.map((t) => (
            <ActionCard
              key={t.id}
              task={t}
              onToggle={(done) => void pm.toggleTaskDone(t.id, done)}
              onEdit={() => setTaskModalOpen(true)}
              onPostpone={(days) => void pm.postponeTask(t.id, days)}
              showStatus
            />
          ))}
          {myTasks.length === 0 && <li className="text-sm text-[#8a7a65]">No tasks in this project yet.</li>}
        </ul>
        {deadlines.length > 0 && (
          <div className="mt-4">
            <h3 className="font-serif text-base text-[#3e342c]">Deadlines</h3>
            <ul className="mt-1 space-y-1 text-sm text-[#5c4a3f]">
              {deadlines.slice(0, 5).map((t) => (
                <li key={t.id} className="flex justify-between gap-2">
                  <span>{t.title}</span>
                  <span className="text-xs text-[#8a7a65]">{t.due_at ? new Date(t.due_at).toLocaleDateString() : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
