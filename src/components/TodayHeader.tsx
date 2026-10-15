import { useState } from 'react'
import type { FormEvent } from 'react'
import type { TaskBucket } from '../lib/types'
import { formatLongDate } from '../lib/today-utils'
import { Button, Field } from './ui'

export function TodayHeader({
  today, scheduledCount, dueCount, overdueCount, freeLabel, onQuickAdd,
}: {
  today: string
  scheduledCount: number
  dueCount: number
  overdueCount: number
  freeLabel: string
  onQuickAdd: (title: string, bucket: TaskBucket) => Promise<string | null>
}) {
  const [title, setTitle] = useState('')
  const [bucket, setBucket] = useState<TaskBucket>('must')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const err = await onQuickAdd(title, bucket)
    setBusy(false)
    if (!err) setTitle('')
  }

  return (
    <div className="rounded-2xl border border-[#e7dcc8] bg-white/70 p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c9a24b]">Today</p>
      <h1 className="mt-1 font-serif text-3xl text-[#3e342c] sm:text-4xl">{formatLongDate(today)}</h1>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-[#eef3e7] px-3 py-1 text-[#4c5a40]">~{freeLabel} free</span>
        <span className="rounded-full bg-[#f1e9da] px-3 py-1 text-[#5c4a3f]">{scheduledCount} scheduled</span>
        <span className="rounded-full bg-[#faf3df] px-3 py-1 text-[#6b5a2e]">{dueCount} due today</span>
        {overdueCount > 0 && (
          <span className="rounded-full bg-[#f9e8e8] px-3 py-1 text-[#7c3b3d]">{overdueCount} overdue</span>
        )}
      </div>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Field label="Quick add" placeholder="Add something for today…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[#5c4a3f]">Bucket</span>
          <select value={bucket} onChange={(e) => setBucket(e.target.value as TaskBucket)} className="w-full rounded-xl border border-[#ddd0b8] bg-[#faf6ef] px-3.5 py-2.5 text-sm sm:w-36">
            <option value="must">Must Do</option>
            <option value="should">Should Do</option>
            <option value="could">Could Do</option>
            <option value="waiting">Waiting For</option>
            <option value="unscheduled">Unscheduled</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">{busy ? 'Adding…' : 'Add'}</Button>
        </div>
      </form>
    </div>
  )
}
