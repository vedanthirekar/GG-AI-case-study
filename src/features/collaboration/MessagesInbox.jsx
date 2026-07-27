// Cross-return message inbox (Challenge 02).
// A single place to triage conversations that need YOU - grouped by who owns the
// next action - while every item still deep-links back to its contextual thread
// inside the return (so it never becomes "just another generic inbox").
import { useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { threads, returnById, userById } from '../../data/db'
import { useSession } from '../../context/SessionContext'
import { useChrome } from '../../context/ChromeContext'
import { Card, Tag, Icon, cx } from '../../components/ui'

const STATUS = {
  open: { label: 'Open', tone: 'accent' },
  resolved: { label: 'Resolved', tone: 'good' },
  'waiting-client': { label: 'Waiting on client', tone: 'warn' },
  'waiting-firm': { label: 'Waiting on firm', tone: 'ai' },
}

export default function MessagesInbox() {
  const { caps, user, userId, isFirm } = useSession()
  const { publish } = useChrome()
  useEffect(() => { publish({ crumbs: [{ label: 'Messages' }] }) }, [publish])

  // clients see only their own return's threads that have a client-visible message
  const scoped = useMemo(() => threads.filter((t) => {
    const ret = returnById(t.returnId)
    if (caps.isClient) return ret?.clientId === userId && t.messages.some((m) => !m.internal)
    return true
  }), [caps.isClient, userId])

  const needsYou = scoped.filter((t) => isFirm ? t.ownerRole === 'firm' : t.ownerRole === 'client')
  const waiting = scoped.filter((t) => !(isFirm ? t.ownerRole === 'firm' : t.ownerRole === 'client'))

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-accent">Messages</div>
      <h1 className="mt-0.5 text-xl font-bold tracking-tight">Conversations</h1>
      <p className="text-[13px] text-muted">Every thread is tied to a document or a specific line - click through to its context.</p>

      <Section title={`Needs you (${needsYou.length})`} tone="warn" items={needsYou} />
      <Section title={`Waiting on others (${waiting.length})`} tone="muted" items={waiting} />
    </div>
  )
}

function Section({ title, items }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{title}</div>
      <Card className="divide-y divide-line2 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-4 py-6 text-body text-muted">
            <Icon name="check" size={15} className="text-good" /> Nothing waiting here.
          </div>
        ) :
          items.map((t) => {
            const ret = returnById(t.returnId)
            const s = STATUS[t.status]
            const owner = userById(t.ownerUserId)
            return (
              <Link key={t.id} to={`/returns/${t.returnId}?tab=messages&thread=${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slateSoft">
                <Icon name="chat" size={16} className="text-faint" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-semibold">{t.subject}</span>
                    {t.request && !t.request.fulfilled && <Tag tone="warn">Request open</Tag>}
                  </div>
                  <div className="text-[12px] text-muted">{ret?.clientName} · {t.contextLabel}</div>
                </div>
                <div className="text-right">
                  <Tag tone={s.tone}>{s.label}</Tag>
                  <div className="mt-0.5 text-[11px] text-faint">{owner?.name}</div>
                </div>
              </Link>
            )
          })}
      </Card>
    </div>
  )
}
