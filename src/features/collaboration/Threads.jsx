// Client & CPA collaboration (Challenge 02).
// Conversations are anchored to a specific document, field or issue — never a
// generic inbox. Internal firm notes are visually distinct AND hidden from
// clients (permission, not just styling). Every thread shows who owns the next
// action, and outstanding requests are tracked explicitly.
import { useState } from 'react'
import { threadsForReturn, userById } from '../../data/db'
import { useSession } from '../../context/SessionContext'
import { useStore } from '../../context/StoreContext'
import { Card, Tag, Icon, Avatar, Btn, cx } from '../../components/ui'

const STATUS = {
  open: { label: 'Open', tone: 'accent' },
  resolved: { label: 'Resolved', tone: 'good' },
  'waiting-client': { label: 'Waiting on client', tone: 'warn' },
  'waiting-firm': { label: 'Waiting on firm', tone: 'ai' },
}

export default function Threads({ ret, selectedThreadId, onSelect }) {
  const { activeRole, caps, user } = useSession()
  const all = threadsForReturn(ret.id)
  // clients never see internal-only threads that have no client-visible message
  const visible = all.filter((t) => caps.seeInternalNotes || t.messages.some((m) => !m.internal))
  const active = visible.find((t) => t.id === selectedThreadId) || visible[0]

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[280px_1fr]">
      {/* thread list */}
      <div className="pane overflow-auto border-r border-line bg-surface">
        <div className="sticky top-0 border-b border-line2 bg-surface px-4 py-3 text-[13px] font-bold">Conversations</div>
        {visible.map((t) => {
          const s = STATUS[t.status]
          return (
            <button key={t.id} onClick={() => onSelect(t.id)}
              className={cx('w-full border-b border-line2 px-4 py-3 text-left hover:bg-slateSoft', t.id === active?.id && 'bg-accent-soft')}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-semibold">{t.subject}</span>
                <Tag tone={s.tone}>{s.label}</Tag>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                <ContextIcon type={t.contextType} /><span className="truncate">{t.contextLabel}</span>
              </div>
              {t.request && !t.request.fulfilled && (
                <div className="mt-1 text-[11px] font-medium text-warn">● Outstanding request</div>
              )}
            </button>
          )
        })}
        {visible.length === 0 && <div className="p-4 text-[13px] text-muted">No conversations you can see here.</div>}
      </div>

      {/* active thread */}
      <div className="pane overflow-auto bg-bg/40">
        {active ? <ThreadView key={active.id} thread={active} ret={ret} /> : <div className="p-8 text-center text-muted">Select a conversation.</div>}
      </div>
    </div>
  )
}

