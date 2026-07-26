// Trustworthy-AI interaction model (Challenge 10) — now live.
// Shows WHAT the AI did, WHY, the EVIDENCE, the UNCERTAINTY, a prior-year sanity
// check, and the recommended ACTION. For genuinely ambiguous fields it presents
// a CHOICE between interpretations (with evidence) instead of a single guess.
// Every action writes to the store, so the return recomputes and updates live.
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { explainField } from '../../data/ai'
import { docById } from '../../data/db'
import { useStore } from '../../context/StoreContext'
import { ConfidenceMeter, ConfidencePill, confidenceTone } from '../affordances/ConfidenceBadge'
import { Btn, Icon, Money, Tag, cx } from '../ui'
import { useSession } from '../../context/SessionContext'
import { whyLocked } from '../../lib/roles'

export default function AIRecommendationCard({ rid, field }) {
  const { caps, activeRole } = useSession()
  const { verifyField, correctField, pickInterpretation, flagField } = useStore()
  const [showEvidence, setShowEvidence] = useState(false)
  const [correcting, setCorrecting] = useState(false)
  const [draft, setDraft] = useState(field?.amount ?? 0)

  if (!field) {
    return (
      <div className="rounded-xl2 border border-line bg-surface p-6 text-center text-sm text-muted">
        Select a field on the left to see how Verity AI derived it.
      </div>
    )
  }
  const sourceDoc = field.sourceDocId ? docById(field.sourceDocId) : null
  const ai = explainField(field, sourceDoc)
  const canVerify = caps.verifyFields
  const resolved = field.state === 'verified' || field.state === 'locked' || field.state === 'readonly'
  const needsChoice = field.candidates && field.state === 'review' && !field.chosen

  return (
    <div data-tour="ai-card" className="animate-fade overflow-hidden rounded-xl2 border border-ai/25 bg-gradient-to-b from-ai-soft/70 to-surface">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2 font-display font-bold text-ai">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-ai/12 text-ai"><Icon name="sparkle" size={14} /></span>
          Verity AI
        </div>
        <ConfidencePill value={field.confidence} />
      </div>

      <div className="px-4 pb-4">
        <p className="mt-2 text-[13px] leading-snug text-ink/80">{ai.summary}</p>
        {field.aiNote && <p className="mt-1.5 text-[12px] leading-snug text-muted">{field.aiNote}</p>}

        {/* prior-year sanity check */}
        {field.prior != null && field.prior !== field.amount && <PriorDelta amount={field.amount} prior={field.prior} anomaly={field.anomaly} />}

        {field.confidence != null && <ConfidenceMeter value={field.confidence} className="mt-3" />}

        {/* uncertainty */}
        {ai.uncertainty && !resolved && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-warn-soft px-3 py-2 text-[12px] text-warn">
            <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
            <span><b>What’s uncertain:</b> {ai.uncertainty}</span>
          </div>
        )}

        {/* RECONCILIATION — choose between interpretations */}
        {needsChoice ? (
          <div className="mt-3">
            <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <Icon name="scale" size={14} className="text-ai" /> Two possible readings — you decide
            </div>
            <div className="space-y-2">
              {field.candidates.map((c) => (
                <CandidateCard key={c.key} c={c} disabled={!canVerify}
                  onPick={() => pickInterpretation(rid, field.id, c)}
                  reason={!canVerify ? whyLocked(activeRole, 'verifyFields') : undefined} />
              ))}
            </div>
            <button onClick={() => { setDraft(field.amount); setCorrecting(true) }} className="mt-2 text-[12px] font-semibold text-accent">
              Neither — enter my own value
            </button>
          </div>
        ) : (
          <>
            {/* evidence disclosure */}
            <button onClick={() => setShowEvidence((s) => !s)} className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-accent">
              <Icon name={showEvidence ? 'chevron-down' : 'chevron'} size={13} />
              {showEvidence ? 'Hide' : 'Show'} the evidence ({ai.evidence.length})
            </button>
            <AnimatePresence>
              {showEvidence && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-1.5 overflow-hidden">
                  {ai.evidence.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-lg border border-line2 bg-surface px-3 py-2 text-[12px]">
                      <span className="mt-0.5 text-faint"><Icon name={e.kind === 'source' ? 'doc' : e.kind === 'calc' ? 'grid' : 'link'} size={13} /></span>
                      <div><div className="font-semibold text-ink">{e.label}</div><div className="text-muted">{e.detail}</div></div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </>
        )}

        {/* correction editor */}
        {correcting ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-lg border border-accent/40 bg-accent-soft/60 p-3">
            <div className="text-[12px] font-semibold text-ink">Enter the correct value</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-muted">$</span>
              <input autoFocus type="number" value={draft} onChange={(e) => setDraft(e.target.value)}
                className="w-40 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm tnum outline-none focus:border-accent" />
            </div>
            <p className="mt-2 text-[11px] text-muted">Your value overrides the AI, marks the field verified, and recomputes any line that depends on it.</p>
            <div className="mt-2.5 flex gap-2">
              <Btn variant="primary" onClick={() => { correctField(rid, field.id, draft); setCorrecting(false) }}><Icon name="check" size={14} /> Save &amp; recompute</Btn>
              <Btn variant="ghost" onClick={() => setCorrecting(false)}>Cancel</Btn>
            </div>
          </motion.div>
        ) : field.correctedFrom != null ? (
          <div className="mt-4 rounded-lg bg-good-soft px-3 py-2 text-[12px] text-good">
            <Icon name="check" size={13} className="mr-1 inline" />
            Corrected from <Money value={field.correctedFrom} className="text-good" /> → <Money value={field.amount} className="text-good" /> · verified &amp; recomputed.
          </div>
        ) : field.chosen ? (
          <div className="mt-4 rounded-lg bg-good-soft px-3 py-2 text-[12px] text-good">
            <Icon name="check" size={13} className="mr-1 inline" /> Interpretation chosen · verified &amp; recomputed.
          </div>
        ) : field.state === 'verified' ? (
          <div className="mt-4 rounded-lg bg-good-soft px-3 py-2 text-[12px] text-good">
            <Icon name="check" size={13} className="mr-1 inline" /> Accepted &amp; verified.
          </div>
        ) : field.state === 'locked' ? (
          <div className="mt-4 rounded-lg bg-slateSoft px-3 py-2 text-[12px] text-muted">
            <Icon name="lock" size={13} className="mr-1 inline" /> Calculated automatically — edit the input lines to change it.
          </div>
        ) : field.state === 'readonly' ? (
          <div className="mt-4 rounded-lg bg-slateSoft px-3 py-2 text-[12px] text-muted">
            <Icon name="lock" size={13} className="mr-1 inline" /> Set by an IRS rule and can’t be changed here.
          </div>
        ) : !needsChoice ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn variant={ai.action.tone === 'warn' ? 'warn' : 'primary'} disabled={!canVerify}
              title={!canVerify ? whyLocked(activeRole, 'verifyFields') : undefined}
              onClick={() => verifyField(rid, field.id)}>
              <Icon name="check" size={14} /> {canVerify ? ai.action.label : 'Verify (no permission)'}
            </Btn>
            <Btn onClick={() => { setDraft(field.amount); setCorrecting(true) }}><Icon name="edit" size={14} /> Correct value</Btn>
            {!field.flaggedForReviewer
              ? <Btn variant="ghost" onClick={() => flagField(rid, field.id)}>Flag for reviewer</Btn>
              : <Tag tone="warn" className="self-center">Flagged for reviewer</Tag>}
          </div>
        ) : null}

        {!canVerify && !resolved && (
          <p className="mt-2 text-[11px] text-faint">{whyLocked(activeRole, 'verifyFields')}</p>
        )}
      </div>
    </div>
  )
}

