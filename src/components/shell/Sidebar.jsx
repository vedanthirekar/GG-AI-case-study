// The persistent left rail (Challenges 04 & 05).
// Navigation, the current role, and the account live here — which frees the top
// bar to be a single slim strip for orientation. The rail is the same component
// for all six roles; only its contents resolve differently.
import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { users } from '../../data/db'
import { ROLES } from '../../data/catalog'
import { CAPS, SECONDARY_NAV, whyLocked } from '../../lib/roles'
import { useSession } from '../../context/SessionContext'
import { useAccess } from '../../context/AccessContext'
import { useTheme } from '../../context/ThemeContext'
import { Avatar, Icon, Tag, Tooltip, cx } from '../ui'

export default function Sidebar({ collapsed, onToggle }) {
  const { nav, activeRole, caps, isFirm } = useSession()

  return (
    <aside className={cx('relative z-30 flex shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200',
      collapsed ? 'w-[68px]' : 'w-[236px]')}>
      {/* brand */}
      <div className={cx('flex h-14 shrink-0 items-center border-b border-line', collapsed ? 'justify-center px-2' : 'gap-2.5 px-4')}>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl2 bg-brand text-[15px] font-extrabold text-white shadow-brand">V</span>
        {!collapsed && <span className="font-display text-title font-bold tracking-tight">Verity</span>}
      </div>

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

        {SECONDARY_NAV.filter((n) => !n.firmOnly || isFirm).map((n) => (
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
      // the collapsed rail stacking vertically instead of flowing as a row.
      <div className="cursor-not-allowed opacity-70">
        <Tooltip label={lockReason} side={collapsed ? 'right' : 'top'}>
          <span className="block w-full">{body}</span>
        </Tooltip>
      </div>
    )
  }

  const link = (
    <NavLink to={item.to} data-tour={`nav-${item.to.replace(/\W/g, '')}`}
      className={({ isActive }) => cx('block rounded-lg transition',
        isActive ? 'bg-accent-soft text-accent [&_span]:text-accent' : 'text-muted hover:bg-slateSoft hover:text-ink')}>
      {body}
    </NavLink>
  )
  return collapsed ? <div><Tooltip label={item.label} side="right">{link}</Tooltip></div> : link
}

// ---------------------------------------------------------------------------
// The account card: identity, the multi-role switch, theme, and sign-out.
// This is where a firm employee who *also* has a personal return moves between
// their two experiences without changing accounts (Challenge 05).
// ---------------------------------------------------------------------------
function AccountCard({ collapsed }) {
  const { user, roles, activeRole, switchRole, switchUser, signOut } = useSession()
  const { rolesFor } = useAccess()
  const { isDark, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSwapping(false) } }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const goHome = (role) => navigate(CAPS[role]?.isClient ? '/home' : '/dashboard')

  const pickRole = (r) => { switchRole(r); setOpen(false); navigate(CAPS[r]?.isClient ? '/my-return' : '/dashboard') }
  const pickUser = (id) => {
    switchUser(id)
    setOpen(false); setSwapping(false)
    const u = users.find((x) => x.id === id)
    goHome(rolesFor(id).includes(u.primary) ? u.primary : rolesFor(id)[0])
  }

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
            {!swapping ? (
              <>
                <div className="flex items-center gap-2.5 border-b border-line2 px-3 py-3">
                  <Avatar user={user} size={34} />
                  <div className="min-w-0">
                    <div className="truncate text-body font-semibold">{user?.name}</div>
                    <div className="truncate font-mono text-[10.5px] text-faint">{user?.email}</div>
                  </div>
                </div>

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
                      Same login, two experiences — your firm work and your own return.
                    </div>
                  </div>
                )}

                <div className="p-1.5">
                  <Row icon={isDark ? 'sun' : 'moon'} label={isDark ? 'Light theme' : 'Dark theme'} onClick={toggle} />
                  <Row icon="life-buoy" label="Help & guides" onClick={() => { setOpen(false); navigate('/help') }} />
                  <Row icon="switch" label="Switch demo account" onClick={() => setSwapping(true)} chevron />
                  <div className="my-1 h-px bg-line2" />
                  <Row icon="logout" label="Sign out" danger onClick={() => { setOpen(false); signOut() }} />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 border-b border-line2 px-3 py-2.5">
                  <button onClick={() => setSwapping(false)} className="text-faint transition hover:text-ink"><Icon name="back" size={15} /></button>
                  <span className="text-body font-semibold">Switch demo account</span>
                </div>
                <div className="max-h-[300px] overflow-auto p-1.5">
                  {users.map((u) => (
                    <button key={u.id} onClick={() => pickUser(u.id)}
                      className={cx('flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-slateSoft',
                        u.id === user?.id && 'bg-accent-soft')}>
                      <Avatar user={u} size={28} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body font-semibold">{u.name}</span>
                        <span className="block truncate text-micro text-muted">{u.title}</span>
                      </span>
                      {rolesFor(u.id).length > 1 && <Tag tone="accent">{rolesFor(u.id).length}</Tag>}
                      {u.id === user?.id && <Icon name="check" size={14} className="text-accent" />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-line2 px-3 py-2 text-[10.5px] leading-snug text-faint">
                  A shortcut for exploring. Signing out returns you to the real login.
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ icon, label, onClick, danger, chevron }) {
  return (
    <button onClick={onClick}
      className={cx('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-body font-medium transition hover:bg-slateSoft',
        danger ? 'text-danger' : 'text-muted hover:text-ink')}>
      <Icon name={icon} size={15} /> <span className="flex-1 text-left">{label}</span>
      {chevron && <Icon name="chevron" size={13} className="text-faint" />}
    </button>
  )
}
