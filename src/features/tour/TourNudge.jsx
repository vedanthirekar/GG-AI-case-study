// A one-time offer of the tour, the first time someone lands in a role.
//
// Not an auto-starting tour: a product that seizes the screen before you've
// looked at anything teaches you to dismiss things. This asks once, says how
// long it is and what it covers for *this* role, and takes no for an answer -
// permanently, for that role, for the session.
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTour } from './TourContext'
import { useSession } from '../../context/SessionContext'
import { ROLES } from '../../data/catalog'
import { Btn, Icon } from '../../components/ui'

export default function TourNudge() {
  const { nudge, dismissNudge, start, total } = useTour()
  const { activeRole } = useSession()
  const loc = useLocation()

  // If someone has already started navigating, they're oriented enough - the
  // offer shouldn't trail them from screen to screen.
  useEffect(() => { if (nudge) dismissNudge() }, [loc.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const role = ROLES[activeRole]?.label.toLowerCase() || 'this role'

  return (
    <AnimatePresence>
      {nudge && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          role="status"
          className="fixed right-5 top-[72px] z-40 w-[min(92vw,320px)] rounded-xl2 border border-accent/35 bg-surface p-4 shadow-e3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-sm border border-accent/40 text-accent">
              <Icon name="route" size={13} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-lead font-bold">First time here?</div>
              <p className="mt-1 text-body leading-relaxed text-muted">
                A {total}-step walk through your work as {role} - running on your own records,
                not a canned demo.
              </p>
            </div>
            <button onClick={dismissNudge} aria-label="Dismiss"
              className="shrink-0 text-faint transition hover:text-ink">
              <Icon name="x" size={15} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Btn variant="primary" size="sm" onClick={start}>
              Show me around <Icon name="arrow-right" size={12} />
            </Btn>
            <Btn variant="ghost" size="sm" onClick={dismissNudge}>Not now</Btn>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
