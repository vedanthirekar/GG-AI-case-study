// The return workspace - the hub that holds a single return together
// (Challenges 04 & 06 live here at the container level).
// Tabs for Review / Documents / Status / Messages keep the user oriented; all
// selection lives in the URL (?tab / ?field / ?doc / ?thread) so everything is
// deep-linkable and the breadcrumb + Related rail always reflect where you are.
import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { returnById, userById } from '../../data/db'
import { useSession } from '../../context/SessionContext'
import { useStore } from '../../context/StoreContext'
import { useChrome } from '../../context/ChromeContext'
import { Tag, Icon, Money, cx } from '../../components/ui'
import StageChip from '../status/StageChip'
import ReturnReview from './ReturnReview'
import DocumentExplorer from '../documents/DocumentExplorer'
import Threads from '../collaboration/Threads'
import NotesBoard from '../collaboration/NotesBoard'
import StatusTracker from '../status/StatusTracker'

const TABS = [
  { key: 'review', label: 'Review', icon: 'grid' },
  { key: 'documents', label: 'Documents', icon: 'doc' },
  { key: 'status', label: 'Status', icon: 'clock' },
  { key: 'messages', label: 'Messages', icon: 'chat' },
  { key: 'notes', label: 'Notes', icon: 'note' },
]

export default function ReturnWorkspace() {
  const { rid } = useParams()
  const [params, setParams] = useSearchParams()
  const { publish } = useChrome()
  const { isFirm, caps } = useSession()
  const { summary, getNotes } = useStore()
  const ret = returnById(rid)
  const live = ret ? summary(rid) : null
  // open-note count on the tab, filtered to what this role may see
  const openNotes = ret
    ? getNotes(rid).filter((n) => !n.done && (n.visibility === 'all' || caps.seeInternalNotes)).length
    : 0

  const tab = params.get('tab') || 'review'
  const field = params.get('field')
  const doc = params.get('doc')
  const thread = params.get('thread')
  const view = params.get('view') || 'trace'
  // side-by-side already needs three columns; the Related rail would squeeze
  // them all, so it stands down and the space goes to the document.
  const split = tab === 'review' && view === 'split'

  const set = (patch) => {
    const p = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v == null ? p.delete(k) : p.set(k, v)))
    setParams(p, { replace: false })
  }

  // publish breadcrumbs + the related node for the shell's rail
  useEffect(() => {
    if (!ret) return
    const homeCrumb = caps.isClient ? { label: 'Home', to: '/home' } : { label: 'Returns', to: '/returns' }
    const crumbs = [homeCrumb, { label: ret.clientName, to: `/returns/${ret.id}` }, { label: TABS.find((t) => t.key === tab)?.label }]
    let related = { kind: 'return', id: ret.id }
    if (tab === 'review' && field) related = { kind: 'field', id: field, returnId: ret.id }
    if (tab === 'documents' && doc) related = { kind: 'document', id: doc, returnId: ret.id }
    if (tab === 'messages' && thread) related = { kind: 'thread', id: thread, returnId: ret.id }
    publish({ crumbs, related: split ? null : related })
  }, [ret, tab, field, doc, thread, split, publish, caps.isClient])

  if (!ret) return <div className="p-10 text-center text-muted">Return not found.</div>
  const audience = caps.isClient ? 'client' : 'staff'

  return (
    <div className="flex h-full flex-col">
      {/* return header */}
      <div className="shrink-0 border-b border-line bg-surface px-5 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold tracking-tight">{ret.clientName}</h1>
              {ret.personalOf && <Tag tone="accent">Your personal return</Tag>}
              {live?.blocked && <Tag tone="danger" dot>Blocked</Tag>}
            </div>
            <div className="text-[12px] text-muted">{ret.form} · Tax year {ret.year} · Preparer {userById(ret.preparerId)?.name}</div>
          </div>
          <div className="text-right">
            <StageChip stageKey={ret.stage} audience={audience} />
            {(live?.refund ?? ret.refund) != null && (() => { const r = live?.refund ?? ret.refund; return (
              <div className={cx('mt-1 text-[13px] font-semibold', r >= 0 ? 'text-good' : 'text-danger')}>{r >= 0 ? 'Refund ' : 'You owe '}<Money value={Math.abs(r)} className={r >= 0 ? 'text-good' : 'text-danger'} /></div>
            )})()}
          </div>
        </div>

        {live?.blocked && audience === 'staff' && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-[12px] text-danger">
            <Icon name="alert" size={14} /> <b>Blocked:</b> {ret.blockReason}
          </div>
        )}

        {/* tabs */}
        <div className="mt-3 flex gap-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => set({ tab: t.key })}
              className={cx('flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-body font-semibold transition',
                tab === t.key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink')}>
              <Icon name={t.icon} size={14} /> {t.label}
              {t.key === 'notes' && openNotes > 0 && (
                <span className="grid h-[17px] min-w-[17px] place-items-center rounded-full bg-warn-soft px-1 text-[10px] font-bold text-warn">{openNotes}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* tab body */}
      <div className="min-h-0 flex-1">
        {tab === 'review' && <ReturnReview ret={ret} selectedId={field} onSelect={(id) => set({ field: id })}
          view={view} onView={(v) => set({ view: v === 'trace' ? null : v })} />}
        {tab === 'documents' && <DocumentExplorer embeddedReturnId={ret.id} selectedDocId={doc} onPickDoc={(id) => set({ doc: id })} />}
        {tab === 'status' && <div className="mx-auto max-w-2xl px-5 py-6"><StatusTracker ret={ret} audience={audience} /></div>}
        {tab === 'messages' && <Threads ret={ret} selectedThreadId={thread} onSelect={(id) => set({ thread: id })} />}
        {tab === 'notes' && <NotesBoard ret={ret} />}
      </div>
    </div>
  )
}
