// Source Document Traceability (Challenge 01) - the flagship review screen, live.
//
// Two layouts, because reviewers work two different ways:
//   · Trace       - the return beside the full evidence chain, doc included.
//   · Side by side - the return, the source document at full height, and the
//                    trace/AI panel: checking a figure against the form without
//                    either one being reduced to a thumbnail.
// The choice lives in the URL (?view=split) so a shared link opens the way you
// were working.
//
// Left in both: the return line by line, each with a consistent affordance
// state, a prior-year trend hint, and a recompute "flash" when a value changes.
// Plus a keyboard-driven Review Queue that walks only the fields needing review.
import { useMemo, useEffect, useCallback, useState } from 'react'
import { docById } from '../../data/db'
import { useStore } from '../../context/StoreContext'
import { useSession } from '../../context/SessionContext'
import StateBadge from '../../components/affordances/StateBadge'
import SourceDocViewer from './SourceDocViewer'
import AIRecommendationCard from '../../components/ai/AIRecommendationCard'
import { Money, Icon, Btn, Kbd, Tooltip, InfoTip, cx } from '../../components/ui'
import { CLIENT_TIPS } from '../../data/help'

export default function ReturnReview({ ret, selectedId, onSelect, view = 'trace', onView }) {
  const rid = ret.id
  const { getFields, verifyField, isFlashing } = useStore()
  const { caps } = useSession()
  const fields = getFields(rid)
  const selected = fields.find((f) => f.id === selectedId) || fields[0]
  const groups = useMemo(() => groupBy(fields, 'group'), [fields])
  const sourceDoc = selected?.sourceDocId ? docById(selected.sourceDocId) : null
  const reviewFields = fields.filter((f) => f.state === 'review')
  const split = view === 'split'

  const [queue, setQueue] = useState(false)

  // keyboard review queue: j/k move, a = accept current
  const move = useCallback((dir) => {
    const list = queue ? reviewFields : fields
    if (!list.length) return
    const idx = Math.max(0, list.findIndex((f) => f.id === selected?.id))
    const nextIdx = (idx + dir + list.length) % list.length
    onSelect(list[nextIdx].id)
  }, [queue, reviewFields, fields, selected, onSelect])

  useEffect(() => {
    if (!queue) return
    const h = (e) => {
      if (['j', 'ArrowDown'].includes(e.key)) { e.preventDefault(); move(1) }
      if (['k', 'ArrowUp'].includes(e.key)) { e.preventDefault(); move(-1) }
      if (e.key === 'a' && caps.verifyFields && selected) verifyField(rid, selected.id)
      if (e.key === 'Escape') setQueue(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [queue, move, caps.verifyFields, selected, rid, verifyField])

  if (fields.length === 0) {
    return <div className="grid h-full place-items-center p-10 text-center text-body text-muted">
      This return doesn’t have line-level detail wired up yet. Try Jordan Rivera’s 1040 for the full traceability demo.
    </div>
  }
  const verified = fields.filter((f) => ['verified', 'locked', 'readonly'].includes(f.state)).length

  return (
    <div className={cx('grid h-full grid-cols-1',
      split ? 'xl:grid-cols-[minmax(320px,.85fr)_1.15fr_1fr]' : 'lg:grid-cols-[1.05fr_1fr]')}>

      {/* ---------- LEFT - the return ---------- */}
      <div data-tour="field-list" className="pane overflow-auto border-r border-line bg-surface">
        <div className="sticky top-0 z-10 border-b border-line2 bg-surface/95 px-5 py-3 backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            {/* The workspace header directly above already carries the client
                name and the form, and the active tab already says "Review".
                Repeating both here was three labels for one fact. */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-meta text-muted">
                <span>
                  {verified}/{fields.length} verified ·{' '}
                  <span className="text-warn">{reviewFields.length} need review</span>
                </span>
                {caps.isClient && <InfoTip label={CLIENT_TIPS.readonly} side="bottom" />}
              </div>
            </div>
            {reviewFields.length > 0 && (
              <Btn variant={queue ? 'primary' : 'default'} size="sm"
                onClick={() => { setQueue((q) => !q); if (!queue && reviewFields[0]) onSelect(reviewFields[0].id) }}>
                <Icon name="keyboard" size={14} /> Review queue
              </Btn>
            )}
          </div>

          {/* layout switch - the "side-by-side" the reviewer actually wants */}
          <div className="mt-2.5 flex items-center gap-1.5" data-tour="view-toggle">
            <span className="shrink-0 text-micro font-semibold text-faint">View</span>
            <div className="flex rounded-lg border border-line bg-surface p-0.5 text-micro font-semibold">
              <button onClick={() => onView?.('trace')}
                className={cx('flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 transition', !split ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink')}>
                <Icon name="panel" size={12} /> Trace
              </button>
              <button onClick={() => onView?.('split')}
                className={cx('flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 transition', split ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink')}>
                <Icon name="columns" size={12} /> Side by side
              </button>
            </div>
          </div>

          {queue && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-1.5 text-micro text-accent">
              <Icon name="bolt" size={13} /> Queue mode · <Kbd>j</Kbd>/<Kbd>k</Kbd> move · <Kbd>a</Kbd> accept · <Kbd>esc</Kbd> exit
              <span className="ml-auto font-semibold">{reviewFields.length} left</span>
            </div>
          )}
        </div>

        <div className="px-3 py-2">
          {Object.entries(groups).map(([group, gfields]) => (
            <div key={group}>
              <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-faint">{group}</div>
              {gfields.map((f) => (
                <button key={f.id} onClick={() => onSelect(f.id)}
                  className={cx('group grid w-full grid-cols-[26px_1fr_auto] items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition',
                    f.id === selected.id ? 'border-accent/30 bg-accent-soft' : 'border-transparent hover:bg-slateSoft',
                    isFlashing(rid, f.id) && 'animate-flash')}>
                  <span className="tnum text-meta text-faint">{f.line}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-body font-medium">{f.label}</span>
                      {f.prior != null && f.prior !== f.amount && Math.abs((f.amount - f.prior) / (f.prior || 1)) >= 0.4 && (
                        <Tooltip label={`Prior year: $${f.prior.toLocaleString()} - a large change worth checking`}>
                          <Icon name="trending" size={12} className="shrink-0 text-warn" />
                        </Tooltip>
                      )}
                      {f.sourceDocId && (
                        <Icon name="doc" size={11} className="shrink-0 text-faint opacity-0 transition group-hover:opacity-100" />
                      )}
                    </span>
                    <span className="block truncate text-micro text-muted">{f.sourceLocation || f.transform || 'Manual entry'}</span>
                  </span>
                  {/* value first, then how much you can trust it - stacked so the
                      label keeps its width even in the narrow side-by-side column */}
                  <span className="flex flex-col items-end gap-1">
                    <Money value={f.amount} className="text-body" />
                    <StateBadge state={f.state} confidence={f.confidence} />
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- MIDDLE (split only) - the source document, full height ---------- */}
      {split && (
        <div className="pane hidden min-h-0 flex-col border-r border-line bg-bgtint/30 p-3 xl:flex" data-tour="doc-pane">
          {/* No location chip here: the trace chain names the box, and the
              document below highlights it. Three statements of one location. */}
          <div className="mb-2 flex items-center gap-1.5 px-1 text-micro font-semibold uppercase tracking-wide text-faint">
            <Icon name="doc" size={12} /> Source document
          </div>
          <div className="min-h-0 flex-1">
            <SourceDocViewer doc={sourceDoc} highlightBox={selected.sourceBox} tall />
          </div>
        </div>
      )}

      {/* ---------- RIGHT - traceability for the selected field ---------- */}
      <div data-tour="trace-panel" className="pane overflow-auto bg-bgtint/30">
        <div className="border-b border-line2 bg-bgtint/40 px-5 py-3">
          <div className="text-micro font-semibold uppercase tracking-wide text-faint">Traceability · Line {selected.line}</div>
          <TraceChain field={selected} doc={sourceDoc} />
        </div>

        <div className="space-y-4 p-5">
          {/* in split view the document already has its own column */}
          {!split && <SourceDocViewer doc={sourceDoc} highlightBox={selected.sourceBox} />}

          {selected.calc && !selected.chosen && selected.correctedFrom == null && (
            <div className="rounded-xl2 border border-line bg-surface p-4">
              <div className="mb-2 flex items-center gap-1.5 text-meta font-semibold text-ink"><Icon name="grid" size={13} /> How this was calculated</div>
              <div className="space-y-1">
                {selected.calc.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-body">
                    <span className="text-muted">{c.label}</span><Money value={c.value} />
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-line2 pt-1.5 text-body font-bold">
                  <span>Line {selected.line}</span><Money value={selected.amount} />
                </div>
              </div>
            </div>
          )}

          <AIRecommendationCard rid={rid} field={selected} />
        </div>
      </div>
    </div>
  )
}

function TraceChain({ field, doc }) {
  const steps = []
  if (doc) steps.push({ icon: 'doc', label: `${doc.type} · ${doc.issuer}` })
  if (field.sourceLocation) steps.push({ icon: 'compass', label: field.sourceLocation })
  steps.push({ icon: 'wand', label: field.transform || 'Manual entry' })
  steps.push({ icon: 'check', label: `Line ${field.line}`, value: field.amount, end: true })
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {steps.map((s, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <Icon name="arrow-right" size={13} className="text-faint" />}
          <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-micro',
            s.end ? 'border-accent/40 bg-accent-soft font-semibold text-accent' : 'border-line bg-surface text-muted')}>
            <Icon name={s.icon} size={12} />{s.label}{s.value != null && <span className="tnum">· ${s.value.toLocaleString()}</span>}
          </span>
        </span>
      ))}
    </div>
  )
}

function groupBy(arr, key) {
  return arr.reduce((acc, x) => { (acc[x[key]] ||= []).push(x); return acc }, {})
}
