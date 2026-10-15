import { useState } from 'react'
import type { Task } from '../lib/types'
import { Button } from './ui'

export function PrioritiesPanel({
  priorities, openTasks, onSave,
}: {
  priorities: (Task | null)[]
  openTasks: Task[]
  onSave: (ids: (string | null)[]) => Promise<string | null>
}) {
  const [pick, setPick] = useState<[string | null, string | null, string | null]>([null, null, null])
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <section className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-5">
      <h2 className="font-serif text-xl text-[#3e342c]">Three priorities</h2>
      <p className="text-xs text-[#8a7a65]">Each task appears once — picking updates the same row.</p>
      <ol className="mt-3 space-y-2">
        {priorities.map((p, i) => (
          <li key={i} className="flex items-center gap-2 rounded-xl border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#5c4a3f] text-xs font-bold text-[#faf6ef]">{i + 1}</span>
            <span className="flex-1 text-sm text-[#3e342c]">{p ? p.title : '— open slot —'}</span>
          </li>
        ))}
      </ol>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-[#5c4a3f]">Change priorities</summary>
        <div className="mt-2 space-y-2">
          {[0, 1, 2].map((slot) => (
            <label key={slot} className="block text-sm">
              <span className="text-[#8a7a65]">Slot {slot + 1}</span>
              <select
                value={pick[slot] ?? priorities[slot]?.id ?? ''}
                onChange={(e) => {
                  const next = [...pick] as [string | null, string | null, string | null]
                  next[slot] = e.target.value || null
                  setPick(next)
                }}
                className="mt-1 w-full rounded-xl border border-[#ddd0b8] bg-white px-3 py-2 text-sm"
              >
                <option value="">— none —</option>
                {openTasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </label>
          ))}
          {msg && <p className="text-xs text-[#7c3b3d]">{msg}</p>}
          <Button
            disabled={busy}
            onClick={async () => {
              const merged: (string | null)[] = [0, 1, 2].map((i) => pick[i] ?? priorities[i]?.id ?? null)
              const seen = new Set<string>()
              for (const id of merged) {
                if (id && seen.has(id)) {
                  setMsg('Each priority must be a different task.')
                  return
                }
                if (id) seen.add(id)
              }
              setBusy(true)
              const err = await onSave(merged)
              setBusy(false)
              if (err) setMsg(err)
              else {
                setPick([null, null, null])
                setMsg(null)
              }
            }}
          >
            {busy ? 'Saving…' : 'Save priorities'}
          </Button>
        </div>
      </details>
    </section>
  )
}

export function IntentionPanel({ initial, onSave }: { initial: string; onSave: (text: string) => Promise<string | null> }) {
  const [text, setText] = useState(initial)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <section className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-5">
      <h2 className="font-serif text-xl text-[#3e342c]">Daily intention</h2>
      <p className="text-xs text-[#8a7a65]">Optional. One gentle sentence.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={280}
        placeholder="e.g. Move gently, finish the big three."
        className="mt-3 w-full rounded-xl border border-[#ddd0b8] bg-[#faf6ef] px-3.5 py-2.5 text-sm outline-none placeholder:text-[#b6a98f] focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/30"
      />
      <div className="mt-2 flex items-center gap-2">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            const err = await onSave(text)
            setBusy(false)
            setMsg(err ?? 'Saved.')
          }}
        >
          {busy ? 'Saving…' : 'Save intention'}
        </Button>
        {msg && <span className="text-xs text-[#8a7a65]">{msg}</span>}
      </div>
    </section>
  )
}
