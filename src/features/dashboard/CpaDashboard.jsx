// Actionable dashboard (Challenge 07).
// Organized around "what should I work on right now?" — not reporting. A real
// ranking function (lib/prioritize) scores every open task by due date, blocking
// status, kind and return stage, then this surfaces the top of that queue.
// Supports managers (all staff) and individual preparers (their own work), and
// stays usable at volume by ranking + capping the list.
import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tasks as allTasks, returnById, userById, users, stats } from '../../data/db'
import { rankTasks, summarize } from '../../lib/prioritize'
import { returnAiFlags } from '../../data/ai'
import { useSession } from '../../context/SessionContext'
import { useChrome } from '../../context/ChromeContext'
import { Card, Tag, Icon, Money, Avatar, EmptyState, SkeletonRows, cx } from '../../components/ui'
import useSimulatedLoad from '../../lib/useSimulatedLoad'
import { CAPS } from '../../lib/roles'

const KIND_LABEL = { review: 'Review', prep: 'Prepare', request: 'Request', question: 'Question', approval: 'Approval' }

export default function CpaDashboard() {
  const { user, activeRole, caps } = useSession()
  const { publish } = useChrome()
  const isManager = caps.seeAllReturns
  const [scope, setScope] = useState(isManager ? 'all' : 'mine')
  const [kind, setKind] = useState('')
  const [onlyBlocked, setOnlyBlocked] = useState(false)
  const [assignee, setAssignee] = useState('')

  useEffect(() => { publish({ crumbs: [{ label: 'Dashboard' }] }) }, [publish])

  const firmStaff = users.filter((u) => !CAPS[u.primary]?.isClient)

  const ranked = useMemo(() => {
    return rankTasks(allTasks, {
      assigneeId: scope === 'mine' ? user.id : (assignee || undefined),
      kind: kind || undefined,
      onlyBlocked,
    })
  }, [scope, user.id, assignee, kind, onlyBlocked])

  const counters = useMemo(() => summarize(
    scope === 'mine' ? allTasks.filter((t) => t.assigneeId === user.id) : (assignee ? allTasks.filter((t) => t.assigneeId === assignee) : allTasks)
  ), [scope, user.id, assignee])

  const shown = ranked.slice(0, 40)
  const loading = useSimulatedLoad([scope, kind, onlyBlocked, assignee])

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-accent">Dashboard</div>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight">Good afternoon, {user.name.split(' ')[0]}</h1>
          <p className="text-[13px] text-muted">Here’s what needs you first — ranked, not just listed.</p>
        </div>
        {/* manager vs preparer */}
        <div className="flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-semibold">
          <button onClick={() => setScope('mine')} className={cx('rounded-md px-3 py-1.5', scope === 'mine' ? 'bg-accent-soft text-accent' : 'text-muted')}>My work</button>
          {isManager && <button onClick={() => setScope('all')} className={cx('rounded-md px-3 py-1.5', scope === 'all' ? 'bg-accent-soft text-accent' : 'text-muted')}>Whole firm</button>}
        </div>
      </div>

      {/* counters */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Counter label="Overdue" value={counters.overdue} tone="danger" icon="clock" />
        <Counter label="Due today" value={counters.dueToday} tone="warn" icon="clock" />
        <Counter label="Blocked" value={counters.blocked} tone="accent" icon="lock" />
        <Counter label="Open items" value={counters.total} tone="muted" icon="grid" />
      </div>

      {/* filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold text-muted"><Icon name="filter" size={13} className="mr-1 inline" />Filter</span>
        <Select value={kind} onChange={setKind} options={[['', 'All work'], ['review', 'Review'], ['prep', 'Prepare'], ['request', 'Requests'], ['question', 'Questions'], ['approval', 'Approvals']]} />
        {scope === 'all' && (
          <Select value={assignee} onChange={setAssignee} options={[['', 'Anyone'], ...firmStaff.map((u) => [u.id, u.name])]} />
        )}
        <button onClick={() => setOnlyBlocked((b) => !b)}
          className={cx('rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold', onlyBlocked ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted')}>
          Blocked only
        </button>
        <span className="ml-auto text-[12px] text-faint">Ranked across {stats.tasks} tasks · {stats.returns} returns</span>
      </div>

      {/* the queue */}
      <div data-tour="dash-queue" className="mt-3 space-y-2">
        {loading ? <SkeletonRows rows={6} /> : shown.map((t) => <TaskRow key={t.id} task={t} showAssignee={scope === 'all'} />)}
        {!loading && ranked.length === 0 && (
          <Card>
            <EmptyState icon="check-double" title="Nothing in this queue"
              body="Everything matching these filters is handled. Widen the filters to see more of the firm's work." />
          </Card>
        )}
        {!loading && ranked.length > shown.length && (
          <div className="pt-1 text-center text-[12px] text-faint">Showing top {shown.length} of {ranked.length} — refine filters to see more.</div>
        )}
      </div>
    </div>
  )
}

function Counter({ label, value, tone, icon }) {
  const tones = { danger: 'text-danger', warn: 'text-warn', accent: 'text-accent', muted: 'text-muted' }
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
        <Icon name={icon} size={12} /> {label}
      </div>
      <div className={cx('mt-1 text-2xl font-bold tnum', tones[tone])}>{value}</div>
    </Card>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-ink outline-none focus:border-accent">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

function TaskRow({ task, showAssignee }) {
  const ret = returnById(task.returnId)
  const assignee = userById(task.assigneeId)
  const flags = ret ? returnAiFlags(ret) : []
  const dueText = task.dLeft < 0 ? `${-task.dLeft}d overdue` : task.dLeft === 0 ? 'Due today' : `Due in ${task.dLeft}d`
  return (
    <Link to={`/returns/${task.returnId}?tab=review`}
      className="group flex items-center gap-3 rounded-xl2 border border-line bg-surface px-4 py-3 shadow-soft hover:border-accent/40">
      <span className={cx('w-1.5 self-stretch rounded-full', task.band.tone === 'danger' ? 'bg-danger' : task.band.tone === 'warn' ? 'bg-warn' : task.band.tone === 'accent' ? 'bg-accent' : 'bg-line')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-ink">{task.title}</span>
          {task.blocked && <Tag tone="danger" dot>Blocked</Tag>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted">
          <span className="font-medium text-ink/70">{ret?.clientName}</span>
          <span>· {ret?.form}</span>
          <span>· {KIND_LABEL[task.kind]}</span>
          {flags.length > 0 && <span className="text-ai">· <Icon name="sparkle" size={11} className="inline" /> {flags.length} AI flag{flags.length > 1 ? 's' : ''}</span>}
        </div>
      </div>
      {showAssignee && <span title={assignee?.name}><Avatar user={assignee} size={26} /></span>}
      <div className="text-right">
        <Tag tone={task.band.tone}>{task.band.label}</Tag>
        <div className={cx('mt-1 text-[11px] font-medium tnum', task.dLeft < 0 ? 'text-danger' : task.dLeft === 0 ? 'text-warn' : 'text-faint')}>{dueText}</div>
      </div>
      <Icon name="chevron" size={16} className="text-faint" />
    </Link>
  )
}
