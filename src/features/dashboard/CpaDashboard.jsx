// Actionable dashboard (Challenge 07).
// Organized around "what should I work on right now?" - not reporting. A real
// ranking function (lib/prioritize) scores every open task by due date, blocking
// status, kind and return stage, then this surfaces the top of that queue.
// Supports managers (all staff) and individual preparers (their own work), and
// stays usable at volume by ranking + capping the list.
import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tasks as allTasks, returnById, userById, users, stats } from '../../data/db'
import { rankTasks, summarize, sortTasks, daysUntil, TODAY } from '../../lib/prioritize'
import { returnAiFlags } from '../../data/ai'
import { useSession } from '../../context/SessionContext'
import { useChrome } from '../../context/ChromeContext'
import { Card, Tag, Icon, Money, Avatar, EmptyState, SkeletonRows, cx } from '../../components/ui'
import useSimulatedLoad from '../../lib/useSimulatedLoad'
import { CAPS } from '../../lib/roles'

const KIND_LABEL = { review: 'Review', prep: 'Prepare', request: 'Request', question: 'Question', approval: 'Approval' }

// The greeting is the one piece of copy on this screen that should match the
// clock on the wall rather than the seeded TODAY - everything else here (due
// dates, "today's" date in the header) is pinned to 2026-07-24 so the mock
// data stays internally consistent, but "good afternoon" at 11pm reads as
// broken in a way that matters more than the demo dataset does.
function timeGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Working late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Working late'
}

// Who gets a scope toggle at all. A reviewer signs off other people's work and
// an administrator runs the practice - neither has a personal queue worth
// separating out, so the control would be a switch with one useful position.
// A preparer genuinely moves between their own desk and the firm's.
const scopeToggleFor = (role) => role === 'preparer'

