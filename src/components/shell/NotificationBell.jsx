// Activity centre.
// Deliberately not a firehose: items are filtered to the current audience (firm
// vs. taxpayer, and for taxpayers, to that person), and every one of them is a
// link back into the exact object it's about — the same context-preserving rule
// the rest of the navigation follows (Challenge 04).
import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../context/StoreContext'
import { useSession } from '../../context/SessionContext'
import { Icon, Btn, EmptyState, cx } from '../ui'

const KIND = {
  message: { icon: 'chat', tone: 'text-accent bg-accent-soft' },
  request: { icon: 'clock', tone: 'text-warn bg-warn-soft' },
  doc: { icon: 'doc', tone: 'text-good bg-good-soft' },
  flag: { icon: 'sparkle', tone: 'text-ai bg-ai-soft' },
  note: { icon: 'note', tone: 'text-accent bg-accent-soft' },
  status: { icon: 'route', tone: 'text-good bg-good-soft' },
  approval: { icon: 'check-double', tone: 'text-accent bg-accent-soft' },
}

export default function NotificationBell() {
  const { activity, markAllRead, isRead } = useStore()
  const { isFirm, userId } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const mine = useMemo(() => activity.filter((a) => {
    if (a.audience === 'firm') return isFirm
    if (a.audience === 'client') return !isFirm && (!a.userId || a.userId === userId)
    return true
  }), [activity, isFirm, userId])

  const unread = mine.filter((a) => !isRead(a.id)).length

  const go = (a) => { setOpen(false); markAllRead(); navigate(a.to) }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} title="Activity" data-tour="bell"
        className="relative grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-slateSoft hover:text-ink">
        <Icon name="bell" size={17} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-danger-fill px-1 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 z-50 mt-1.5 w-[340px] overflow-hidden rounded-xl2 border border-line bg-surface shadow-e3">
            <div className="flex items-center justify-between border-b border-line2 px-3.5 py-2.5">
              <span className="font-display text-body font-bold">Activity</span>
              {unread > 0 && <button onClick={markAllRead} className="text-micro font-semibold text-accent hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-[380px] overflow-auto">
              {mine.length === 0 && <EmptyState icon="bell" title="Nothing new" body="You're all caught up." />}
              {mine.map((a) => {
                const k = KIND[a.kind] || KIND.message
                return (
                  <button key={a.id} onClick={() => go(a)}
                    className={cx('flex w-full items-start gap-2.5 border-b border-line2 px-3.5 py-2.5 text-left transition last:border-0 hover:bg-slateSoft',
                      !isRead(a.id) && 'bg-accent-soft/35')}>
                    <span className={cx('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg', k.tone)}>
                      <Icon name={k.icon} size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold">{a.title}</span>
                      <span className="block truncate text-micro text-muted">{a.sub}</span>
                    </span>
                    <span className="shrink-0 text-[10.5px] text-faint">{a.at}</span>
                  </button>
                )
              })}
            </div>
            <div className="border-t border-line2 bg-bgtint/50 px-3.5 py-2 text-[10.5px] text-faint">
              Every item links straight to what it's about.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
