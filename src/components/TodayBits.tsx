import { useState } from 'react'
import type { Task } from '../lib/types'
import { addDaysISO } from '../lib/today-utils'

export function TaskRow({
  task,
  projectName,
  onToggle,
  onReschedule,
  extra,
}: {
  task: Task
  projectName?: string
  onToggle: (done: boolean) => void
  onReschedule: (nextISO: string) => void
  extra?: React.ReactNode
}) {
  const [showMove, setShowMove] = useState(false)
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const todayStr = `${y}-${m}-${d}`

  return (
    <li className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${task.done ? 'border-[#d9e2cb] bg-[#f2f5ec]' : 'border-[#e7dcc8] bg-white/80'}`}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={`Mark ${task.title} ${task.done ? 'not done' : 'done'}`}
        className="mt-1 h-4 w-4 accent-[#7d8b6f]"
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${task.done ? 'text-[#8a7a65] line-through' : 'text-[#3e342c]'}`}>{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#8a7a65]">
          {projectName && <span className="rounded-full bg-[#f1e9da] px-2 py-0.5">{projectName}</span>}
          {task.due_at && <span>Due {new Date(task.due_at).toLocaleDateString()}</span>}
          {task.scheduled_for && <span>Scheduled {task.scheduled_for}</span>}
          {task.waiting_on && <span>Waiting on {task.waiting_on}</span>}
          {extra}
        </div>
        {showMove && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[0, 1, 2, 3, 7].map((offset) => {
              const iso = addDaysISO(todayStr, offset)
              const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : iso.slice(5)
              return (
                <button
                  key={offset}
                  onClick={() => {
                    onReschedule(iso)
                    setShowMove(false)
                  }}
                  className="rounded-lg border border-[#ddd0b8] px-2 py-1 text-xs text-[#5c4a3f] hover:bg-[#f1e9da]"
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}
      </div>
      {!task.done && (
        <button
          onClick={() => setShowMove((v) => !v)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-[#5c4a3f] hover:bg-[#f1e9da]"
          aria-expanded={showMove}
        >
          Move
        </button>
      )}
    </li>
  )
}

export function Section({
  title,
  hint,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  hint: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span>
          <span className="font-serif text-lg text-[#3e342c]">{title}</span>
          <span className="ml-2 rounded-full bg-[#f1e9da] px-2 py-0.5 text-xs font-semibold text-[#5c4a3f]">{count}</span>
          <span className="ml-2 text-xs text-[#8a7a65]">{hint}</span>
        </span>
        <span className="text-[#8a7a65]" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && <ul className="mt-3 space-y-2">{children}</ul>}
    </section>
  )
}
