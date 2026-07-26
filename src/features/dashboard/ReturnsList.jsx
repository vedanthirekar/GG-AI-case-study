// Firm-wide list of returns with shared-vocabulary status (Challenges 06 & 09).
// Searchable / filterable so it scales; each row is the entry point to a return.
import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { returns } from '../../data/db'
import { STAGES, stageIndex } from '../../data/catalog'
import { useChrome } from '../../context/ChromeContext'
import { useSession } from '../../context/SessionContext'
import { Card, Tag, Icon, Money, cx } from '../../components/ui'
import StageChip from '../status/StageChip'

export default function ReturnsList() {
  const { publish } = useChrome()
  const { user, caps } = useSession()
  const [q, setQ] = useState('')
  const [stage, setStage] = useState('')
  useEffect(() => { publish({ crumbs: [{ label: 'Returns' }] }) }, [publish])

  // seasonal staff only see returns assigned to them
  const base = caps.seeAllReturns ? returns : returns.filter((r) => r.preparerId === user.id)

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return base
      .filter((r) => (stage ? r.stage === stage : true))
      .filter((r) => (term ? r.clientName.toLowerCase().includes(term) || r.form.toLowerCase().includes(term) : true))
      .sort((a, b) => new Date(a.due) - new Date(b.due))
  }, [q, stage, base])

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-accent">Returns</div>
      <h1 className="mt-0.5 text-xl font-bold tracking-tight">{caps.seeAllReturns ? 'All returns' : 'My assigned returns'}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
          <Icon name="search" size={15} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" className="bg-transparent text-[13px] outline-none" />
        </div>
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="rounded-lg border border-line bg-surface px-2.5 py-2 text-[12px] font-semibold outline-none focus:border-accent">
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.staffLabel}</option>)}
        </select>
        <span className="ml-auto text-[12px] text-faint">{rows.length} returns</span>
      </div>

      <Card className="mt-3 divide-y divide-line2 overflow-hidden">
        {rows.map((r) => (
          <Link key={r.id} to={`/returns/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slateSoft">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-semibold">{r.clientName}</span>
                {r.blocked && <Tag tone="danger" dot>Blocked</Tag>}
                {r.isNewClient && <Tag tone="accent">New</Tag>}
              </div>
              <div className="text-[12px] text-muted">{r.form} · {r.year} · {r.fieldsVerified}/{r.fieldsTotal} fields verified</div>
            </div>
            <StageChip stageKey={r.stage} audience="staff" />
            <div className="w-24 text-right">
              {r.refund != null && <div className={cx('text-[13px] font-semibold tnum', r.refund >= 0 ? 'text-good' : 'text-danger')}>{r.refund >= 0 ? 'Refund ' : 'Owe '}<Money value={Math.abs(r.refund)} className={r.refund >= 0 ? 'text-good' : 'text-danger'} /></div>}
              <div className="text-[11px] text-faint">due {r.due.slice(5)}</div>
            </div>
            <Icon name="chevron" size={16} className="text-faint" />
          </Link>
        ))}
      </Card>
    </div>
  )
}
