import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { detectOverlaps, overlapWarningText } from '../lib/calendar-utils'
import { Alert } from './ui'
import type { EventInput } from '../lib/useCalendar'
import { Button, MiniModal, useDraft, type ModalInit } from './EvBase'
import { EventFields } from './EventFields'
import type { CalendarEvent, Project, Task } from '../lib/types'

export function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EventModal({ init, projects, tasks, allEvents, onSave, onDelete, onClose }: {
  init: ModalInit
  projects: Project[]
  tasks: Task[]
  allEvents: CalendarEvent[]
  onSave: (input: EventInput, id?: string) => Promise<string | null>
  onDelete: (id: string) => Promise<string | null>
  onClose: () => void
}) {
  const d = useDraft({
    ...init,
    starts_at: init.starts_at ? toLocalInput(init.starts_at) : undefined,
    ends_at: init.ends_at ? toLocalInput(init.ends_at) : undefined,
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Warn-only overlap: never auto-moves or edits anything.
  const overlapCount = (() => {
    if (d.allDay || !d.startsAt || !d.endsAt) return 0
    const s = new Date(d.startsAt).getTime()
    const e = new Date(d.endsAt).getTime()
    if (!(e > s)) return 0
    const items = allEvents
      .filter((ev) => ev.id !== init.id && !ev.is_all_day && ev.ends_at)
      .map((ev) => ({ id: ev.id, start: new Date(ev.starts_at), end: new Date(ev.ends_at as string), allDay: false }))
    items.push({ id: '__draft', start: new Date(d.startsAt), end: new Date(d.endsAt), allDay: false })
    return (detectOverlaps(items).get('__draft') ?? []).length
  })()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!d.title.trim()) { setError('Give the event a title.'); return }
    if (!d.startsAt) { setError('Choose a start time.'); return }
    setBusy(true)
    const input: EventInput = {
      title: d.title.trim(),
      starts_at: new Date(d.startsAt).toISOString(),
      ends_at: d.allDay ? null : d.endsAt ? new Date(d.endsAt).toISOString() : null,
      description: d.description.trim() || null,
      is_all_day: d.allDay,
      category: d.category as EventInput['category'],
      color: null,
      location: d.location.trim() || null,
      link_url: d.linkUrl.trim() || null,
      reminder_minutes: d.reminder === '' ? null : Number(d.reminder),
      project_id: d.projectId || null,
      task_id: d.taskId || null,
      recurrence_rule: (d.recur || null) as EventInput['recurrence_rule'],
      recurrence_until: d.recur ? d.recurUntil || null : null,
    }
    const err = await onSave(input, init.id)
    setBusy(false)
    if (err) setError(err)
    else onClose()
  }

  return (
    <MiniModal title={init.id ? 'Edit event' : 'New event'}>
      <form onSubmit={submit}>
        {error && <div className="mt-1"><Alert kind="error">{error}</Alert></div>}
        {overlapCount > 0 && (
          <div className="mt-2"><Alert kind="error">⚠ {overlapWarningText(overlapCount)} — saving keeps both. Nothing changes automatically.</Alert></div>
        )}
        <EventFields d={d} projects={projects} tasks={tasks} />
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : init.id ? 'Save changes' : 'Create event'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          {init.id && (
            <Button type="button" variant="danger" onClick={async () => {
              if (!window.confirm('Delete this event?')) return
              const err = await onDelete(init.id as string)
              if (err) setError(err)
              else onClose()
            }}>Delete</Button>
          )}
        </div>
      </form>
    </MiniModal>
  )
}
