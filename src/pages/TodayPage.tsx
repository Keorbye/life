import { useMemo } from 'react'
import { useToday } from '../lib/useTodayData'
import { useTodayMutations } from '../lib/useTodayMut'
import { TODAY_BUCKETS, type Task, type TaskBucket } from '../lib/types'
import { availableMinutesToday, formatMinutes, isOverdue, todayISO } from '../lib/today-utils'
import { Alert } from '../components/ui'
import { Section, TaskRow } from '../components/TodayBits'
import { TodayHeader } from '../components/TodayHeader'
import { IntentionPanel, PrioritiesPanel } from '../components/TodayPanels'
import { ProjectsPanel, SchedulePanel } from '../components/TodaySchedule'

export default function TodayPage() {
  const { loading, error, setError, today, tasks, setTasks, events, projects, plan, setPlan, refresh, user } = useToday()
  const muts = useTodayMutations(user?.id, today, tasks, setTasks, setPlan, refresh)
  const projectName = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p.name]))
    return (id: string | null) => (id ? map.get(id) : undefined)
  }, [projects])
  const priorities = useMemo(() => {
    const ranked = tasks.filter((t) => t.priority_rank !== null).sort((a, b) => (a.priority_rank ?? 9) - (b.priority_rank ?? 9))
    return [ranked[0] ?? null, ranked[1] ?? null, ranked[2] ?? null]
  }, [tasks])
  const openTasks = useMemo(() => tasks.filter((t) => !t.done), [tasks])
  const scheduledToday = useMemo(() => {
    const iso = todayISO()
    return tasks.filter((t) => !t.done && (t.scheduled_for === iso || (t.scheduled_for === null && t.bucket !== 'unscheduled' && t.bucket !== 'waiting')))
  }, [tasks])
  const dueToday = useMemo(() => {
    const iso = todayISO()
    return tasks.filter((t) => {
      if (t.done || !t.due_at) return false
      const d = new Date(t.due_at)
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const key = `${d.getFullYear()}-${mm}-${dd}`
      return key === iso
    })
  }, [tasks])
  const overdue = useMemo(() => tasks.filter((t) => !t.done && isOverdue(t.due_at)), [tasks])
  const upcoming = useMemo(() => {
    const now = Date.now()
    const week = now + 7 * 24 * 3600 * 1000
    return tasks.filter((t) => {
      if (t.done || !t.due_at) return false
      const time = new Date(t.due_at).getTime()
      return time > now && time <= week
    }).sort((a, b) => new Date(a.due_at ?? '').getTime() - new Date(b.due_at ?? '').getTime()).slice(0, 5)
  }, [tasks])
  const freeMins = useMemo(() => availableMinutesToday(events), [events])
  if (loading) return <p className="py-16 text-center text-[#8a7a65]">Gathering today…</p>

  function TodayRender() {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {error && <Alert kind="error">{error}</Alert>}
        <TodayHeader
          today={today}
          scheduledCount={scheduledToday.length}
          dueCount={dueToday.length}
          overdueCount={overdue.length}
          freeLabel={formatMinutes(freeMins)}
          onQuickAdd={async (title, bucket) => {
            const res = await muts.quickAdd(title, bucket)
            if (res.error) setError(res.error)
            return res.error
          }}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <PrioritiesPanel
            priorities={priorities}
            openTasks={openTasks}
            onSave={async (ids) => {
              const res = await muts.setPriorities(ids)
              if (res.error) setError(res.error)
              return res.error
            }}
          />
          <IntentionPanel
            initial={plan?.intention ?? ''}
            onSave={async (text) => {
              const res = await muts.saveIntention(text)
              if (res.error) setError(res.error)
              return res.error
            }}
          />
        </div>
        {overdue.length > 0 && (
          <section className="rounded-2xl border border-[#d48c8e] bg-[#f9e8e8]/60 p-4">
            <h2 className="font-serif text-lg text-[#7c3b3d]">Overdue — reschedule or finish</h2>
            <ul className="mt-3 space-y-2">
              {overdue.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  projectName={projectName(t.project_id)}
                  onToggle={(done) => void muts.toggleTask(t.id, done)}
                  onReschedule={(iso) => void muts.rescheduleTask(t.id, iso)}
                />
              ))}
            </ul>
          </section>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          <SchedulePanel
            events={events}
            upcoming={upcoming}
            dueToday={dueToday}
            onToggle={(id, done) => void muts.toggleTask(id, done)}
            onReschedule={(id, iso) => void muts.rescheduleTask(id, iso)}
            projectName={projectName}
          />
          <ProjectsPanel
            projects={projects}
            openCount={(id) => tasks.filter((t) => t.project_id === id && !t.done).length}
          />
        </div>
        <div className="space-y-4">
          {TODAY_BUCKETS.map((bucket) => (
            <Section
              key={bucket.key}
              title={bucket.label}
              hint={bucket.hint}
              count={tasks.filter((t) => t.bucket === bucket.key).length}
              defaultOpen={bucket.key === 'must'}
            >
              <BucketItems
                tasks={tasks.filter((t) => t.bucket === bucket.key)}
                projectName={projectName}
                onToggle={(id, done) => void muts.toggleTask(id, done)}
                onReschedule={(id, iso) => void muts.rescheduleTask(id, iso)}
                onMoveBucket={(id, b) => void muts.moveTask(id, { bucket: b })}
              />
            </Section>
          ))}
        </div>
        <p className="pb-4 text-center text-xs text-[#8a7a65]">
          Priorities and sections reference the same task rows — completing or moving updates everywhere at once. No duplicates.
        </p>
      </div>
    )
  }

  return <TodayRender />
}

function BucketItems({ tasks, projectName, onToggle, onReschedule, onMoveBucket }: {
  tasks: Task[]
  projectName: (id: string | null) => string | undefined
  onToggle: (id: string, done: boolean) => void
  onReschedule: (id: string, iso: string) => void
  onMoveBucket: (id: string, b: TaskBucket) => void
}) {
  if (tasks.length === 0) return <li className="list-none text-sm text-[#8a7a65]">Nothing here. Calm.</li>
  return (
    <>
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          projectName={projectName(t.project_id)}
          onToggle={(done) => onToggle(t.id, done)}
          onReschedule={(iso) => onReschedule(t.id, iso)}
          extra={
            <span className="inline-flex items-center gap-1">
              <span className="text-[#b6a98f]">·</span>
              <select
                aria-label={`Move ${t.title} to bucket`}
                value={t.bucket}
                onChange={(e) => onMoveBucket(t.id, e.target.value as TaskBucket)}
                className="rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-1.5 py-0.5 text-xs text-[#5c4a3f]"
              >
                {TODAY_BUCKETS.map((b) => (
                  <option key={b.key} value={b.key}>{b.label}</option>
                ))}
              </select>
            </span>
          }
        />
      ))}
    </>
  )
}