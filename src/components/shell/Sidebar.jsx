// The persistent left rail (Challenges 04 & 05).
// Navigation, the current role, and the account live here - which frees the top
// bar to be a single slim strip for orientation. The rail is the same component
// for all six roles; only its contents resolve differently.
import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROLES } from '../../data/catalog'
import { CAPS, SECONDARY_NAV, whyLocked } from '../../lib/roles'
import { useSession } from '../../context/SessionContext'
import { Avatar, Icon, Tooltip, cx } from '../ui'

export default function Sidebar({ collapsed, onToggle }) {
  const { nav, activeRole, caps, isFirm } = useSession()

  return (
    <aside className={cx('relative z-30 flex shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200',
      collapsed ? 'w-[68px]' : 'w-[236px]')}>
      {/* brand - and the way home, which is where people reach for a logo */}
      <Link to="/" title="Go to your home screen" aria-label="Vantage - go to your home screen"
        className={cx('flex h-14 shrink-0 items-center border-b border-line transition hover:bg-slateSoft',
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-4')}>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl2 bg-brand text-[15px] font-extrabold text-white shadow-brand">V</span>
        {!collapsed && <span className="font-display text-title font-bold tracking-tight">Vantage</span>}
      </Link>

      {/* which experience you're currently in */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <div className={cx('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-micro font-semibold',
            isFirm ? 'bg-accent-soft text-accent' : 'bg-good-soft text-good')}>
            <Icon name={isFirm ? 'shield' : 'user'} size={12} />
            {ROLES[activeRole]?.label}
          </div>
        </div>
      )}

      {/* primary nav */}
      <nav className={cx('flex-1 space-y-0.5 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
        {nav.map((n) => <NavItem key={n.to} item={n} collapsed={collapsed} />)}

        <div className={cx('!my-3 h-px bg-line2', collapsed ? 'mx-1' : 'mx-1')} />

        {SECONDARY_NAV
          .filter((n) => !n.firmOnly || isFirm)
          // A destination you can never open doesn't teach anyone anything.
          .filter((n) => !(n.hideWhenLocked && n.needs && !caps[n.needs]))
          .map((n) => (
          <NavItem key={n.to} item={n} collapsed={collapsed}
            locked={n.needs && !caps[n.needs]}
            lockReason={n.needs ? whyLocked(activeRole, n.needs) : ''} />
        ))}
      </nav>

      <AccountCard collapsed={collapsed} />

      {/* collapse handle */}
      <button onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}
        className="flex h-9 shrink-0 items-center justify-center gap-1.5 border-t border-line text-micro font-semibold text-faint transition hover:bg-slateSoft hover:text-ink">
        <Icon name={collapsed ? 'chevron' : 'chevron-left'} size={14} />
        {!collapsed && 'Collapse'}
      </button>
    </aside>
  )
}

function NavItem({ item, collapsed, locked, lockReason }) {
  const body = (
    <span className={cx('flex items-center rounded-lg text-body font-medium transition',
      collapsed ? 'h-9 w-full justify-center' : 'gap-2.5 px-3 py-2',
      locked && 'cursor-not-allowed text-faint')}>
      <Icon name={locked ? 'lock' : item.icon} size={16} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </span>
  )

  if (locked) {
    return (
      // Tooltip renders an inline-flex wrapper, so the block <div> is what keeps
      // the collapsed rail stacking vertically instead of flowing as a row, and
      // `w-full` on the tooltip is what lets the item fill the rail.
      <div className="cursor-not-allowed opacity-70">
        <Tooltip label={lockReason} side={collapsed ? 'right' : 'top'} className="w-full">
          <span className="block w-full">{body}</span>
        </Tooltip>
      </div>
    )
  }

  // `w-full` matters when collapsed: the tooltip wrapper is a flex container,
  // so this link is a flex item and would otherwise sit at content width -
  // leaving the icon left of centre with the active rule printed against it.
  // No-op when expanded, where the link is already a block in a block parent.
  //
  // Active state is a printed rule down the edge, not a filled pill.
  const link = (
    <NavLink to={item.to} data-tour={`nav-${item.to.replace(/\W/g, '')}`}
      className={({ isActive }) => cx('block w-full rounded-sm transition',
        isActive
          ? 'bg-accent-soft/70 text-accent shadow-[inset_2px_0_0_rgb(var(--c-accent))] [&_span]:text-accent'
          : 'text-muted hover:bg-slateSoft hover:text-ink')}>
      {body}
    </NavLink>
  )
  // Collapsed, the tooltip wrapper must fill the rail or the icon sits wherever
  // the shrink-wrapped link happens to land - left of centre, with the active
  // rule printed against the icon instead of the rail edge.
  return collapsed
    ? <div><Tooltip label={item.label} side="right" className="w-full">{link}</Tooltip></div>
    : link
}

// ---------------------------------------------------------------------------
// The account card: identity, the multi-role switch, and sign-out.
// This is where a firm employee who *also* has a personal return moves between
// their two experiences without changing accounts (Challenge 05).
//
// Switching *identity* is deliberately not here. Becoming a different person
// mid-session is a demo affordance, not a product one - no real platform lets
// you do it, and leaving it in taught the wrong thing about what this is. The
// demo accounts live on the sign-in screen, where changing who you are means
// signing out and signing back in, as it would anywhere else.
// ---------------------------------------------------------------------------
function AccountCard({ collapsed }) {
  const { user, roles, activeRole, switchRole, signOut } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const pickRole = (r) => { switchRole(r); setOpen(false); navigate(CAPS[r]?.isClient ? '/my-return' : '/dashboard') }

  return (
    <div className="relative shrink-0 border-t border-line p-2" ref={ref} data-tour="account">
      <button onClick={() => setOpen((o) => !o)}
        className={cx('flex w-full items-center rounded-lg p-1.5 text-left transition hover:bg-slateSoft',
          collapsed ? 'justify-center' : 'gap-2.5')}>
        <Avatar user={user} size={collapsed ? 30 : 32} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body font-semibold">{user?.name}</span>
              <span className="block truncate text-micro text-muted">{ROLES[activeRole]?.label}</span>
            </span>
            <Icon name="chevron-up" size={14} className="shrink-0 text-faint" />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.14 }}
            className="absolute bottom-full left-2 z-50 mb-1 w-[278px] overflow-hidden rounded-xl2 border border-line bg-surface shadow-e3">
            <div className="flex items-center gap-2.5 border-b border-line2 px-3 py-3">
              <Avatar user={user} size={34} />
              <div className="min-w-0">
                <div className="truncate text-body font-semibold">{user?.name}</div>
                <div className="truncate font-mono text-[10.5px] text-faint">{user?.email}</div>
              </div>
            </div>

            {/* The one switch that stays: not a different person, the same
                person's other hat. Dana prepares returns and files her own. */}
            {roles.length > 1 && (
              <div className="border-b border-line2 bg-accent-soft/60 p-2.5">
                <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                  You hold {roles.length} roles
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  {roles.map((r) => (
                    <button key={r} onClick={() => pickRole(r)}
                      className={cx('flex-1 rounded-lg border px-2 py-1.5 text-micro font-semibold transition',
                        activeRole === r ? 'border-accent bg-surface text-accent' : 'border-line bg-surface/60 text-muted hover:text-ink')}>
                      {ROLES[r]?.short}
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 px-1 text-[10.5px] leading-snug text-muted">
                  Same login, two experiences - your firm work and your own return.
                </div>
              </div>
            )}

            <div className="p-1.5">
              <Row icon="life-buoy" label="Help & guides" onClick={() => { setOpen(false); navigate('/help') }} />
              <div className="my-1 h-px bg-line2" />
              {/* Land on "/" before clearing the session, so the address bar
                  behind the sign-in screen isn't still pointing deep into the
                  last person's work. Where the *next* session starts no longer
                  depends on this - RequireAuth decides that - but leaving a
                  stale path in the URL is its own small leak. */}
              <Row icon="logout" label="Sign out" danger
                onClick={() => { setOpen(false); navigate('/', { replace: true }); signOut() }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick}
      className={cx('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-body font-medium transition hover:bg-slateSoft',
        danger ? 'text-danger' : 'text-muted hover:text-ink')}>
      <Icon name={icon} size={15} /> <span className="flex-1 text-left">{label}</span>
    </button>
  )
}
