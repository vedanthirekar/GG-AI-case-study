// Complexity made navigable (Challenge 09).
// Runs against the full generated corpus (hundreds of documents) to prove the
// pattern at real volume: search, multi-facet filtering, a collapsible category
// hierarchy (progressive disclosure), a compact summary list, and a detail view
// that keeps the list context beside it. Also reused as a return's Documents tab.
import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { documents, returnById, docsForReturn } from '../../data/db'
import { DOC_CATEGORIES, DOC_STATUS } from '../../data/catalog'
import { useSession } from '../../context/SessionContext'
import { useStore } from '../../context/StoreContext'
import { useChrome } from '../../context/ChromeContext'
import SourceDocViewer from '../return/SourceDocViewer'
import RelatedObjectsPanel from '../../components/shell/RelatedObjectsPanel'
import IngestDocument from './IngestDocument'
import { Card, Tag, Icon, Btn, EmptyState, Skeleton, InfoTip, cx } from '../../components/ui'
import { CLIENT_TIPS } from '../../data/help'
import useSimulatedLoad from '../../lib/useSimulatedLoad'

export default function DocumentExplorer({ scope, embeddedReturnId, returnId, onPickDoc, selectedDocId }) {
  const { userId, caps } = useSession()
  const { getExtraDocs } = useStore()
  const { publish } = useChrome()
  const embedded = !!embeddedReturnId
  const [ingesting, setIngesting] = useState(false)
  const extra = embedded ? getExtraDocs(embeddedReturnId) : []

  // choose the corpus: a single return (embedded), one client's file (reached
  // from the client list), a client's own docs, or firm-wide
  const corpus = useMemo(() => {
    if (embedded) return [...docsForReturn(embeddedReturnId), ...extra]
    if (returnId) return [...docsForReturn(returnId), ...getExtraDocs(returnId)]
    if (scope === 'client' || caps.isClient) {
      return documents.filter((d) => returnById(d.returnId)?.clientId === userId)
    }
    return documents
  }, [embedded, embeddedReturnId, returnId, scope, caps.isClient, userId, extra, getExtraDocs])

  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [status, setStatus] = useState('')
  const [openCats, setOpenCats] = useState(() => new Set(DOC_CATEGORIES))
  const [localSel, setLocalSel] = useState(null)
  const selId = selectedDocId ?? localSel

  useEffect(() => {
    if (embedded) return
    if (returnId) {
      // Reached from the client list - the breadcrumb has to lead back to it.
      publish({ crumbs: [{ label: 'Clients', to: '/documents' }, { label: returnById(returnId)?.clientName || 'Client' }] })
      return
    }
    publish({ crumbs: [{ label: caps.isClient ? 'My documents' : 'Clients' }] })
  }, [publish, embedded, returnId, caps.isClient])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return corpus.filter((d) =>
      (cat ? d.category === cat : true) &&
      (status ? d.status === status : true) &&
      (term ? (d.name + d.type + d.issuer).toLowerCase().includes(term) : true))
  }, [corpus, q, cat, status])

  const byCat = useMemo(() => {
    const m = {}
    for (const d of filtered) (m[d.category] ||= []).push(d)
    return m
  }, [filtered])

  const selected = filtered.find((d) => d.id === selId) || filtered[0]
  const loading = useSimulatedLoad([q, cat, status, embeddedReturnId])
  const pick = (id) => { onPickDoc ? onPickDoc(id) : setLocalSel(id) }

  return (
    <div className={cx('grid h-full', 'grid-cols-1 lg:grid-cols-[minmax(320px,420px)_1fr]')}>
      {/* list + facets */}
      <div className="pane flex flex-col overflow-hidden border-r border-line bg-surface">
        <div className="border-b border-line2 p-4">
          {!embedded && <>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">
              {returnId ? 'Client file' : 'Documents'}
            </div>
            <h1 className="flex items-center gap-1.5 text-[16px] font-bold">
              {returnId ? (returnById(returnId)?.clientName || 'Client') : caps.isClient ? 'My documents' : 'Document library'}
              {caps.isClient && !returnId && <InfoTip label={CLIENT_TIPS.documents} side="bottom" />}
            </h1>
            {returnId && (
              <Link to="/documents" className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-muted transition hover:text-accent">
                <Icon name="back" size={12} /> All clients
              </Link>
            )}
          </>}
          <div data-tour="doc-search" className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-bg px-2.5 py-1.5">
            <Icon name="search" size={15} className="text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…" className="w-full bg-transparent text-[13px] outline-none" />
          </div>
          {embedded && (
            <Btn variant="default" size="sm" className="mt-2 w-full" onClick={() => setIngesting(true)}>
              <Icon name="upload" size={14} /> Add a document
            </Btn>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Facet value={cat} onChange={setCat} placeholder="All categories" options={DOC_CATEGORIES.map((c) => [c, c])} />
            <Facet value={status} onChange={setStatus} placeholder="Any status" options={Object.values(DOC_STATUS).map((s) => [s.key, s.label])} />
          </div>
          <div className="mt-2 text-[11px] text-faint">{filtered.length} of {corpus.length} documents</div>
        </div>

        <div className="pane flex-1 overflow-auto p-2">
          {loading && (
            <div className="space-y-2 p-2">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
            </div>
          )}
          {!loading && Object.keys(byCat).length === 0 && (
            <EmptyState icon="search" title="No documents match"
              body={q ? `Nothing matching “${q}”. Try a different term, or clear the category and status filters.` : 'Try clearing the category or status filter.'}
              action={<Btn variant="default" onClick={() => { setQ(''); setCat(''); setStatus('') }}>Clear filters</Btn>} />
          )}
          {!loading && DOC_CATEGORIES.filter((c) => byCat[c]?.length).map((c) => {
            const open = openCats.has(c)
            return (
              <div key={c} className="mb-1">
                <button onClick={() => setOpenCats((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n })}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left hover:bg-slateSoft">
                  <Icon name={open ? 'chevron-down' : 'chevron'} size={13} className="text-faint" />
                  <span className="text-[12px] font-bold uppercase tracking-wide text-muted">{c}</span>
                  <span className="ml-auto text-[11px] text-faint">{byCat[c].length}</span>
                </button>
                {open && byCat[c].map((d) => {
                  const st = DOC_STATUS[d.status]
                  return (
                    <button key={d.id} onClick={() => pick(d.id)}
                      className={cx('flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left', d.id === selected?.id ? 'bg-accent-soft' : 'hover:bg-slateSoft')}>
                      <Icon name="doc" size={15} className="shrink-0 text-faint" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium">{d.name}</span>
                        <span className="block truncate text-[11px] text-muted">{returnById(d.returnId)?.clientName} · {d.type}</span>
                      </span>
                      <Tag tone={st?.tone || 'muted'}>{st?.label}</Tag>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* detail - summary→detail while keeping the list beside it */}
      <div className="pane overflow-auto bg-bg/40 p-5">
        {selected ? (
          <div className="mx-auto max-w-2xl space-y-4">
            <SourceDocViewer doc={selected} />
            <Card className="p-4">
              <RelatedObjectsPanel node={{ kind: 'document', id: selected.id, returnId: selected.returnId }} />
            </Card>
          </div>
        ) : <div className="grid h-full place-items-center text-sm text-muted">Select a document.</div>}
      </div>

      {ingesting && <IngestDocument rid={embeddedReturnId} onClose={() => setIngesting(false)} />}
    </div>
  )
}

function Facet({ value, onChange, placeholder, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] font-semibold text-ink outline-none focus:border-accent">
      <option value="">{placeholder}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}