function PriorDelta({ amount, prior, anomaly }) {
  const diff = amount - prior
  const pct = prior ? Math.round((diff / prior) * 100) : 0
  const up = diff > 0
  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-line2 bg-surface px-3 py-2 text-[12px]">
      <Icon name="trending" size={14} className={up ? 'text-warn' : 'text-good'} />
      <span className="text-muted">vs last year</span>
      <Money value={prior} className="text-muted" />
      <Icon name="arrow-right" size={12} className="text-faint" />
      <Money value={amount} />
      <span className={cx('font-semibold', Math.abs(pct) >= 40 ? 'text-warn' : 'text-muted')}>({up ? '+' : ''}{pct}%)</span>
      {anomaly && <span className="ml-auto text-[11px] text-warn">⚑ {anomaly}</span>}
    </div>
  )
}

function CandidateCard({ c, onPick, disabled, reason }) {
  const [open, setOpen] = useState(false)
  const t = confidenceTone(c.confidence)
  return (
    <div className={cx('rounded-lg border bg-surface p-3', c.recommended ? 'border-ai/40 ring-1 ring-ai/20' : 'border-line')}>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-ink">{c.label}</span>
        {c.recommended && <Tag tone="ai">AI pick</Tag>}
        <Money value={c.value} className="ml-auto" />
      </div>
      <p className="mt-1 text-[12px] text-muted">{c.rationale}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px] font-semibold" style={{ color: t.color }}>{c.confidence}% likely</span>
        <button onClick={() => setOpen((o) => !o)} className="text-[11px] font-semibold text-accent">{open ? 'Hide' : 'Evidence'}</button>
        <Btn size="sm" variant={c.recommended ? 'primary' : 'default'} className="ml-auto" disabled={disabled} title={reason} onClick={onPick}>Use this</Btn>
      </div>
      {open && (
        <ul className="mt-2 space-y-1 border-t border-line2 pt-2">
          {c.evidence.map((e, i) => <li key={i} className="flex gap-1.5 text-[11.5px] text-muted"><Icon name="check" size={12} className="mt-0.5 shrink-0 text-good" />{e}</li>)}
        </ul>
      )}
    </div>
  )
}
