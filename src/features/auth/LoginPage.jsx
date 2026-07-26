// The front door.
// A real product starts with a sign-in, not a persona dropdown — and because
// this platform's whole premise is role-aware experience (Challenge 05), *who*
// you sign in as is the most important choice on this screen. So the demo
// accounts are given first-class treatment: pick one, see what you'd get, sign in.
//
// Auth is simulated: the email must match a seeded account, any password passes.
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { users } from '../../data/db'
import { ROLES } from '../../data/catalog'
import { useSession } from '../../context/SessionContext'
import { useAccess } from '../../context/AccessContext'
import { useTheme } from '../../context/ThemeContext'
import { CAPS } from '../../lib/roles'
import { Avatar, Btn, Icon, Tag, cx } from '../../components/ui'

export default function LoginPage({ intended }) {
  const { signIn } = useSession()
  const { rolesFor } = useAccess()
  const { isDark, toggle } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [picked, setPicked] = useState(null)
  const [busy, setBusy] = useState(false)

  const firm = useMemo(() => users.filter((u) => !CAPS[u.primary]?.isClient), [])
  const clients = useMemo(() => users.filter((u) => CAPS[u.primary]?.isClient), [])

  const choose = (u) => {
    setPicked(u.id)
    setEmail(u.email)
    setPassword('demo1234')
    setError('')
  }

  const submit = (e) => {
    e.preventDefault()
    setError('')
    const res = signIn(email, password)
    if (!res.ok) { setError(res.error); return }
    setBusy(true) // RequireAuth swaps this screen out on the next render
  }

  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- brand side ---------- */}
      <div className="relative hidden overflow-hidden bg-inverse px-12 py-14 text-inverse-fg lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-brand opacity-20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl2 bg-brand text-[16px] font-extrabold">V</span>
          <span className="font-display text-[19px] font-bold tracking-tight">Verity</span>
        </div>

        <div className="relative mt-auto max-w-md">
          <h1 className="font-display text-[34px] font-bold leading-[1.1] tracking-tight">
            Every number on your return,<br />
            <span className="grad-text">traceable back to its source.</span>
          </h1>
          <p className="mt-4 text-[14.5px] leading-relaxed text-inverse-fg/65">
            One platform for taxpayers and the firms that serve them — where the AI shows
            its work, and nobody has to take the software's word for it.
          </p>

          <TraceDemo />
        </div>

        <div className="relative mt-auto pt-10 text-micro text-inverse-fg/40">
          Prototype · fabricated data · no real returns are stored
        </div>
      </div>

      {/* ---------- sign-in side ---------- */}
      <div className="relative flex flex-col justify-center bg-bg px-6 py-10 sm:px-12">
        <button onClick={toggle} title="Toggle theme"
          className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface text-muted transition hover:text-ink">
          <Icon name={isDark ? 'sun' : 'moon'} size={15} />
        </button>

        <div className="mx-auto w-full max-w-[380px]">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-xl2 bg-brand text-[15px] font-extrabold text-white">V</span>
            <span className="font-display text-title font-bold">Verity</span>
          </div>

          <h2 className="mt-4 font-display text-display font-bold lg:mt-0">Sign in</h2>
          <p className="mt-1 text-body text-muted">
            {intended ? 'Sign in to open the link you followed.' : 'Welcome back. Pick up where you left off.'}
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <Field label="Email" value={email} onChange={(v) => { setEmail(v); setPicked(null) }}
              type="email" placeholder="you@example.com" autoComplete="username" />
            <Field label="Password" value={password} onChange={setPassword}
              type="password" placeholder="••••••••" autoComplete="current-password" />

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-meta text-danger">
                <Icon name="alert" size={14} className="mt-px shrink-0" /> {error}
              </div>
            )}

            <Btn type="submit" variant="brand" size="lg" disabled={busy} className="w-full">
              {busy ? 'Signing in…' : 'Sign in'} <Icon name="arrow-right" size={15} />
            </Btn>
            <p className="text-center text-micro text-faint">
              This is a prototype — <b className="font-semibold text-muted">any password works</b>.
            </p>
          </form>

          {/* ---------- demo accounts ---------- */}
          <div className="mt-7">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-micro font-bold uppercase tracking-wider text-faint">Demo accounts</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <p className="mt-2.5 text-micro text-muted">
              Six roles share one product. Choose an account to fill the form, then sign in.
            </p>

            <div className="mt-3 space-y-3">
              <Group title="Firm staff" icon="shield">
                {firm.map((u) => <AccountRow key={u.id} u={u} roles={rolesFor(u.id)} active={picked === u.id} onClick={() => choose(u)} />)}
              </Group>
              <Group title="Taxpayers" icon="user">
                {clients.map((u) => <AccountRow key={u.id} u={u} roles={rolesFor(u.id)} active={picked === u.id} onClick={() => choose(u)} />)}
              </Group>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, ...rest }) {
  return (
    <label className="block">
      <span className="mb-1 block text-meta font-semibold text-muted">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} {...rest}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-lead text-ink outline-none transition placeholder:text-faint focus:border-accent focus:shadow-glow" />
    </label>
  )
}

function Group({ title, icon, children }) {
  return (
    <div className="overflow-hidden rounded-xl2 border border-line bg-surface">
      <div className="flex items-center gap-1.5 border-b border-line2 bg-bgtint/60 px-3 py-1.5 text-micro font-bold uppercase tracking-wider text-faint">
        <Icon name={icon} size={12} /> {title}
      </div>
      <div className="divide-y divide-line2">{children}</div>
    </div>
  )
}

function AccountRow({ u, roles, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={cx('flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition', active ? 'bg-accent-soft' : 'hover:bg-slateSoft')}>
      <Avatar user={u} size={30} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-body font-semibold">{u.name}</span>
          {roles.length > 1 && <Tag tone="accent">{roles.length} roles</Tag>}
        </span>
        <span className="block truncate text-micro text-muted">{u.blurb}</span>
        <span className="mt-0.5 block truncate font-mono text-[10.5px] text-faint">{u.email}</span>
      </span>
      <span className="mt-0.5 shrink-0">
        {active
          ? <Icon name="check" size={15} className="text-accent" />
          : <span className="text-micro font-semibold text-faint">{ROLES[u.primary]?.short}</span>}
      </span>
    </button>
  )
}

// A small looping animation of the product's core promise: a figure on the
// return resolving back through its document, box and calculation.
function TraceDemo() {
  const steps = [
    { icon: 'doc', label: 'Form 1099-B' },
    { icon: 'compass', label: 'Box 1d' },
    { icon: 'wand', label: 'Proceeds − basis' },
    { icon: 'check', label: 'Line 7 · $6,110' },
  ]
  return (
    <div className="mt-9 flex flex-wrap items-center gap-x-2 gap-y-2">
      {steps.map((s, i) => (
        <motion.span key={s.label} className="flex items-center gap-2"
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + i * 0.28, duration: 0.4 }}>
          {i > 0 && <Icon name="arrow-right" size={13} className="text-inverse-fg/30" />}
          <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-micro backdrop-blur',
            s.icon === 'check'
              ? 'border-white/25 bg-white/15 font-semibold text-inverse-fg'
              : 'border-white/10 bg-white/5 text-inverse-fg/70')}>
            <Icon name={s.icon} size={12} />{s.label}
          </span>
        </motion.span>
      ))}
    </div>
  )
}
