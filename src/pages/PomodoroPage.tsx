import { useState, useEffect } from 'react'
import { usePomodoro } from '../lib/usePomodoro'
import { Alert } from '../components/ui'

export default function PomodoroPage() {
  const { loading, error, setError, sessions, startSession, endSession, getStats, user } = usePomodoro()
  const [type, setType] = useState<'pomodoro' | 'break' | 'stopwatch'>('pomodoro')
  const [duration, setDuration] = useState<number>(25)
  const [running, setRunning] = useState<boolean>(false)
  const [elapsed, setElapsed] = useState<number>(0)
  const [timerId, setTimerId] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  if (loading) return <p className="py-16 text-center text-[#8a7a65]">Loading pomodoro data…</p>

  // Start/stop timer
  useEffect(() => {
    let minutes = duration
    let seconds = 0
    let isRunning = running
    
    if (isRunning && timerId === null) {
      setTimerId(window.setInterval(() => {
        setElapsed(prev => {
          const newElapsed = prev + 1
          if (newElapsed >= minutes * 60) {
            clearInterval(timerId!)
            setTimerId(null)
            setRunning(false)
            return 0
          }
          return newElapsed
        })
      }, 1000))
    } else if (!isRunning && timerId !== null) {
      clearInterval(timerId!)
      setTimerId(null)
    }

    return () => {
      if (timerId !== null) {
        clearInterval(timerId!)
      }
    }
  }, [running, duration, timerId])

  const startStop = () => {
    setRunning(prev => !prev)
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const formatDuration = () => {
    if (type === 'stopwatch') {
      return formatTime(elapsed)
    }
    return formatTime((running ? elapsed + 1 : 0))
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-3xl text-[#3e342c] mb-4">Pomodoro & Focus Timers</h1>
      
      <div className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-6 mb-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
            >
              <option value="pomodoro">Pomodoro (25min)</option>
              <option value="break">Break (5min)</option>
              <option value="stopwatch">Stopwatch</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Duration (min)</label>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              min="1"
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1"></label>
            <button
              onClick={startStop}
              className={`
                rounded-lg px-4 py-2 text-sm font-medium transition
                ${running ? 'bg-[#ef4444] text-white' : 'bg-[#3b82f6] text-white'}
                hover:${running ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'}
              `}
            >
              {running ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="font-serif text-5xl text-[#3e342c]">{formatDuration()}</p>
        </div>
      </div>

      <div>
        <h2 className="font-serif text-xl text-[#3e342c] mb-4">Sessions</h2>
        {error && <Alert kind="error">{error}</Alert>}
        {sessions.length === 0 ? (
          <p className="text-[#8a7a65]">No sessions yet. Start a timer above!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.slice(0, 12).map((session: any) => (
              <div
                key={session.id}
                className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-3"
                style={{ borderColor: session.type === 'pomodoro' ? '#3b82f5' : session.type === 'break' ? '#10b981' : '#f59e0b' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5c4a3f]">{session.type}</span>
                  <span className="text-xs text-[#8a7a65]">{session.duration_minutes}min</span>
                </div>
                <p className="text-xs text-[#8a7a65]">{new Date(session.started_at).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}