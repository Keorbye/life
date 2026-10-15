import { Field } from './ui'
import { CATEGORIES, REMINDER_OPTIONS, Sel, type useDraft } from './EvBase'
import type { Project, Task } from '../lib/types'

type D = ReturnType<typeof useDraft>

export function EventFields({ d, projects, tasks }: { d: D; projects: Project[]; tasks: Task[] }) {
  return (
    <div className="mt-3 space-y-3">
      <Field label="Title" value={d.title} onChange={(e) => d.setTitle(e.target.value)} maxLength={120} required />
      <label className="flex items-center gap-2 text-sm text-[#5c4a3f]">
        <input type="checkbox" checked={d.allDay} onChange={(e) => d.setAllDay(e.target.checked)} className="h-4 w-4 accent-[#7d8b6f]" /> All-day event
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Starts" type="datetime-local" value={d.startsAt} onChange={(e) => d.setStartsAt(e.target.value)} required />
        {!d.allDay && <Field label="Ends" type="datetime-local" value={d.endsAt} onChange={(e) => d.setEndsAt(e.target.value)} />}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Sel label="Category" value={d.category} onChange={(v) => d.setCategory(v as typeof d.category)} opts={CATEGORIES.map((c) => ({ v: c, label: c }))} />
        <Sel label="Reminder" value={d.reminder} onChange={d.setReminder} opts={REMINDER_OPTIONS.map((r) => ({ v: r.value == null ? '' : String(r.value), label: r.label }))} />
      </div>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-[#5c4a3f]">Description</span>
        <textarea value={d.description} onChange={(e) => d.setDescription(e.target.value)} rows={2} maxLength={1000} className="w-full rounded-xl border border-[#ddd0b8] bg-white px-3 py-2.5 text-sm" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Location (optional)" value={d.location} onChange={(e) => d.setLocation(e.target.value)} maxLength={200} />
        <Field label="Link (optional)" value={d.linkUrl} onChange={(e) => d.setLinkUrl(e.target.value)} maxLength={500} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Sel label="Project (optional)" value={d.projectId} onChange={d.setProjectId} opts={[{ v: '', label: '— none —' }, ...projects.map((p) => ({ v: p.id, label: p.name }))]} />
        <Sel label="Task (optional)" value={d.taskId} onChange={d.setTaskId} opts={[{ v: '', label: '— none —' }, ...tasks.filter((t) => !t.done).map((t) => ({ v: t.id, label: t.title }))]} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Sel label="Repeats" value={d.recur} onChange={d.setRecur} opts={[{ v: '', label: 'Does not repeat' }, { v: 'daily', label: 'Daily' }, { v: 'weekly', label: 'Weekly' }, { v: 'monthly', label: 'Monthly' }]} />
        {d.recur && <Field label="Repeat until (optional)" type="date" value={d.recurUntil} onChange={(e) => d.setRecurUntil(e.target.value)} />}
      </div>
    </div>
  )
}
