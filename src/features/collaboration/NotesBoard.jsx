// Shared notes (Challenge 02).
// Threads are for conversations that need an owner and a resolution. A lot of
// what actually passes between a client and a firm isn't that - it's "heads up",
// "don't forget", "waiting on X". Without a home, that lands in email and is
// lost. So the return carries a rough tracker any party can write on:
//   · every note says who wrote it and in what capacity
//   · notes can be pinned to a specific line or document
//   · they tick off when handled, so the board self-clears
//   · visibility is explicit - Everyone, or Firm only (never sent to a client)
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { userById } from '../../data/db'
import { ROLES } from '../../data/catalog'
import { useSession } from '../../context/SessionContext'
import { useStore } from '../../context/StoreContext'
import { Card, Avatar, Btn, Icon, Tag, EmptyState, cx } from '../../components/ui'

export default function NotesBoard({ ret }) {
  const { caps, user, activeRole } = useSession()
  const { getNotes, addNote, toggleNote, getFields } = useStore()
  const [draft, setDraft] = useState('')
  const [firmOnly, setFirmOnly] = useState(false)
  const [anchorId, setAnchorId] = useState('')
  const [showDone, setShowDone] = useState(false)

  const all = getNotes(ret.id)
  // firm-only notes are filtered out of a client's data entirely
  const visible = useMemo(
    () => all.filter((n) => n.visibility === 'all' || caps.seeInternalNotes),
    [all, caps.seeInternalNotes])

  const open = visible.filter((n) => !n.done)
  const done = visible.filter((n) => n.done)
  const fields = getFields(ret.id)

  const post = () => {
    if (!draft.trim()) return
    const f = fields.find((x) => x.id === anchorId)
    addNote(ret.id, {
      authorId: user.id, role: activeRole, body: draft.trim(),
      visibility: firmOnly && caps.seeInternalNotes ? 'firm' : 'all',
      anchor: f ? { kind: 'field', id: f.id, label: `Line ${f.line} · ${f.label}` } : null,
    })
    setDraft(''); setAnchorId(''); setFirmOnly(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-meta font-semibold uppercase tracking-wide text-accent">
            <Icon name="note" size={13} /> Shared notes
          </div>
          <h2 className="mt-0.5 font-display text-title font-bold">The rough tracker for this return</h2>
          <p className="text-body text-muted">
            {caps.isClient
              ? 'Anything you or your preparer wants the other to know. Short, informal, and never lost in an inbox.'
              : 'Quick jottings between everyone touching this return. Tick them off as they’re handled.'}
          </p>
        </div>
        <Tag tone={open.length ? 'warn' : 'good'} dot>{open.length} open</Tag>
      </div>

      {/* composer */}
      <Card className="mt-4 p-3" data-tour="notes-composer">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
          placeholder={caps.isClient ? 'Add a note for your preparer…' : 'Add a note - anyone on this return will see it…'}
          className={cx('w-full resize-none rounded-lg border p-2.5 text-body outline-none transition placeholder:text-faint focus:border-accent',
            firmOnly ? 'border-warn/40 bg-warn-soft/40' : 'border-line bg-surface')} />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* pin the note to a line, so it's contextual rather than floating */}
          {fields.length > 0 && (
            <select value={anchorId} onChange={(e) => setAnchorId(e.target.value)}
              className="rounded-lg border border-line bg-surface px-2 py-1.5 text-meta font-medium text-ink outline-none focus:border-accent">
              <option value="">No specific line</option>
              {fields.map((f) => <option key={f.id} value={f.id}>Line {f.line} · {f.label}</option>)}
            </select>
          )}

          {caps.seeInternalNotes && (
            <div className="flex items-center gap-1 rounded-lg bg-slateSoft p-0.5 text-meta font-semibold">
              <button onClick={() => setFirmOnly(false)}
                className={cx('rounded-md px-2.5 py-1', !firmOnly ? 'bg-surface text-accent shadow-e1' : 'text-muted')}>Everyone</button>
              <button onClick={() => setFirmOnly(true)}
                className={cx('rounded-md px-2.5 py-1', firmOnly ? 'bg-warn-soft text-warn' : 'text-muted')}>Firm only</button>
            </div>
          )}

          <span className="text-micro text-faint">
            {firmOnly ? '🔒 The client will never see this.' : caps.isClient ? '👁 Your preparer will see this.' : '👁 Visible to the client too.'}
          </span>
          <Btn variant="primary" size="sm" className="ml-auto" onClick={post} disabled={!draft.trim()}>
            <Icon name="plus" size={13} /> Add note
          </Btn>
        </div>
      </Card>

      {/* open notes */}
      <div className="mt-5 space-y-2">
        {open.length === 0 && (
          <EmptyState icon="note" title="Nothing outstanding"
            body={caps.isClient ? 'When your preparer jots something down for you, it shows up here.' : 'Add the first note - it beats an email thread nobody can find later.'} />
        )}
        <AnimatePresence initial={false}>
          {open.map((n) => <NoteRow key={n.id} n={n} ret={ret} onToggle={() => toggleNote(n.id)} />)}
        </AnimatePresence>
      </div>

      {/* handled */}
      {done.length > 0 && (
        <div className="mt-5">
          <button onClick={() => setShowDone((s) => !s)}
            className="flex items-center gap-1.5 text-micro font-bold uppercase tracking-wider text-faint transition hover:text-ink">
            <Icon name={showDone ? 'chevron-down' : 'chevron'} size={12} /> {done.length} handled
          </button>
          <AnimatePresence initial={false}>
            {showDone && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mt-2 space-y-2 overflow-hidden">
                {done.map((n) => <NoteRow key={n.id} n={n} ret={ret} onToggle={() => toggleNote(n.id)} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function NoteRow({ n, ret, onToggle }) {
  const author = userById(n.authorId)
  const { caps } = useSession()
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
      <Card className={cx('flex gap-3 p-3.5', n.visibility === 'firm' && 'border-warn/30 bg-warn-soft/30', n.done && 'opacity-60')}>
        <button onClick={onToggle} title={n.done ? 'Reopen' : 'Mark handled'}
          className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition',
            n.done ? 'border-good bg-good-fill text-white' : 'border-line hover:border-accent')}>
          {n.done && <Icon name="check" size={12} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Avatar user={author} size={20} />
            <span className="text-meta font-semibold">{author?.name}</span>
            <span className="text-micro text-faint">{ROLES[n.role]?.label}</span>
            {n.visibility === 'firm' && <Tag tone="warn">🔒 Firm only</Tag>}
            <span className="ml-auto text-micro text-faint">{n.ts}</span>
          </div>

          <p className={cx('mt-1.5 whitespace-pre-wrap text-body leading-snug text-ink/90', n.done && 'line-through')}>{n.body}</p>

          {n.anchor && (
            <Link to={`/returns/${ret.id}?tab=${n.anchor.kind === 'document' ? 'documents&doc=' : 'review&field='}${n.anchor.id}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-bgtint/60 px-2.5 py-1 text-micro font-medium text-muted transition hover:border-accent/40 hover:text-accent">
              <Icon name={n.anchor.kind === 'document' ? 'doc' : 'grid'} size={11} /> {n.anchor.label}
              <Icon name="arrow-right" size={11} />
            </Link>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
