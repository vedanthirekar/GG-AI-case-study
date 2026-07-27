// Help, in two halves, behind one affordance.
//
// "On this screen" is the curated answer to the questions everyone asks about
// where they are. "Ask Vantage" is the answer to the question only this person
// has. They share a drawer because they're the same job - a second floating
// widget in the corner would just make someone choose between two help buttons
// before they've been helped.
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { helpForPath, FAQ } from '../../data/help'
import { useAssistant } from '../../context/AssistantContext'
import { Icon, Btn, cx } from '../../components/ui'
import AssistantChat from '../assistant/AssistantChat'

export default function HelpDrawer({ open, onClose, tab = 'screen', prefill = '', onTabChange }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const { live } = useAssistant()
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
            className="fixed right-0 top-0 z-50 flex h-full w-[min(92vw,400px)] flex-col overflow-hidden border-l border-line bg-surface shadow-e3">
            <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-3">
              <span className="grid h-7 w-7 place-items-center rounded-sm border border-accent/40 text-accent"><Icon name="help" size={15} /></span>
              <span className="font-display text-body font-bold">Help</span>
              <button onClick={onClose} className="ml-auto text-faint transition hover:text-ink"><Icon name="x" size={16} /></button>
            </div>

            <div className="flex shrink-0 border-b border-line">
              <Tab active={tab === 'screen'} onClick={() => onTabChange?.('screen')} icon="compass" label="On this screen" />
              <Tab active={tab === 'ask'} onClick={() => onTabChange?.('ask')} icon="sparkle" label="Ask Vantage"
                badge={live ? 'AI' : null} />
            </div>

            {tab === 'screen' ? (
              <div className="pane min-h-0 flex-1 overflow-y-auto p-4">
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

                {/* the door from curated to conversational - for the question
                    the page's three bullet points don't happen to answer */}
                <button onClick={() => onTabChange?.('ask')}
                  className="mt-5 flex w-full items-start gap-2 rounded-xl2 border border-ai/30 bg-ai-soft/40 px-3 py-2.5 text-left transition hover:border-ai/60">
                  <Icon name="sparkle" size={14} className="mt-0.5 shrink-0 text-ai" />
                  <span>
                    <span className="block text-body font-semibold text-ai">Ask something specific</span>
                    <span className="block text-meta leading-snug text-muted">
                      Vantage Assist can see your role and what’s on this screen.
                    </span>
                  </span>
                </button>

                <Btn variant="default" className="mt-2.5 w-full" onClick={() => { onClose(); navigate('/help') }}>
                  <Icon name="life-buoy" size={14} /> Open the full help centre
                </Btn>
              </div>
            ) : (
              <AssistantChat prefill={prefill} onNavigate={onClose} />
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function Tab({ active, onClick, icon, label, badge }) {
  return (
    <button onClick={onClick}
      className={cx('flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-meta font-semibold transition',
        active ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink')}>
      <Icon name={icon} size={13} /> {label}
      {badge && <span className="rounded-sm border border-ai/40 px-1 text-[9px] font-bold text-ai">{badge}</span>}
    </button>
  )
}
