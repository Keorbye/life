import { useState, useEffect } from 'react'
import { useTimeTracking } from '../lib/useTimeTracking'
import { Alert } from '../components/ui'

export default function TimeTrackingPage() {
  const { loading, error, setError, timeEntries, trackTime, getTimeByLabel, refresh } = useTimeTracking()
  const [label, setLabel] = useState<string>('')
  const [color, setColor] = useState<string>('#3b82f6')
  const [minutes, setMinutes] = useState<number>(0)

  if (loading) return <p className="py-16 text-center text-[#8a7a65]">Loading time tracking data…</p>

  function handleTrack() {
    const res = trackTime(label, color, minutes)
    if (res.error) setError(res.error)
    else {
      setLabel('')
      setMinutes(0)
    }
  }

  function handleGetLabel(selectedLabel: string) {
    const res = getTimeByLabel(selectedLabel)
    if (res.error) setError(res.error)
    // Could display the data here
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-3xl text-[#3e342c] mb-4">Time Tracking</h1>
      
      <div className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-6 mb-8">
        <form onSubmit={e => { e.preventDefault(); handleTrack() }} className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Subject Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g., Work, Gym, Coding"
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Minutes</label>
            <input
              type="number"
              value={minutes}
              onChange={e => setMinutes(Number(e.target.value))}
              min="1"
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Color</label>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-24 rounded-lg border border-[#e7dcc8] bg-[#faf6ef] p-1"
            />
            <span className="ml-2 inline-block h-6 w-6 rounded-full" style={{ backgroundColor: color }}></span>
          </div>
          <button type="submit" className="rounded-lg bg-[#c9a24b] col-span-2 px-6 py-2.5 text-sm font-medium text-[#3e342c] hover:bg-[#e6d3a3] transition">
            Track Time
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-serif text-xl text-[#3e342c] mb-4">Time by Label</h2>
        {error && <Alert kind="error">{error}</Alert>}
        {timeEntries.length === 0 ? (
          <p className="text-[#8a7a65]">No time tracking entries yet. Track time above!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {timeEntries.slice(0, 12).map((entry: any) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-4"
                style={{ borderColor: entry.color_code }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[#3e342c]">{entry.label}</span>
                  <span className="text-xs text-[#8a7a65">{entry.minutes}m</span>
                </div>
                <p className="text-sm text-[#5c4a3f]">{entry.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}