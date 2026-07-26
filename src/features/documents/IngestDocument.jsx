// Simulated document ingestion (Challenge 10 — "how you present AI extraction").
// No real OCR: picking a sample doc runs a staged fake pipeline — upload →
// extract (fields reveal one by one, confidence counts up) → apply. On apply it
// writes a new document + extracted field into the store, so the return updates
// live and the new value is fully traceable back to this doc.
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../context/StoreContext'
import { Btn, Icon, Money, cx } from '../../components/ui'

// A few plausible documents a client might drop in.
const PRESETS = [
  { type: '1099-INT', issuer: 'Coastal Credit Union', cat: 'Income', line: '2b', group: 'Income', label: 'Taxable interest', amount: 318, conf: 94,
    boxes: [{ key: 'payer', label: 'Payer', value: 'Coastal Credit Union' }, { key: 'box1', label: 'Box 1 — Interest income', value: '318.00' }], sourceBox: 'box1' },
  { type: '1099-NEC', issuer: 'Brightside Studio', cat: 'Income', line: '8', group: 'Income', label: 'Nonemployee compensation', amount: 7400, conf: 88,
    boxes: [{ key: 'payer', label: 'Payer', value: 'Brightside Studio' }, { key: 'box1', label: 'Box 1 — Nonemployee comp.', value: '7,400.00' }], sourceBox: 'box1' },
  { type: '1098-T', issuer: 'State University', cat: 'Deductions', line: '21', group: 'Deductions', label: 'Tuition (1098-T)', amount: 4200, conf: 79,
    boxes: [{ key: 'inst', label: 'Institution', value: 'State University' }, { key: 'box1', label: 'Box 1 — Payments received', value: '4,200.00' }], sourceBox: 'box1' },
]

export default function IngestDocument({ rid, onClose }) {
  const { ingestDocument } = useStore()
  const [preset, setPreset] = useState(null)
  const [phase, setPhase] = useState('pick') // pick → upload → extract → done
  const [progress, setProgress] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [conf, setConf] = useState(0)
  const timers = useRef([])

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearTimers(), [])

  const run = (p) => {
    setPreset(p); setPhase('upload'); setProgress(0); setRevealed(0); setConf(0)
    // upload bar
    const upInt = setInterval(() => setProgress((v) => { if (v >= 100) { clearInterval(upInt); return 100 } return v + 8 }), 40)
    timers.current.push(setTimeout(() => {
      clearInterval(upInt); setProgress(100); setPhase('extract')
      // reveal boxes one by one
      p.boxes.forEach((_, i) => timers.current.push(setTimeout(() => setRevealed(i + 1), 400 + i * 500)))
      // count confidence up
      timers.current.push(setTimeout(() => {
        const cInt = setInterval(() => setConf((c) => { if (c >= p.conf) { clearInterval(cInt); return p.conf } return c + 3 }), 30)
      }, 400 + p.boxes.length * 500))
      timers.current.push(setTimeout(() => setPhase('done'), 900 + p.boxes.length * 500))
    }, 900))
  }

  const apply = () => {
    const docId = `d-ingest-${Date.now()}`
    const doc = { id: docId, returnId: rid, clientId: '', type: preset.type, category: preset.cat,
      name: `${preset.type} — ${preset.issuer}`, issuer: preset.issuer, pages: 1,
      uploaded: new Date().toISOString().slice(0, 10), status: 'processed', source: 'client-upload', boxes: preset.boxes }
    const field = { id: `f-ingest-${Date.now()}`, line: preset.line, group: preset.group, label: preset.label,
      amount: preset.amount, state: 'ai', confidence: preset.conf, sourceDocId: docId, sourceBox: preset.sourceBox,
      sourceLocation: `${preset.boxes[preset.boxes.length - 1].label.split('—')[0].trim()} · page 1`, transform: 'Copied as-is',
      aiNote: 'Freshly extracted from an uploaded document.' }
    ingestDocument(rid, doc, [field])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-scrim/60 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: .96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()} className="w-[min(94vw,520px)] overflow-hidden rounded-xl3 border border-line bg-surface shadow-pop">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-2 font-display font-bold"><Icon name="upload" size={16} className="text-accent" /> Add a document</div>
          <button onClick={onClose} className="text-faint hover:text-ink"><Icon name="x" size={16} /></button>
        </div>

        {phase === 'pick' && (
          <div className="p-5">
            <div className="mb-3 rounded-xl2 border-2 border-dashed border-line py-8 text-center text-[13px] text-muted">
              <Icon name="upload" size={26} className="mx-auto mb-2 text-faint" />
              Drop a file here — or pick a sample to simulate extraction
            </div>
            <div className="space-y-2">
              {PRESETS.map((p) => (
                <button key={p.type} onClick={() => run(p)} className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left hover:border-accent/40 hover:bg-accent-soft/40">
                  <Icon name="doc" size={18} className="text-faint" />
                  <div className="flex-1"><div className="text-[13px] font-semibold">{p.type} — {p.issuer}</div><div className="text-[11px] text-muted">Adds to Line {p.line} · {p.label}</div></div>
                  <Icon name="play" size={14} className="text-accent" />
                </button>
              ))}
            </div>
          </div>
        )}

        {phase !== 'pick' && preset && (
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
              <span className="rounded bg-inverse px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-inverse-fg">{preset.type}</span>
              {preset.issuer}
              <span className="ml-auto text-[11px] font-medium text-muted">
                {phase === 'upload' ? 'Uploading…' : phase === 'extract' ? 'Extracting…' : 'Ready'}
              </span>
            </div>

            {/* upload bar */}
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent-fill transition-all" style={{ width: `${progress}%` }} />
            </div>

            {/* the "paper" with fields revealing */}
            <div className={cx('paper rounded-xl2 border border-line p-4', phase === 'extract' && 'shimmer')}>
              {preset.boxes.map((b, i) => (
                <AnimatePresence key={b.key}>
                  {revealed > i && (
                    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      className={cx('flex items-center justify-between rounded px-2 py-1.5 text-[12.5px]', b.key === preset.sourceBox ? 'bg-accent/10 outline outline-1 outline-accent' : '')}>
                      <span className="text-muted">{b.label}</span><span className="tnum font-semibold">{b.value}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>

            {phase !== 'upload' && (
              <div className="mt-3 flex items-center gap-2 text-[12px]">
                <span className="text-muted">Extraction confidence</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-good-fill transition-all" style={{ width: `${conf}%` }} /></div>
                <span className="tnum font-semibold text-good">{conf}%</span>
              </div>
            )}

            {phase === 'done' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center justify-between rounded-lg bg-good-soft px-3 py-2.5">
                <div className="text-[12.5px] text-good">
                  <Icon name="check" size={14} className="mr-1 inline" />
                  Found <b>{preset.label}</b> = <Money value={preset.amount} className="text-good" /> → Line {preset.line}
                </div>
                <Btn variant="good" onClick={apply}>Add to return</Btn>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
