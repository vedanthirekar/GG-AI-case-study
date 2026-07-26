// Contextual help. The `?` in the top bar opens this slide-over with guidance
// for the screen you're actually on — the fastest route from "I'm stuck here"
// to "oh, that's how this works" — with a door into the full help centre.
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { helpForPath, FAQ } from '../../data/help'
import { Icon, Btn } from '../../components/ui'

export default function HelpDrawer({ open, onClose }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const help = helpForPath(loc.pathname)
  const related = (help?.faq || []).map((id) => FAQ.find((f) => f.id === id)).filter(Boolean)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-40 bg-scrim/40" />
          <motion.aside initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="pane fixed right-0 top-0 z-50 flex h-full w-[min(92vw,380px)] flex-col overflow-auto border-l border-line bg-surface shadow-e3">
            <div className="sticky top-0 flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-soft text-accent"><Icon name="help" size={15} /></span>
              <span className="font-display text-body font-bold">On this screen</span>
              <button onClick={onClose} className="ml-auto text-faint transition hover:text-ink"><Icon name="x" size={16} /></button>
            </div>

            <div className="p-4">
              <div className="font-display text-lead font-bold">{help?.title}</div>
              <ul className="mt-2.5 space-y-2">
                {(help?.points || []).map((p, i) => (
                  <li key={i} className="flex gap-2 text-body leading-relaxed text-muted">
                    <Icon name="check" size={14} className="mt-0.5 shrink-0 text-accent" /> {p}
                  </li>
                ))}
              </ul>

              {related.length > 0 && (
                <>
                  <div className="mt-5 text-micro font-bold uppercase tracking-wider text-faint">Common questions</div>
                  <div className="mt-2 space-y-2">
                    {related.map((f) => (
                      <details key={f.id} className="rounded-xl2 border border-line bg-bgtint/40 px-3 py-2">
                        <summary className="cursor-pointer list-none text-body font-semibold marker:hidden">{f.q}</summary>
                        <p className="mt-1.5 text-meta leading-relaxed text-muted">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </>
              )}

              <Btn variant="default" className="mt-5 w-full" onClick={() => { onClose(); navigate('/help') }}>
                <Icon name="life-buoy" size={14} /> Open the full help centre
              </Btn>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
