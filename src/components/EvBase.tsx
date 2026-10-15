import { useState } from 'react'
import type { Project, Task } from '../lib/types'
import { Button, Field } from './ui'
import { CATEGORIES, REMINDER_OPTIONS } from './EventForm'
import type { EventInput } from '../lib/useCalendar'

export type ModalInit = Partial<EventInput> & { id?: string }

export function MiniModal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-[#3e342c]/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e7dcc8] bg-[#faf6ef] p-6">
        <h2 className="font-serif text-2xl text-[#3e342c]">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function Sel({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: { v: string; label: string }[] }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-[#5c4a3f]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-[#ddd0b8] bg-white px-3 py-2.5 text-sm">
        {opts.map((o) => <option key={o.v + o.label} value={o.v}>{o.label}</option>)}
      </select>
    </label>
  )
}

export function useDraft(m: ModalInit) {
  const [title, setTitle] = useState(m.title ?? '')
  const [startsAt, setStartsAt] = useState(m.starts_at ?? '')
  const [endsAt, setEndsAt] = useState(m.ends_at ?? '')
  const [allDay, setAllDay] = useState(m.is_all_day ?? false)
  const [category, setCategory] = useState(m.category ?? 'personal')
  const [description, setDescription] = useState(m.description ?? '')
  const [location, setLocation] = useState(m.location ?? '')
  const [linkUrl, setLinkUrl] = useState(m.link_url ?? '')
  const [reminder, setReminder] = useState(m.reminder_minutes == null ? '' : String(m.reminder_minutes))
  const [projectId, setProjectId] = useState(m.project_id ?? '')
  const [taskId, setTaskId] = useState(m.task_id ?? '')
  const [recur, setRecur] = useState(m.recurrence_rule ?? '')
  const [recurUntil, setRecurUntil] = useState(m.recurrence_until ?? '')
  return { title, setTitle, startsAt, setStartsAt, endsAt, setEndsAt, allDay, setAllDay, category, setCategory, description, setDescription, location, setLocation, linkUrl, setLinkUrl, reminder, setReminder, projectId, setProjectId, taskId, setTaskId, recur, setRecur, recurUntil, setRecurUntil }
}

export { Button, Field, CATEGORIES, REMINDER_OPTIONS }
export type { Project, Task }
