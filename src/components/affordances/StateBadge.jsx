// The affordance vocabulary (Challenge 08). ONE component renders the state of
// any value — AI-generated, verified, needs-review, editable, locked, read-only —
// so the same visual language appears identically on every screen.
import { FIELD_STATES } from '../../data/catalog'
import { Tag, Tooltip, Icon } from '../ui'

const TONE = { ai: 'ai', verified: 'good', review: 'warn', editable: 'accent', locked: 'muted', readonly: 'muted' }
const ICON = { ai: 'sparkle', verified: 'check', review: 'alert', editable: 'edit', locked: 'lock', readonly: 'lock' }

export default function StateBadge({ state, withIcon = true, confidence }) {
  const meta = FIELD_STATES[state] || FIELD_STATES.editable
  return (
    <Tooltip label={meta.desc}>
      <Tag tone={TONE[state]} className="cursor-help">
        {withIcon && <Icon name={ICON[state]} size={11} />}
        {meta.short}
        {state === 'ai' && confidence != null && <span className="opacity-70">· {confidence}%</span>}
      </Tag>
    </Tooltip>
  )
}

// Legend that explains the whole system in one place — surfaced in the app so
// the vocabulary is learnable, not guessed at.
export function AffordanceLegend() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.values(FIELD_STATES).map((s) => (
        <div key={s.key} className="flex items-start gap-3 rounded-lg border border-line2 bg-surface p-3">
          <StateBadge state={s.key} confidence={s.key === 'ai' ? 96 : undefined} />
          <div className="text-[12px] leading-snug">
            <div className="font-semibold text-ink">{s.label}</div>
            <div className="text-muted">{s.desc}</div>
            <div className="mt-1 flex gap-2 text-[11px] text-faint">
              <span>{s.editable ? '✎ editable' : '🔒 not editable'}</span>
              {s.approvable && <span>· needs approval</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
