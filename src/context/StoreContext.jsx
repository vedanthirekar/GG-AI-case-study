// ============================================================================
// A deliberately-light in-memory store that makes actions feel LIVE.
// It seeds from the static mock db, then lets the UI mutate: verifying a field,
// correcting a source value (which recomputes every dependent line + the refund),
// choosing between AI interpretations, fulfilling a request, or ingesting a new
// document. No persistence, no backend - just enough state that the product
// behaves like a system instead of a slideshow.
// ============================================================================
import { createContext, useContext, useMemo, useState, useCallback, useRef } from 'react'
import { returnById as seedReturn, notes as seedNotes, activitySeed, threadsForReturn } from '../data/db'

const StoreCtx = createContext(null)

// --- a simplified 2025 MFJ tax so recompute is believable ---------------------
function taxMFJ(taxable) {
  const t = Math.max(0, taxable)
  const brackets = [
    [0, 0.10], [23200, 0.12], [94300, 0.22], [201050, 0.24], [383900, 0.32], [487450, 0.35], [731200, 0.37],
  ]
  let tax = 0
  for (let i = 0; i < brackets.length; i++) {
    const [lo, rate] = brackets[i]
    const hi = brackets[i + 1]?.[0] ?? Infinity
    if (t > lo) tax += (Math.min(t, hi) - lo) * rate
    else break
  }
  return Math.round(tax)
}

// Recompute derived (locked) lines for a 1040-shaped field set, in place on a copy.
function recompute(fields) {
  const by = Object.fromEntries(fields.map((f) => [f.line, f]))
  const val = (line) => by[line]?.amount ?? 0
  const set = (line, amount, calc) => { if (by[line]) { by[line].amount = amount; if (calc) by[line].calc = calc } }

  if (by['9']) set('9', ['1a', '2b', '3a', '7', '8'].reduce((s, l) => s + val(l), 0),
    ['1a', '2b', '3a', '7', '8'].filter((l) => by[l]).map((l) => ({ label: `Line ${l}`, value: val(l) })))
  if (by['11']) set('11', val('9') - val('10'),
    [{ label: 'Total income (9)', value: val('9') }, { label: 'Adjustments (10)', value: -val('10') }])
  if (by['15']) set('15', Math.max(0, val('11') - val('12')),
    [{ label: 'AGI (11)', value: val('11') }, { label: 'Deduction (12)', value: -val('12') }])
  if (by['16']) set('16', taxMFJ(val('15')))
  if (by['34']) set('34', val('25') - val('16'),
    [{ label: 'Withheld (25)', value: val('25') }, { label: 'Tax (16)', value: -val('16') }])
  return fields
}

const DERIVED_LINES = new Set(['9', '11', '15', '16', '34'])

