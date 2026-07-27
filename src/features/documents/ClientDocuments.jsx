// Complexity made navigable (Challenge 09) - the firm-side entry point.
//
// Three hundred–odd documents in one flat list is technically searchable and
// practically unusable: nobody thinks "find me a 1099-B", they think "what's
// outstanding for the Rivera file". So the library opens by *client*, and a
// client row carries the only three things that decide whether you open it -
// where the return is, how much is on file, and whether anything is still owed.
//
// Search stays global. Typing switches this pane to flat firm-wide results, so
// looking up one document by name is still a single step rather than a hunt
// through the folder you happen to have guessed.
import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { returns, documents, tasks as allTasks, threadsForReturn, docsForReturn, userById, returnById } from '../../data/db'
import { DOC_STATUS } from '../../data/catalog'
import { useSession } from '../../context/SessionContext'
import { useStore } from '../../context/StoreContext'
import { useChrome } from '../../context/ChromeContext'
import StageChip from '../status/StageChip'
import PageHeader from '../../components/shell/PageHeader'
import { Card, Tag, Icon, Btn, Avatar, EmptyState, SkeletonRows, cx } from '../../components/ui'
import useSimulatedLoad from '../../lib/useSimulatedLoad'

export default function ClientDocuments() {
  const { userId, caps } = useSession()
  const { isFulfilled } = useStore()
  const { publish } = useChrome()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  useEffect(() => { publish({ crumbs: [{ label: 'Client Docs' }] }) }, [publish])

  // "Mine" means a file I'm actually on: preparing it, reviewing it, or holding
  // a task against it. A reviewer's clients are the ones they sign off, which
  // is why this can't just test preparerId.
  const isMine = useCallback((r) =>
    r.preparerId === userId || r.reviewerId === userId ||
    allTasks.some((t) => t.returnId === r.id && t.assigneeId === userId), [userId])

  // Seasonal staff see only what they're assigned - the same rule the rest of
  // the product enforces, not a separate one invented here.
  const permitted = useMemo(() =>
    returns.filter((r) => caps.seeAllReturns || isMine(r)), [caps.seeAllReturns, isMine])

  const mineCount = useMemo(() => permitted.filter(isMine).length, [permitted, isMine])

  // An administrator has no clients of their own, so offering them "My clients"
  // would be a toggle with one empty side.
  const hasToggle = caps.seeAllReturns && mineCount > 0
  const [scope, setScope] = useState('mine')
  const effectiveScope = hasToggle ? scope : (caps.seeAllReturns ? 'all' : 'mine')

  const visible = useMemo(() =>
    effectiveScope === 'mine' ? permitted.filter(isMine) : permitted,
    [effectiveScope, permitted, isMine])

  const rows = useMemo(() => visible.map((r) => {
    const docs = docsForReturn(r.id)
    const outstanding = threadsForReturn(r.id)
      .filter((t) => t.request && !t.request.fulfilled && !isFulfilled(t.id)).length
    return {
      ret: r,
      docs: docs.length,
      needsReview: docs.filter((d) => d.status === 'needs-review').length,
      requested: docs.filter((d) => d.status === 'requested').length,
      outstanding,
      preparer: userById(r.preparerId),
    }
  }).sort((a, b) =>
    // Anything owed floats up; then whoever has documents waiting to be looked at.
    (b.outstanding + b.requested) - (a.outstanding + a.requested) ||
    b.needsReview - a.needsReview ||
    a.ret.clientName.localeCompare(b.ret.clientName)
  ), [visible, isFulfilled])

  // Search deliberately ignores the My/All toggle and runs over everything this
  // person is permitted to see. Looking up a document by name is exactly the
  // case where you don't know whose file it's in - narrowing it to "mine" would
  // make the search worse at the one job it has.
  const hits = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return null
    const ids = new Set(permitted.map((r) => r.id))
    return documents
      .filter((d) => ids.has(d.returnId))
      .filter((d) => (d.name + d.type + d.issuer).toLowerCase().includes(term))
      .slice(0, 60)
  }, [q, permitted])

  const loading = useSimulatedLoad([q, effectiveScope])

  return (
    <div className="mx-auto max-w-4xl px-5 py-6">
      <PageHeader eyebrow="Client Docs" icon="users" title="Client files"
        subtitle="Open a client to see everything on their file. Search reaches across every document you can see."
        actions={hasToggle ? (
          <div className="flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-semibold">
            <button onClick={() => setScope('mine')}
              className={cx('rounded-md px-3 py-1.5', scope === 'mine' ? 'bg-accent-soft text-accent' : 'text-muted')}>
              My clients
            </button>
            <button onClick={() => setScope('all')}
              className={cx('rounded-md px-3 py-1.5', scope === 'all' ? 'bg-accent-soft text-accent' : 'text-muted')}>
              All clients
            </button>
          </div>
        ) : null} />

      <div data-tour="doc-search" className="mt-5 flex items-center gap-2 rounded-xl2 border border-line bg-surface px-3 py-2.5">
        <Icon name="search" size={16} className="shrink-0 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search every document - name, form type, issuer…"
          className="w-full bg-transparent text-lead outline-none placeholder:text-faint" />
        {q && <button onClick={() => setQ('')} className="shrink-0 text-faint hover:text-ink"><Icon name="x" size={15} /></button>}
      </div>

      {loading ? (
        <SkeletonRows rows={6} className="mt-4" />
      ) : hits ? (
        <SearchResults hits={hits} q={q} onClear={() => setQ('')} onPick={(d) => navigate(`/documents/${d.returnId}?doc=${d.id}`)} />
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between text-micro font-bold uppercase tracking-wider text-faint">
            <span>
              {rows.length} {effectiveScope === 'mine' ? 'of your clients' : `client${rows.length === 1 ? '' : 's'}`}
            </span>
            <span>Anything outstanding first</span>
          </div>
          <div className="mt-2 space-y-2">
            {rows.map((r) => <ClientRow key={r.ret.id} row={r} />)}
          </div>
          {rows.length === 0 && (
            <Card className="mt-2">
              <EmptyState icon="folder"
                title={effectiveScope === 'mine' ? 'No clients on your desk' : 'No client files'}
                body={effectiveScope === 'mine'
                  ? 'Nothing is assigned to you right now. Switch to All clients to see the rest of the practice.'
                  : 'You have no returns assigned to you yet.'}
                action={effectiveScope === 'mine'
                  ? <Btn variant="default" onClick={() => setScope('all')}>Show all clients</Btn>
                  : undefined} />
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function ClientRow({ row }) {
  const { ret, docs, needsReview, requested, outstanding, preparer } = row
  const owed = outstanding + requested
  return (
    <Link to={`/documents/${ret.id}`}>
      <Card hover className="flex items-center gap-3 px-4 py-3">
        <span className={cx('w-1 self-stretch rounded-full', owed ? 'bg-warn' : needsReview ? 'bg-accent' : 'bg-line')} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-lead font-semibold text-ink">{ret.clientName}</span>
            <StageChip stageKey={ret.stage} />
            {owed > 0 && <Tag tone="warn" dot>{owed} outstanding</Tag>}
            {needsReview > 0 && <Tag tone="accent">{needsReview} to review</Tag>}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-meta text-muted">
            <span>{ret.form} · {ret.year}</span>
            <span>· <span className="tnum font-medium text-ink/70">{docs}</span> document{docs === 1 ? '' : 's'}</span>
            {preparer && <span>· {preparer.name}</span>}
          </div>
        </div>
        {preparer && <span title={preparer.name}><Avatar user={preparer} size={26} /></span>}
        <Icon name="chevron" size={16} className="shrink-0 text-faint" />
      </Card>
    </Link>
  )
}

function SearchResults({ hits, q, onClear, onPick }) {
  if (hits.length === 0) {
    return (
      <Card className="mt-4">
        <EmptyState icon="search" title="No documents match"
          body={`Nothing matching “${q}” in any file you can see.`} />
      </Card>
    )
  }
  return (
    <>
      <div className="mt-4 flex items-center justify-between text-micro font-bold uppercase tracking-wider text-faint">
        <span>{hits.length} document{hits.length === 1 ? '' : 's'} matching “{q}”</span>
        <button onClick={onClear} className="normal-case tracking-normal text-accent hover:underline">Back to clients</button>
      </div>
      <Card className="mt-2 divide-y divide-line2 overflow-hidden">
        {hits.map((d) => {
          const st = DOC_STATUS[d.status]
          return (
            <button key={d.id} onClick={() => onPick(d)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slateSoft">
              <Icon name="doc" size={15} className="shrink-0 text-faint" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium">{d.name}</span>
                <span className="block truncate text-meta text-muted">{returnById(d.returnId)?.clientName} · {d.type}{d.issuer && d.issuer !== '-' ? ` · ${d.issuer}` : ''}</span>
              </span>
              <Tag tone={st?.tone || 'muted'}>{st?.label}</Tag>
              <Icon name="chevron" size={14} className="shrink-0 text-faint" />
            </button>
          )
        })}
      </Card>
    </>
  )
}
