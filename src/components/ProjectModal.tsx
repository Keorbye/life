import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Project, ProjectStatus } from '../lib/types'
import { PROJECT_STATUSES } from '../lib/types'
import { CATEGORIES } from './EventForm'
import { Alert, Button, Field } from './ui'
import { MiniModal, Sel } from './EvBase'

export type ProjectDraft = {
  name: string
  description: string
  status: ProjectStatus
  category: Project['category']
  startAt: string // date value
  dueAt: string // date value
  notes: string
  color: string
}

function draftFrom(p: Project): ProjectDraft {
  return {
    name: p.name,
    description: p.description ?? '',
    status: p.status,
    category: p.category,
    startAt: p.start_at ?? '',
    dueAt: p.due_at ? p.due_at.slice(0, 10) : '',
    notes: p.notes ?? '',
    color: p.color ?? '',
  }
}

function emptyDraft(): ProjectDraft {
  return { name: '', description: '', status: 'active', category: 'personal', startAt: '', dueAt: '', notes: '', color: '' }
}

export function projectDraftToInput(d: ProjectDraft): Record<string, unknown> {
  return {
    name: d.name.trim(),
    description: d.description.trim() || null,
    status: d.status,
    category: d.category,
    start_at: d.startAt || null,
    due_at: d.dueAt ? new Date(`${d.dueAt}T23:59:59`).toISOString() : null,
    notes: d.notes.trim() || null,
    color: d.color.trim() || null,
  }
}

export function ProjectModal({
  project, onSave, onDelete, onClose,
}: {
  project: Project | null // null = new project
  onSave: (patch: Record<string, unknown>) => Promise<string | null>
  onDelete?: (id: string) => Promise<string | null>
  onClose: () => void
}) {
  const [d, setD] = useState<ProjectDraft>(project ? draftFrom(project) : emptyDraft())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof ProjectDraft>(k: K, v: ProjectDraft[K]) => setD((prev) => ({ ...prev, [k]: v }))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!d.name.trim()) { setError('Give the project a name.'); return }
    setBusy(true)
    const err = await onSave(projectDraftToInput(d))
    setBusy(false)
    if (err) setError(err)
    else onClose()
  }

  return (
    <MiniModal title={project ? 'Edit project' : 'New project'}>
      <form onSubmit={submit}>
        {error && <div className="mt-1"><Alert kind="error">{error}</Alert></div>}
        <div className="mt-3 space-y-3">
          <Field label="Name" value={d.name} onChange={(e) => set('name', e.target.value)} maxLength={140} required />
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[#5c4a3f]">Description</span>
            <textarea value={d.description} onChange={(e) => set('description', e.target.value)} rows={2} maxLength={1200} className="w-full rounded-xl border border-[#ddd0b8] bg-white px-3 py-2.5 text-sm" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Sel label="Status" value={d.status} onChange={(v) => set('status', v as ProjectStatus)} opts={PROJECT_STATUSES.map((s) => ({ v: s.key, label: s.label }))} />
            <Sel label="Category" value={d.category} onChange={(v) => set('category', v as Project['category'])} opts={CATEGORIES.map((c) => ({ v: c, label: c }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start date" type="date" value={d.startAt} onChange={(e) => set('startAt', e.target.value)} />
            <Field label="Deadline" type="date" value={d.dueAt} onChange={(e) => set('dueAt', e.target.value)} />
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[#5c4a3f]">Notes</span>
            <textarea value={d.notes} onChange={(e) => set('notes', e.target.value)} rows={3} maxLength={4000} className="w-full rounded-xl border border-[#ddd0b8] bg-white px-3 py-2.5 text-sm" />
          </label>
          <Field label="Color (hex, optional)" value={d.color} onChange={(e) => set('color', e.target.value)} placeholder="#c9a24b" maxLength={20} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : project ? 'Save changes' : 'Create project'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          {project && onDelete && (
            <Button type="button" variant="danger" onClick={async () => {
              if (!window.confirm('Delete this project? Its tasks stay, without a project.')) return
              const err = await onDelete(project.id)
              if (err) setError(err)
              else onClose()
            }}>Delete</Button>
          )}
        </div>
      </form>
    </MiniModal>
  )
}
