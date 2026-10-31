import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Subtask, Task, TaskBucket } from '../lib/types'
import { TODAY_BUCKETS, TASK_STATUSES, TASK_PRIORITIES, TASK_ENERGIES } from '../lib/types'
import { CATEGORIES } from './EventForm'
import { Alert, Button, Field } from './ui'
import { MiniModal, Sel } from './EvBase'

export type TaskDraft = {
  title: string
  description: string
  status: Task['status']
  priority: Task['priority']
  category: Task['category']
  bucket: TaskBucket
  dueAt: string // datetime-local value
  scheduledFor: string // date value
  scheduledTime: string // time value
  estimatedMinutes: string
  energy: string
  notes: string
  isQuick: boolean
  projectId: string
  goalId: string
  waitingOn: string
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function draftFromTask(t: Task): TaskDraft {
  return {
    title: t.title,
    description: t.description ?? '',
    status: t.status,
    priority: t.priority,
    category: t.category,
    bucket: t.bucket,
    dueAt: t.due_at ? toLocalInput(t.due_at) : '',
    scheduledFor: t.scheduled_for ?? '',
    scheduledTime: t.scheduled_time ? t.scheduled_time.slice(0, 5) : '',
    estimatedMinutes: t.estimated_minutes == null ? '' : String(t.estimated_minutes),
    energy: t.energy ?? '',
    notes: t.notes ?? '',
    isQuick: t.is_quick,
    projectId: t.project_id ?? '',
    goalId: t.goal_id ?? '',
    waitingOn: t.waiting_on ?? '',
  }
}

export function emptyDraft(): TaskDraft {
  return {
    title: '', description: '', status: 'todo', priority: 'medium', category: 'personal',
    bucket: 'unscheduled', dueAt: '', scheduledFor: '', scheduledTime: '',
    estimatedMinutes: '', energy: '', notes: '', isQuick: false,
    projectId: '', goalId: '', waitingOn: '',
  }
}

export function draftToPatch(d: TaskDraft): Record<string, unknown> {
  return {
    title: d.title.trim(),
    description: d.description.trim() || null,
    status: d.status,
    priority: d.priority,
    category: d.category,
    bucket: d.bucket,
    due_at: d.dueAt ? new Date(d.dueAt).toISOString() : null,
    scheduled_for: d.scheduledFor || null,
    scheduled_time: d.scheduledTime || null,
    estimated_minutes: d.estimatedMinutes === '' ? null : Number(d.estimatedMinutes),
    energy: d.energy === '' ? null : d.energy,
    notes: d.notes.trim() || null,
    is_quick: d.isQuick,
    project_id: d.projectId || null,
    goal_id: d.goalId || null,
    waiting_on: d.waitingOn.trim() || null,
  }
}

export function TaskModal({
  task, subtasks, projects, goals, onSave, onDelete, onClose, onAddSubtask, onToggleSubtask, onDeleteSubtask,
}: {
  task: Task | null // null = new task
  subtasks: Subtask[]
  projects: { id: string; name: string }[]
  goals: { id: string; title: string }[]
  onSave: (patch: Record<string, unknown>) => Promise<string | null>
  onDelete?: (id: string) => Promise<string | null>
  onClose: () => void
  onAddSubtask?: (taskId: string, title: string) => Promise<string | null>
  onToggleSubtask?: (id: string, done: boolean) => void
  onDeleteSubtask?: (id: string) => void
}) {
  const [d, setD] = useState<TaskDraft>(task ? draftFromTask(task) : emptyDraft())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [subTitle, setSubTitle] = useState('')
  const set = <K extends keyof TaskDraft>(k: K, v: TaskDraft[K]) => setD((prev) => ({ ...prev, [k]: v }))
  const mine = task ? subtasks.filter((s) => s.task_id === task.id) : []

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!d.title.trim()) { setError('Give the task a title.'); return }
    setBusy(true)
    const err = await onSave(draftToPatch(d))
    setBusy(false)
    if (err) setError(err)
    else onClose()
  }

  return (
    <MiniModal title={task ? 'Edit task' : 'New task'}>
      <form onSubmit={submit}>
        {error && <div className="mt-1"><Alert kind="error">{error}</Alert></div>}
        <div className="mt-3 space-y-3">
          <Field label="Title" value={d.title} onChange={(e) => set('title', e.target.value)} maxLength={160} required />
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[#5c4a3f]">Description</span>
            <textarea value={d.description} onChange={(e) => set('description', e.target.value)} rows={2} maxLength={1200} className="w-full rounded-xl border border-[#ddd0b8] bg-white px-3 py-2.5 text-sm" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Sel label="Status" value={d.status} onChange={(v) => set('status', v as Task['status'])} opts={TASK_STATUSES.map((s) => ({ v: s.key, label: s.label }))} />
            <Sel label="Priority" value={d.priority} onChange={(v) => set('priority', v as Task['priority'])} opts={TASK_PRIORITIES.map((p) => ({ v: p, label: p }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Sel label="Today bucket" value={d.bucket} onChange={(v) => set('bucket', v as TaskBucket)} opts={TODAY_BUCKETS.map((b) => ({ v: b.key, label: b.label }))} />
            <Sel label="Category" value={d.category} onChange={(v) => set('category', v as Task['category'])} opts={CATEGORIES.map((c) => ({ v: c, label: c }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Due" type="datetime-local" value={d.dueAt} onChange={(e) => set('dueAt', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Scheduled day" type="date" value={d.scheduledFor} onChange={(e) => set('scheduledFor', e.target.value)} />
              <Field label="Time" type="time" value={d.scheduledTime} onChange={(e) => set('scheduledTime', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Est. minutes" type="number" min={1} value={d.estimatedMinutes} onChange={(e) => set('estimatedMinutes', e.target.value)} />
            <Sel label="Energy needed" value={d.energy} onChange={(v) => set('energy', v)} opts={[{ v: '', label: '— any —' }, ...TASK_ENERGIES.map((en) => ({ v: en, label: en }))]} />
            <Sel label="Project" value={d.projectId} onChange={(v) => set('projectId', v)} opts={[{ v: '', label: '— none —' }, ...projects.map((p) => ({ v: p.id, label: p.name }))]} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Sel label="Goal" value={d.goalId} onChange={(v) => set('goalId', v)} opts={[{ v: '', label: '— none —' }, ...goals.map((g) => ({ v: g.id, label: g.title }))]} />
            <Field label="Waiting on (person/thing)" value={d.waitingOn} onChange={(e) => set('waitingOn', e.target.value)} maxLength={120} />
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[#5c4a3f]">Notes</span>
            <textarea value={d.notes} onChange={(e) => set('notes', e.target.value)} rows={2} maxLength={2000} className="w-full rounded-xl border border-[#ddd0b8] bg-white px-3 py-2.5 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-sm text-[#5c4a3f]">
            <input type="checkbox" checked={d.isQuick} onChange={(e) => set('isQuick', e.target.checked)} className="h-4 w-4 accent-[#7d8b6f]" />
            Pin to quick list
          </label>

          {task && onAddSubtask && (
            <div className="rounded-xl border border-[#e7dcc8] bg-[#faf6ef] p-3">
              <p className="text-sm font-medium text-[#5c4a3f]">Subtasks</p>
              {mine.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {mine.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={s.done} onChange={(e) => onToggleSubtask?.(s.id, e.target.checked)} aria-label={`Mark subtask ${s.title} ${s.done ? 'not done' : 'done'}`} className="h-3.5 w-3.5 accent-[#7d8b6f]" />
                      <span className={`flex-1 ${s.done ? 'text-[#8a7a65] line-through' : 'text-[#3e342c]'}`}>{s.title}</span>
                      <button type="button" onClick={() => onDeleteSubtask?.(s.id)} className="text-xs text-[#b35555] underline-offset-2 hover:underline" aria-label={`Delete subtask ${s.title}`}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex gap-2">
                <input
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  placeholder="Add a subtask…"
                  maxLength={160}
                  className="flex-1 rounded-lg border border-[#ddd0b8] bg-white px-2.5 py-1.5 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={async () => {
                    const err = await onAddSubtask(task.id, subTitle)
                    if (!err) setSubTitle('')
                  }}
                >Add</Button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : task ? 'Save changes' : 'Create task'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          {task && onDelete && (
            <Button type="button" variant="danger" onClick={async () => {
              if (!window.confirm('Delete this task?')) return
              const err = await onDelete(task.id)
              if (err) setError(err)
              else onClose()
            }}>Delete</Button>
          )}
        </div>
      </form>
    </MiniModal>
  )
}
