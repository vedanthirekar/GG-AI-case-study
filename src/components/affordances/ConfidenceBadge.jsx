// Confidence display for AI values (Challenges 08 & 10). Renders a compact pill
// plus an optional meter. Confidence is bucketed so it reads consistently.
import { cx } from '../ui'

export function confidenceTone(c) {
  if (c == null) return { key: 'none', label: '-', color: '#94a3b8', tone: 'muted' }
  if (c >= 90) return { key: 'high', label: 'High confidence', color: '#16a34a', tone: 'good' }
  if (c >= 75) return { key: 'medium', label: 'Medium confidence', color: '#b45309', tone: 'warn' }
  return { key: 'low', label: 'Low confidence', color: '#dc2626', tone: 'danger' }
}

export function ConfidencePill({ value }) {
  const t = confidenceTone(value)
  if (value == null) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: t.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.color }} />
      {value}% · {t.label}
    </span>
  )
}

export function ConfidenceMeter({ value, className = '' }) {
  const t = confidenceTone(value)
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-line', className)}>
      <div className="h-full rounded-full transition-all" style={{ width: `${value ?? 0}%`, background: t.color }} />
    </div>
  )
}
