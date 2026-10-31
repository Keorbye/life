import { useState, useEffect } from 'react'
import { useMood } from '../lib/useMood'
import { TODAY_BUCKETS } from '../lib/types'
import { Alert } from '../components/ui'

export default function MoodPage() {
  const { loading, error, setError, moodEntries, logMood, refresh } = useMood()
  const [mood, setMood] = useState<'excellent' | 'good' | 'neutral' | 'poor' | 'terrible'>('neutral')
  const [stress, setStress] = useState<number>(5)
  const [energy, setEnergy] = useState<number>(5)
  const [notes, setNotes] = useState<string>('')

  if (loading) return <p className="py-16 text-center text-[#8a7a65]">Loading mood data…</p>

  function handleSubmit() {
    const res = logMood(mood, stress, energy, notes)
    if (res.error) setError(res.error)
    else {
      setMood('neutral')
      setStress(5)
      setEnergy(5)
      setNotes('')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-3xl text-[#3e342c] mb-4">Mood & Wellbeing</h1>
      <div className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-6 mb-8">
        <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#5c4a3f] mb-1">Mood</label>
              <select
                value={mood}
                onChange={e => setMood(e.target.value as any)}
                className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="neutral">Neutral</option>
                <option value="poor">Poor</option>
                <option value="terrible">Terrible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#5c4a3f] mb-1">Stress Level (0-10)</label>
              <input
                type="number"
                value={stress}
                onChange={e => setStress(Number(e.target.value))}
                min="0" max="10"
                className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Energy Level (1-10)</label>
            <input
              type="number"
              value={energy}
              onChange={e => setEnergy(Number(e.target.value))}
              min="1" max="10"
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c] resize-none"
            ></textarea>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[#c9a24b] px-6 py-2.5 text-sm font-medium text-[#3e342c] hover:bg-[#e6d3a3] transition"
          >
            Log Mood
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-serif text-xl text-[#3e342c] mb-4">Recent Entries</h2>
        {error && <Alert kind="error">{error}</Alert>}
        {moodEntries.length === 0 ? (
          <p className="text-[#8a7a65]">No mood entries yet. Log your first mood above!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moodEntries.slice(0, 10).entry.map((entry: any) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{entry.mood}</span>
                  <span className="bg-[#e5e7eb] rounded-full px-2 py-1 text-xs font-medium text-[#3e342c]">#{entry.stress_level}</span>
                </div>
                <p className="text-sm text-[#5c4a3f]">{entry.notes || ''}</p>
                <p className="text-xs text-[#8a7a65]">{entry.entry_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}