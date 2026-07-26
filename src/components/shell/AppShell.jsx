// The single shell every screen lives inside (Challenges 04 & 05).
// A persistent left rail carries navigation, role and account; one slim top bar
// carries orientation (breadcrumbs, back, search) and the always-available
// tools (activity, help, tour). Same chrome for all six roles — only the
// contents resolve differently, which is what keeps this one product.
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../../context/SessionContext'
import { useChrome } from '../../context/ChromeContext'
import { useTheme } from '../../context/ThemeContext'
import { useTour } from '../../features/tour/TourContext'
import { Icon, Tooltip, cx } from '../ui'
import { ROLES } from '../../data/catalog'
import Sidebar from './Sidebar'
import GlobalSearch from './GlobalSearch'
import RelatedObjectsPanel from './RelatedObjectsPanel'
import NotificationBell from './NotificationBell'
import HelpDrawer from '../../features/help/HelpDrawer'
import TourOverlay from '../../features/tour/TourOverlay'

export default function AppShell() {
  const { crumbs, related } = useChrome()
  const { history, recordVisit, activeRole } = useSession()
  const { isDark, toggle } = useTheme()
  const { start, total: tourSteps } = useTour()
  const loc = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (crumbs?.length) recordVisit(crumbs[crumbs.length - 1].label, loc.pathname + loc.search)
  }, [crumbs, loc.pathname, loc.search, recordVisit])

  // A brief simulated load on route change — the product feels like it's
  // fetching something rather than teleporting. Purely cosmetic.
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 260)
    return () => clearTimeout(t)
  }, [loc.pathname])

  // `?` opens contextual help from anywhere that isn't a text field.
  useEffect(() => {
    const h = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return
      if (e.key === '?') { e.preventDefault(); setHelpOpen((o) => !o) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const prev = history.length > 1 ? history[history.length - 2] : null

  return (
    <div className="flex h-full overflow-x-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* one slim bar: where you are, plus the always-on tools */}
        <header className="glass relative z-20 flex h-[52px] shrink-0 items-center gap-3 border-b border-line bg-surface/85 px-4">
          <Breadcrumbs crumbs={crumbs} />

          {prev && (
            <button onClick={() => navigate(prev.to)}
              className="hidden shrink-0 items-center gap-1 rounded-lg border border-line px-2 py-1 text-meta font-medium text-muted transition hover:bg-slateSoft hover:text-ink lg:flex">
              <Icon name="back" size={13} /> Back to {prev.label}
            </button>
          )}

          <div className="ml-auto flex items-center gap-1">
            <GlobalSearch />
            {/* the tour is assembled for the signed-in role, so say so */}
            {tourSteps > 0 && (
              <Tooltip label={`A ${tourSteps}-step tour of your work as ${ROLES[activeRole]?.label.toLowerCase()}`} side="bottom-end">
                <button onClick={start} data-tour="tour-btn"
                  className="hidden items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-2.5 py-1.5 text-meta font-semibold text-accent transition hover:bg-accent-fill hover:text-white sm:flex">
                  <Icon name="route" size={14} /> Show me around
                </button>
              </Tooltip>
            )}
            <NotificationBell />
            <Tooltip label="Help for this screen  ·  ?" side="bottom-end">
              <button onClick={() => setHelpOpen(true)} data-tour="help-btn"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-slateSoft hover:text-ink">
                <Icon name="help" size={17} />
              </button>
            </Tooltip>
            <Tooltip label={isDark ? 'Light theme' : 'Dark theme'} side="bottom-end">
              <button onClick={toggle} data-tour="theme-btn"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-slateSoft hover:text-ink">
                <Icon name={isDark ? 'sun' : 'moon'} size={16} />
              </button>
            </Tooltip>
          </div>

          {/* route-change progress hairline */}
          <AnimatePresence>
            {loading && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
                <span className="block h-full w-1/3 animate-barslide bg-brand" />
              </motion.span>
            )}
          </AnimatePresence>
        </header>

        {/* content + related rail */}
        <div className="flex min-h-0 flex-1">
          <main className="pane min-w-0 flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              {/* exit is instant: with mode="wait" any exit duration shows as a
                  blank frame between routes, which reads as a flicker */}
              <motion.div key={loc.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0 } }} transition={{ duration: 0.16 }} className="h-full">
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
          {related && (
            <aside data-tour="related-rail" className="pane hidden w-72 shrink-0 overflow-auto border-l border-line bg-bgtint/40 p-4 xl:block">
              <RelatedObjectsPanel node={related} />
            </aside>
          )}
        </div>
      </div>

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
      <TourOverlay />
    </div>
  )
}

function Breadcrumbs({ crumbs }) {
  if (!crumbs?.length) return <div className="text-body text-faint">—</div>
  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-body">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1
        return (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <Icon name="chevron" size={12} className="shrink-0 text-faint" />}
            {last || !c.to
              ? <span className="truncate font-semibold text-ink">{c.label}</span>
              : <Link to={c.to} className="truncate text-muted transition hover:text-accent">{c.label}</Link>}
          </span>
        )
      })}
    </nav>
  )
}