function ThreadView({ thread, ret }) {
  const { caps, activeRole, user } = useSession()
  const { fulfillRequest, isFulfilled } = useStore()
  const [internal, setInternal] = useState(false)
  const [draft, setDraft] = useState('')
  const [msgs, setMsgs] = useState(thread.messages)
  const owner = userById(thread.ownerUserId)

  const fulfilled = thread.request ? (thread.request.fulfilled || isFulfilled(thread.id)) : false
  // once a request is fulfilled, the ball flips back to the firm
  const status = fulfilled && thread.status === 'waiting-client' ? 'waiting-firm' : thread.status
  const s = STATUS[status]
  const canPostInternal = caps.seeInternalNotes

  const shown = msgs.filter((m) => caps.seeInternalNotes || !m.internal)

  const send = () => {
    if (!draft.trim()) return
    setMsgs((m) => [...m, { authorId: user.id, role: activeRole, ts: new Date().toISOString().slice(0, 16).replace('T', ' '), internal, body: draft.trim() }])
    setDraft('')
  }

  return (
    <div className="mx-auto max-w-2xl p-5">
      {/* context header — what this is attached to */}
      <Card className="mb-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[15px] font-bold">{thread.subject}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
              <ContextIcon type={thread.contextType} />
              Attached to <span className="font-medium text-ink">{thread.contextLabel}</span>
            </div>
          </div>
          <Tag tone={s.tone} dot>{s.label}</Tag>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slateSoft px-3 py-2 text-[12px]">
          <Icon name="user" size={13} className="text-faint" />
          Next action owned by <span className="font-semibold">{owner?.name}</span>
          <span className="text-faint">({thread.ownerRole})</span>
        </div>
        {thread.request && (
          <div className={cx('mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]', fulfilled ? 'bg-good-soft text-good' : 'bg-warn-soft text-warn')}>
            <Icon name={fulfilled ? 'check' : 'clock'} size={13} />
            <span className="flex-1"><b>Request:</b> {thread.request.what}{!fulfilled && ` · due ${thread.request.due}`}</span>
            {/* the client (the owner of the ask) can fulfill it right here */}
            {!fulfilled && caps.isClient && (
              <Btn size="sm" variant="good" onClick={() => { fulfillRequest(thread.id); setMsgs((m) => [...m, { authorId: user.id, role: activeRole, ts: nowStamp(), internal: false, body: `Uploaded: ${thread.request.what}. ✓` }]) }}>
                <Icon name="upload" size={13} /> Provide it
              </Btn>
            )}
            {fulfilled && <Tag tone="good">Provided</Tag>}
          </div>
        )}
      </Card>

      {/* messages */}
      <div className="space-y-2.5">
        {shown.map((m, i) => <Message key={i} m={m} />)}
      </div>

      {/* composer */}
      {!caps.isClient ? (
        <Card className="mt-4 p-3" data-tour="thread-composer">
          {canPostInternal ? (
            <div className="mb-2 flex w-max items-center gap-1.5 rounded-lg bg-slateSoft p-0.5 text-[12px] font-semibold">
              <button onClick={() => setInternal(false)} className={cx('rounded-md px-3 py-1', !internal ? 'bg-surface text-accent shadow-soft' : 'text-muted')}>Message to client</button>
              <button onClick={() => setInternal(true)} className={cx('rounded-md px-3 py-1', internal ? 'bg-warn-soft text-warn' : 'text-muted')}>Internal note</button>
            </div>
          ) : (
            <div className="mb-2 text-[11px] font-medium text-faint">Seasonal staff can message the client, but internal notes are limited to preparers and reviewers.</div>
          )}
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
            placeholder={internal ? 'Internal note — not visible to the client…' : 'Write to the client…'}
            className={cx('w-full resize-none rounded-lg border p-2.5 text-[13px] outline-none focus:border-accent', internal ? 'border-warn/40 bg-warn-soft/40' : 'border-line bg-surface')} />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-faint">{internal ? '🔒 Only firm staff will see this.' : '👁 The client will see this.'}</span>
            <Btn variant="primary" onClick={send}><Icon name="arrow-right" size={13} /> Send</Btn>
          </div>
        </Card>
      ) : (
        <Card className="mt-4 p-3" data-tour="thread-composer">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder="Reply to your preparer…"
            className="w-full resize-none rounded-lg border border-line bg-surface p-2.5 text-[13px] outline-none focus:border-accent" />
          <div className="mt-2 flex justify-end"><Btn variant="primary" onClick={send}><Icon name="arrow-right" size={13} /> Send</Btn></div>
        </Card>
      )}
    </div>
  )
}

function Message({ m }) {
  const author = userById(m.authorId)
  return (
    <div className={cx('rounded-xl2 border p-3', m.internal ? 'border-warn/30 bg-warn-soft/40' : 'border-line bg-surface')}>
      <div className="flex items-center gap-2">
        <Avatar user={author} size={24} />
        <span className="text-[12.5px] font-semibold">{author?.name}</span>
        <span className="text-[11px] text-faint">{author?.title}</span>
        {m.internal && <Tag tone="warn">🔒 Internal note</Tag>}
        <span className="ml-auto text-[11px] text-faint">{m.ts}</span>
      </div>
      <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-snug text-ink/90">{m.body}</p>
    </div>
  )
}

function ContextIcon({ type }) {
  const name = type === 'document' ? 'doc' : type === 'field' ? 'grid' : 'link'
  return <Icon name={name} size={12} className="text-faint" />
}

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}
