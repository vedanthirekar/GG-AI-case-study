// Return status & progress (Challenge 06).
// A single ordered stepper drives one shared mental model. The SAME data renders
// two ways: clients see plain, reassuring language and only what concerns them;
// staff see the internal wording plus verification detail. Everyone can tell:
// where it is, what's done, what's next, who owns it, and what's blocking.
import { STAGES, stageIndex } from '../../data/catalog'
import { userById } from '../../data/db'
import { useStore } from '../../context/StoreContext'
import { Card, Tag, Icon, cx } from '../../components/ui'

export default function StatusTracker({ ret, audience = 'staff' }) {
  const { summary } = useStore()
  const live = summary(ret.id)
  const verified = live.fieldsTotal ? live.fieldsVerified : ret.fieldsVerified
  const total = live.fieldsTotal || ret.fieldsTotal
  const current = stageIndex(ret.stage)
  const owner = ownerOf(ret)

  return (
    <div className="space-y-4">
      {/* headline: where it is + who owns the next action */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">Right now</div>
            <div className="mt-0.5 text-[15px] font-bold">
              {audience === 'client' ? STAGES[current].clientLabel : STAGES[current].staffLabel}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">Waiting on</div>
            <div className={cx('mt-0.5 text-[13px] font-semibold', owner.isYou ? 'text-accent' : 'text-ink')}>{owner.label}</div>
          </div>
        </div>
        {ret.blocked && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-[12px] text-danger">
            <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
            <span><b>Blocking completion:</b> {audience === 'client' ? clientBlock(ret) : ret.blockReason}</span>
          </div>
        )}
      </Card>

      {/* the stepper */}
      <Card className="p-4" data-tour="status-stepper">
        <ol className="relative ml-1">
          {STAGES.map((s, i) => {
            const state = i < current ? 'done' : i === current ? 'current' : 'todo'
            return (
              <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
                {i < STAGES.length - 1 && (
                  <span className={cx('absolute left-[11px] top-6 h-full w-0.5', i < current ? 'bg-good' : 'bg-line')} />
                )}
                <span className={cx('z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2',
                  state === 'done' ? 'border-good bg-good-fill text-white' :
                  state === 'current' ? 'border-accent bg-accent-soft text-accent' :
                  'border-line bg-surface text-faint')}>
                  {state === 'done' ? <Icon name="check" size={13} /> : <span className="text-[11px] font-bold">{i + 1}</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cx('text-[13px] font-semibold', state === 'todo' ? 'text-faint' : 'text-ink')}>
                      {audience === 'client' ? s.clientLabel : s.staffLabel}
                    </span>
                    {state === 'current' && <Tag tone="accent">In progress</Tag>}
                  </div>
                  <div className="text-[12px] text-muted">{s.desc}</div>
                  {/* staff see verification detail; clients don't need it */}
                  {audience === 'staff' && i === current && (
                    <div className="mt-1 text-[11px] text-faint">{verified}/{total} fields verified · {ret.openItems} open item{ret.openItems === 1 ? '' : 's'}</div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </Card>
    </div>
  )
}

function ownerOf(ret) {
  // who has the ball right now
  const i = stageIndex(ret.stage)
  if (ret.blocked) return { label: `${ret.clientName} (needs info)`, isYou: false }
  if (i <= 1) return { label: ret.clientName, isYou: false }
  if (i === 3) return { label: userById(ret.reviewerId)?.name || 'Reviewer', isYou: false }
  if (i === 4) return { label: `${ret.clientName} (approval)`, isYou: false }
  if (i === 5) return { label: 'Filed — no action', isYou: false }
  return { label: userById(ret.preparerId)?.name || 'Preparer', isYou: true }
}

function clientBlock(ret) {
  // plain-language version for clients — no internal jargon
  return 'We need one more thing from you. Check your open requests in Messages.'
}