export function StoreProvider({ children }) {
  // returns: { [rid]: fields[] }   - cloned lazily from db on first touch
  const [returns, setReturns] = useState({})
  const [fulfilled, setFulfilled] = useState(() => new Set())
  const [flashes, setFlashes] = useState(() => new Set()) // "rid:fid" recently changed
  const [extraDocs, setExtraDocs] = useState({}) // { [rid]: doc[] }
  const [notes, setNotes] = useState(() => seedNotes.map((n) => ({ ...n })))
  const [activity, setActivity] = useState(() => activitySeed.map((a) => ({ ...a })))
  const [readIds, setReadIds] = useState(() => new Set())
  const flashTimer = useRef(null)
  const seq = useRef(0)

  // Live actions leave a trace in the notification centre, so the product feels
  // like a system reacting rather than a set of independent screens.
  const pushActivity = useCallback((item) => {
    seq.current += 1
    setActivity((a) => [{ id: `a-live-${seq.current}`, at: 'Just now', ...item }, ...a])
  }, [])

  const ensure = useCallback((rid) => {
    setReturns((r) => r[rid] ? r : { ...r, [rid]: (seedReturn(rid)?.fields || []).map((f) => ({ ...f, calc: f.calc ? f.calc.map((c) => ({ ...c })) : undefined })) })
  }, [])

  const getFields = useCallback((rid) => returns[rid] || (seedReturn(rid)?.fields || []), [returns])
  const getField = useCallback((rid, fid) => getFields(rid).find((f) => f.id === fid), [getFields])

  const flash = useCallback((rid, lines) => {
    setFlashes(new Set(lines.map((f) => `${rid}:${f.id}`)))
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlashes(new Set()), 1300)
  }, [])

  // apply a mutation to a field, then recompute derived lines
  const mutate = useCallback((rid, fid, patch, { recalc = true, flashDerived = false } = {}) => {
    ensure(rid)
    setReturns((prev) => {
      const base = prev[rid] || (seedReturn(rid)?.fields || []).map((f) => ({ ...f }))
      let next = base.map((f) => f.id === fid ? { ...f, ...patch } : { ...f })
      const before = Object.fromEntries(next.map((f) => [f.id, f.amount]))
      if (recalc) next = recompute(next)
      if (flashDerived) {
        const changed = next.filter((f) => DERIVED_LINES.has(f.line) && f.amount !== before[f.id])
        setTimeout(() => flash(rid, [...changed, next.find((f) => f.id === fid)].filter(Boolean)), 0)
      }
      return { ...prev, [rid]: next }
    })
  }, [ensure, flash])

  const verifyField = useCallback((rid, fid) =>
    mutate(rid, fid, { state: 'verified', confidence: 100, verifiedAt: Date.now() }, { recalc: false }), [mutate])

  const correctField = useCallback((rid, fid, value) =>
    mutate(rid, fid, { amount: Number(value), state: 'verified', confidence: 100, correctedFrom: getField(rid, fid)?.amount, verifiedAt: Date.now() }, { flashDerived: true }), [mutate, getField])

  const pickInterpretation = useCallback((rid, fid, candidate) =>
    mutate(rid, fid, { amount: candidate.value, state: 'verified', confidence: 100, chosen: candidate.key, aiNote: candidate.rationale }, { flashDerived: true }), [mutate])

  const flagField = useCallback((rid, fid) => {
    mutate(rid, fid, { state: 'review', flaggedForReviewer: true }, { recalc: false })
    const f = getField(rid, fid)
    pushActivity({ kind: 'flag', audience: 'firm', title: 'Sent to a reviewer',
      sub: `${seedReturn(rid)?.clientName} · Line ${f?.line} ${f?.label}`, to: `/returns/${rid}?tab=review&field=${fid}` })
  }, [mutate, getField, pushActivity])

  const ingestDocument = useCallback((rid, doc, newFields) => {
    setExtraDocs((d) => ({ ...d, [rid]: [...(d[rid] || []), doc] }))
    ensure(rid)
    setReturns((prev) => {
      const base = prev[rid] || (seedReturn(rid)?.fields || []).map((f) => ({ ...f }))
      const next = recompute([...base, ...newFields.map((f) => ({ ...f }))])
      return { ...prev, [rid]: next }
    })
    setTimeout(() => flash(rid, newFields), 0)
    pushActivity({ kind: 'doc', audience: 'firm', title: 'Document received',
      sub: `${seedReturn(rid)?.clientName} · ${doc.name}`, to: `/returns/${rid}?tab=documents&doc=${doc.id}` })
  }, [ensure, flash, pushActivity])

  const getExtraDocs = useCallback((rid) => extraDocs[rid] || [], [extraDocs])

  // ---- shared notes (Challenge 02) -----------------------------------------
  const getNotes = useCallback((rid) => notes.filter((n) => n.returnId === rid), [notes])

  const addNote = useCallback((rid, note) => {
    seq.current += 1
    setNotes((n) => [...n, { id: `n-live-${seq.current}`, returnId: rid, done: false, ts: nowStamp(), ...note }])
    pushActivity({ kind: 'note', audience: note.visibility === 'firm' ? 'firm' : 'all',
      title: 'New note on a return', sub: `${seedReturn(rid)?.clientName} · ${note.body.slice(0, 48)}…`,
      to: `/returns/${rid}?tab=notes` })
  }, [pushActivity])

  const toggleNote = useCallback((noteId) =>
    setNotes((n) => n.map((x) => x.id === noteId ? { ...x, done: !x.done } : x)), [])

  const fulfillRequest = useCallback((threadId, meta = {}) => {
    setFulfilled((s) => new Set(s).add(threadId))
    pushActivity({ kind: 'doc', audience: 'firm', title: 'A client sent what you asked for',
      sub: meta.what || 'Outstanding request fulfilled', to: meta.to || '/messages' })
  }, [pushActivity])
  const isFulfilled = useCallback((threadId) => fulfilled.has(threadId), [fulfilled])
  const isFlashing = useCallback((rid, fid) => flashes.has(`${rid}:${fid}`), [flashes])

  // A return is only ever blocked on something a person is waiting on - and for
  // every return that names one, that "something" is a request attached to a
  // thread. So a block clears when that request is fulfilled, live, rather than
  // sitting on the return as a fact fixed at seed time. Generated returns whose
  // block reason isn't tied to any thread (there's nothing to fulfill) keep
  // their seed value - there's no live signal for them to react to.
  const isBlockLifted = useCallback((rid) => {
    const blockingThread = threadsForReturn(rid).find((t) => t.request)
    if (!blockingThread) return false
    return blockingThread.request.fulfilled || isFulfilled(blockingThread.id)
  }, [isFulfilled])

  // live summary derived from current field states
  const summary = useCallback((rid) => {
    const fields = getFields(rid)
    const done = (s) => s === 'verified' || s === 'locked' || s === 'readonly'
    const verified = fields.filter((f) => done(f.state)).length
    const refundField = fields.find((f) => f.line === '34')
    const seed = seedReturn(rid)
    return {
      fieldsVerified: verified,
      fieldsTotal: fields.length,
      needsReview: fields.filter((f) => f.state === 'review').length,
      refund: refundField ? refundField.amount : seed?.refund,
      allVerified: fields.length > 0 && fields.every((f) => done(f.state)),
      blocked: Boolean(seed?.blocked) && !isBlockLifted(rid),
    }
  }, [getFields, isBlockLifted])

  // ---- notification centre --------------------------------------------------
  const markAllRead = useCallback(() => setReadIds(new Set(activity.map((a) => a.id))), [activity])
  const isRead = useCallback((id) => readIds.has(id), [readIds])

  const value = useMemo(() => ({
    getFields, getField, verifyField, correctField, pickInterpretation, flagField,
    ingestDocument, getExtraDocs, fulfillRequest, isFulfilled, isFlashing, summary, isBlockLifted,
    getNotes, addNote, toggleNote,
    activity, pushActivity, markAllRead, isRead,
  }), [getFields, getField, verifyField, correctField, pickInterpretation, flagField, ingestDocument,
    getExtraDocs, fulfillRequest, isFulfilled, isFlashing, summary, isBlockLifted, getNotes, addNote, toggleNote,
    activity, pushActivity, markAllRead, isRead])

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