export default function CpaDashboard() {
  const { user, activeRole, caps } = useSession()
  const { publish } = useChrome()
  const hasToggle = scopeToggleFor(activeRole)
  // Preparers land on their own work; reviewers and admins are firm-wide by
  // definition; seasonal staff only ever see what they're assigned.
  const [scope, setScope] = useState(
    hasToggle ? 'mine' : (caps.seeAllReturns ? 'all' : 'mine'))
  const [kind, setKind] = useState('')
  const [severity, setSeverity] = useState('')
  const [sort, setSort] = useState('priority')
  const [onlyBlocked, setOnlyBlocked] = useState(false)
  const [assignee, setAssignee] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => { publish({ crumbs: [{ label: 'Dashboard' }] }) }, [publish])

  const firmStaff = users.filter((u) => !CAPS[u.primary]?.isClient)

  const ranked = useMemo(() => {
    let base = rankTasks(allTasks, {
      assigneeId: scope === 'mine' ? user.id : (assignee || undefined),
      kind: kind || undefined,
      onlyBlocked,
    })
    if (severity) base = base.filter((t) => t.band.key === severity)
    // "Which of my clients is on fire?" is a real question, and scrolling a
    // ranked list is the wrong way to answer it.
    const term = q.trim().toLowerCase()
    if (term) base = base.filter((t) => (returnById(t.returnId)?.clientName || '').toLowerCase().includes(term))
    return sortTasks(base, sort)
  }, [scope, user.id, assignee, kind, onlyBlocked, severity, sort, q])

  const counters = useMemo(() => summarize(
    scope === 'mine' ? allTasks.filter((t) => t.assigneeId === user.id) : (assignee ? allTasks.filter((t) => t.assigneeId === assignee) : allTasks)
  ), [scope, user.id, assignee])

  // A date and the nearest deadline: two facts a preparer actually wants on
  // arrival, in place of a sentence about how good the ranking is.
  const today = TODAY.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
  const nextDeadline = useMemo(() => {
    const mine = scope === 'mine' ? allTasks.filter((t) => t.assigneeId === user.id) : allTasks
    const open = mine.filter((t) => t.status === 'open').map((t) => daysUntil(t.due))
    if (!open.length) return 'nothing outstanding'
    const soonest = Math.min(...open)
    const overdue = open.filter((d) => d < 0).length
    if (overdue) return `${overdue} item${overdue === 1 ? '' : 's'} past due`
    return soonest === 0 ? 'a deadline today' : `next deadline in ${soonest} day${soonest === 1 ? '' : 's'}`
  }, [scope, user.id])

  const shown = ranked.slice(0, 40)
  const loading = useSimulatedLoad([scope, kind, onlyBlocked, assignee, severity, sort, q])

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-accent">Dashboard</div>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight">{timeGreeting()}, {user.name.split(' ')[0]}</h1>
          <p className="text-[13px] text-muted">{today} · {nextDeadline}</p>
        </div>
        {hasToggle && (
          <div className="flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-semibold">
            <button onClick={() => setScope('mine')} className={cx('rounded-md px-3 py-1.5', scope === 'mine' ? 'bg-accent-soft text-accent' : 'text-muted')}>Assigned to me</button>
            <button onClick={() => setScope('all')} className={cx('rounded-md px-3 py-1.5', scope === 'all' ? 'bg-accent-soft text-accent' : 'text-muted')}>All staff</button>
          </div>
        )}
      </div>

      {/* Counters lead with the size of the job, then the three things that
          make an item jump the queue. */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Counter label="Open items" value={counters.total} tone="muted" icon="grid" />
        <Counter label="Overdue" value={counters.overdue} tone="danger" icon="clock" />
        <Counter label="Due today" value={counters.dueToday} tone="warn" icon="clock" />
        <Counter label="Blocked" value={counters.blocked} tone="accent" icon="lock" />
      </div>

      {/* filters - sorting lives in the column headers below, not here */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[190px] flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5">
          <Icon name="search" size={14} className="shrink-0 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a client…"
            className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-faint" />
          {q && <button onClick={() => setQ('')} className="shrink-0 text-faint hover:text-ink"><Icon name="x" size={13} /></button>}
        </div>
        <Select value={kind} onChange={setKind} options={[['', 'All work'], ['review', 'Review'], ['prep', 'Prepare'], ['request', 'Requests'], ['question', 'Questions'], ['approval', 'Approvals']]} />
        <Select value={severity} onChange={setSeverity} options={[['', 'All severities'], ['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]} />
        {scope === 'all' && (
          <Select value={assignee} onChange={setAssignee} options={[['', 'Anyone'], ...firmStaff.map((u) => [u.id, u.name])]} />
        )}
        <button onClick={() => setOnlyBlocked((b) => !b)}
          className={cx('rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold', onlyBlocked ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted')}>
          Blocked only
        </button>
      </div>

      {/* the queue, as a ledger: aligned columns, and the sort visible in the
          header it belongs to rather than hidden in a dropdown */}
      <Card data-tour="dash-queue" className="mt-3 overflow-hidden">
        <div className={cx('flex items-center gap-3 border-b border-line bg-bgtint/50 px-4 py-2',
          'text-[10.5px] font-bold uppercase tracking-wider text-faint')}>
          <SortHead className="min-w-0 flex-1" label="Work" mode="priority" sort={sort} onSort={setSort} title="Rank by urgency, blockers, due date and stage" />
          <span className="hidden w-[130px] shrink-0 md:block">Client</span>
          {scope === 'all' && <span className="hidden w-[30px] shrink-0 lg:block" aria-label="Owner" />}
          <SortHead className="w-[74px] shrink-0" label="Severity" mode="severity" sort={sort} onSort={setSort} />
          <SortHead className="w-[76px] shrink-0 text-right" label="Due" mode="due" sort={sort} onSort={setSort} align="right" />
          <span className="w-4 shrink-0" />
        </div>

        {loading ? (
          <div className="p-3"><SkeletonRows rows={6} /></div>
        ) : ranked.length === 0 ? (
          <EmptyState icon="check-double" title="Nothing in this queue"
            body={q
              ? `No open work for a client matching “${q}”. Clear the search or widen the filters.`
              : "Everything matching these filters is handled. Widen the filters to see more of the firm's work."} />
        ) : (
          <div className="divide-y divide-line2">
            {shown.map((t) => <TaskRow key={t.id} task={t} showAssignee={scope === 'all'} />)}
          </div>
        )}
      </Card>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-faint">
        <span>
          {sort === 'priority' ? `Ranked by urgency, blockers, due date and stage - across ${stats.tasks} tasks · ${stats.returns} returns.`
            : sort === 'due' ? 'Ordered by due date, soonest first. Overdue work leads.'
              : 'Ordered by severity, most severe first.'}
        </span>
        {!loading && ranked.length > shown.length &&
          <span>Showing top {shown.length} of {ranked.length}.</span>}
      </div>
    </div>
  )
}

// A column header that also is the sort control. Clicking it selects that
// ordering; the arrow marks which one is live, so "why is this row first?" is
// answerable from the table itself.
function SortHead({ label, mode, sort, onSort, className = '', align, title }) {
  const active = sort === mode
  return (
    <button onClick={() => onSort(mode)} title={title || `Sort by ${label.toLowerCase()}`}
      aria-pressed={active}
      className={cx('flex items-center gap-1 uppercase tracking-wider transition hover:text-ink',
        align === 'right' && 'justify-end', active && 'text-accent', className)}>
      {label}
      {active && <Icon name="chevron-down" size={11} />}
    </button>
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

// The actual calendar date, not just "3d overdue" - a relative gap alone can't
// be checked against anything, which was the traceability complaint.
function dueParts(task) {
  const d = new Date(task.due)
  const date = Number.isNaN(d.getTime())
    ? task.due
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const rel = task.dLeft < 0 ? `${-task.dLeft}d over` : task.dLeft === 0 ? 'today' : `in ${task.dLeft}d`
  const tone = task.dLeft < 0 ? 'text-danger' : task.dLeft === 0 ? 'text-warn' : 'text-faint'
  return { date, rel, tone }
}

function TaskRow({ task, showAssignee }) {
  const ret = returnById(task.returnId)
  const assignee = userById(task.assigneeId)
  const flags = ret ? returnAiFlags(ret) : []
  const { date, rel, tone } = dueParts(task)

  return (
    <Link to={`/returns/${task.returnId}?tab=review`}
      className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-slateSoft">
      {/* WORK */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-semibold text-ink">{task.title}</span>
          {task.blocked && <Tag tone="danger" dot>Blocked</Tag>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-muted">
          {/* the client repeats here only where its own column is hidden */}
          <span className="font-medium text-ink/70 md:hidden">{ret?.clientName} ·</span>
          <span>{ret?.form}</span>
          <span>· {KIND_LABEL[task.kind]}</span>
          {flags.length > 0 && (
            <span className="text-ai">· <Icon name="sparkle" size={10} className="inline" /> {flags.length} AI</span>
          )}
        </div>
      </div>

      {/* CLIENT */}
      <div className="hidden w-[130px] shrink-0 truncate text-[12.5px] font-medium text-ink/80 md:block">
        {ret?.clientName}
      </div>

      {/* OWNER */}
      {showAssignee && (
        <div className="hidden w-[30px] shrink-0 lg:block" title={assignee?.name}>
          <Avatar user={assignee} size={24} />
        </div>
      )}

      {/* SEVERITY */}
      <div className="w-[74px] shrink-0"><Tag tone={task.band.tone}>{task.band.label}</Tag></div>

      {/* DUE */}
      <div className="w-[76px] shrink-0 text-right">
        <div className="tnum text-[12.5px] font-semibold text-ink">{date}</div>
        <div className={cx('tnum text-[11px] font-medium', tone)}>{rel}</div>
      </div>

      <Icon name="chevron" size={15} className="w-4 shrink-0 text-faint" />
    </Link>
  )
}
