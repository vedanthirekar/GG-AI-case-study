// The tour's visual layer: dims the app, spotlights the target element, and
// shows a coach card that drives navigation + the signed-in account for each step.
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTour } from './TourContext'
import { useSession } from '../../context/SessionContext'
import { Btn, Icon, cx } from '../../components/ui'

export default function TourOverlay() {
  const { active, step, index, total, next, prev, stop, isFirst, isLast, goto } = useTour()
  const navigate = useNavigate()
  const { switchUser } = useSession()
  const [rect, setRect] = useState(null)
  const applied = useRef(-1) // which step index we've already navigated for

  // drive the app for the current step: persona + route — exactly once per step
  useEffect(() => {
    if (!active || !step) { applied.current = -1; return }
    if (applied.current === index) return
    applied.current = index
    if (step.persona) switchUser(step.persona)
    navigate(step.to)

    // then locate the spotlight target once the route settles
    setRect(null)
    let tries = 0, timer
    const find = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`)
      if (el) {
        el.scrollIntoView({ block: 'nearest' })
        const r = el.getBoundingClientRect()
        setRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 })
      } else if (tries++ < 25) timer = setTimeout(find, 90)
    }
    const t = setTimeout(find, 260)
    return () => { clearTimeout(t); clearTimeout(timer) }
  }, [active, step, index, navigate, switchUser])

  // keyboard: →/← to move, esc to close
  useEffect(() => {
    if (!active) return
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') { isLast ? stop() : next() }
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'Escape') stop()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [active, isLast, next, prev, stop])

  if (!active || !step) return null

  const dim = 'rgb(var(--c-scrim) / .62)'
  return (
    <div className="fixed inset-0 z-[60]">
      {/* dim via 4 cheap panels around the target rect (no giant box-shadow) */}
      {rect ? (
        <>
          <div className="pointer-events-none absolute left-0 right-0 top-0" style={{ height: Math.max(0, rect.top), background: dim }} />
          <div className="pointer-events-none absolute left-0" style={{ top: rect.top, height: rect.height, width: Math.max(0, rect.left), background: dim }} />
          <div className="pointer-events-none absolute right-0" style={{ top: rect.top, height: rect.height, left: rect.left + rect.width, background: dim }} />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0" style={{ top: rect.top + rect.height, background: dim }} />
          <div className="pointer-events-none absolute rounded-xl2 ring-2 ring-ai transition-all"
            style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0" style={{ background: dim }} />
      )}

      {/* coach card */}
      <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto absolute bottom-6 left-1/2 w-[min(92vw,520px)] -translate-x-1/2">
        <div className="overflow-hidden rounded-xl3 border border-white/10 bg-inverse text-inverse-fg shadow-e3">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-[12px] font-extrabold">V</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold tracking-wide">{step.part}</span>
            <span className="truncate font-display text-[15px] font-semibold">{step.name}</span>
            <button onClick={stop} className="ml-auto text-white/50 hover:text-white"><Icon name="x" size={16} /></button>
          </div>
          <div className="px-5 py-4 text-[13.5px] leading-relaxed text-white/85">{step.body}</div>
          <div className="flex items-center gap-2 border-t border-white/10 px-5 py-3">
            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, k) => (
                <button key={k} onClick={() => goto(k)}
                  className={cx('h-1.5 rounded-full transition-all', k === index ? 'w-5 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/60')} />
              ))}
            </div>
            <span className="ml-1 text-[11px] text-white/50">{index + 1} / {total}</span>
            <div className="ml-auto flex gap-2">
              {!isFirst && <Btn variant="ghost" className="text-white/80 hover:bg-white/10" onClick={prev}>Back</Btn>}
              {isLast
                ? <Btn variant="brand" onClick={stop}>Finish <Icon name="check" size={14} /></Btn>
                : <Btn variant="brand" onClick={next}>Next <Icon name="arrow-right" size={14} /></Btn>}
            </div>
          </div>
        </div>
        <div className="mt-2 text-center text-[11px] text-white/60">Use ← → keys · Esc to exit</div>
      </motion.div>
    </div>
  )
}
