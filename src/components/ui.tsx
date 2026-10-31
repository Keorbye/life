import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-[#e7dcc8] bg-white/80 p-8 shadow-[0_10px_40px_-18px_rgba(92,74,63,0.45)] backdrop-blur">
      {children}
    </div>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string }

export function Field({ label, ...props }: FieldProps) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-sm font-medium text-[#5c4a3f]">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-[#ddd0b8] bg-[#faf6ef] px-3.5 py-2.5 text-[#3e342c] outline-none transition placeholder:text-[#b6a98f] focus:border-[#c9a24b] focus:ring-2 focus:ring-[#c9a24b]/30 disabled:opacity-60"
      />
    </label>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  const styles =
    variant === 'primary'
      ? 'bg-[#5c4a3f] text-[#faf6ef] hover:bg-[#3e342c] disabled:bg-[#a89a87]'
      : variant === 'danger'
        ? 'bg-[#b35555] text-white hover:bg-[#964444] disabled:bg-[#d19a9a]'
        : 'bg-transparent text-[#5c4a3f] underline-offset-4 hover:underline'
  return (
    <button
      {...props}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${styles} ${props.className ?? ''}`}
    />
  )
}

export function Alert({ kind, children }: { kind: 'error' | 'info' | 'success'; children: ReactNode }) {
  const styles =
    kind === 'error'
      ? 'border-[#d48c8e] bg-[#f9e8e8] text-[#7c3b3d]'
      : kind === 'success'
        ? 'border-[#a8b89a] bg-[#eef3e7] text-[#4c5a40]'
        : 'border-[#e6d3a3] bg-[#faf3df] text-[#6b5a2e]'
  return <div role="alert" className={`rounded-xl border px-3.5 py-2.5 text-sm ${styles}`}>{children}</div>
}

export function ProgressBar({ percent, done, total }: { percent: number; done?: number; total?: number }) {
  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1e9da]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
        <div className="h-full rounded-full bg-gradient-to-r from-[#a8b89a] to-[#7d8b6f] transition-all" style={{ width: `${percent}%` }} />
      </div>
      {(done != null && total != null) && (
        <p className="mt-1 text-xs text-[#8a7a65]">{done} of {total} tasks done · {percent}%</p>
      )}
    </div>
  )
}
