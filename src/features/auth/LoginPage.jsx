// The front door.
// A real product starts with a sign-in, not a persona picker. Because this
// platform's premise is role-aware experience (Challenge 05), *who* you sign in
// as decides everything you see afterwards - but that's a fact about the
// product, not a reason to turn the login into a roster. The demo identities
// are collapsed into one dropdown below the form: available in a click for
// anyone evaluating this, invisible to the shape of the screen otherwise.
//
// Auth is simulated: the email must match a seeded account, any password passes.
import { useState, useMemo } from 'react'
import { users } from '../../data/db'
import { ROLES } from '../../data/catalog'
import { useSession } from '../../context/SessionContext'
import { useAccess } from '../../context/AccessContext'
import { CAPS } from '../../lib/roles'
import { Avatar, Btn, Icon, Tag } from '../../components/ui'

export default function LoginPage({ intended }) {
  const { signIn } = useSession()
  const { rolesFor } = useAccess()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [picked, setPicked] = useState(null)
  const [busy, setBusy] = useState(false)

  const firm = useMemo(() => users.filter((u) => !CAPS[u.primary]?.isClient), [])
  const clients = useMemo(() => users.filter((u) => CAPS[u.primary]?.isClient), [])
  const chosen = useMemo(() => users.find((u) => u.id === picked) || null, [picked])

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
          <span className="font-display text-[19px] font-bold tracking-tight">Vantage</span>
        </div>

        <div className="relative mt-auto max-w-md">
          <h1 className="font-display text-[50px] font-bold leading-[1.15] tracking-tight">
            We do taxes and everything around it.
          </h1>
          <p className="mt-4 text-[22px] leading-relaxed text-inverse-fg/65">
            {/* Individual and Business Returns.  */}
            <p className="mt-4 text-[17px] leading-relaxed text-inverse-fg/65">
            ·  Document intake  ·  Preparation  ·  Review  ·  Filing
            </p>
          </p>
        </div>

        <div className="relative mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-10 text-micro text-inverse-fg/40">
          <span>© {new Date().getFullYear()} Vantage Tax, Inc.</span>
          <span aria-hidden="true">·</span>
          <span>Terms of Service</span>
          <span aria-hidden="true">·</span>
          <span>Privacy</span>
          <span aria-hidden="true">·</span>
          <span>Security</span>
        </div>
      </div>

      {/* ---------- sign-in side ---------- */}
      <div className="relative flex flex-col justify-center bg-bg px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-[380px]">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-xl2 bg-brand text-[15px] font-extrabold text-white">V</span>
            <span className="font-display text-title font-bold">Vantage</span>
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
          </form>

          {/* ---------- demo accounts ----------
              A single collapsed control rather than a browsable roster. The
              sign-in screen should look like a sign-in screen; the seven demo
              identities matter for evaluating this, but they are scaffolding,
              not product, and shouldn't dominate the front door. */}
          <div className="mt-7">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-micro font-bold uppercase tracking-wider text-faint">Demo</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <label className="mt-3 block">
              <span className="mb-1 block text-meta font-semibold text-muted">Use a demo account</span>
              <div className="relative">
                <select
                  value={picked || ''}
                  onChange={(e) => {
                    const u = users.find((x) => x.id === e.target.value)
                    if (u) choose(u)
                  }}
                  className="w-full appearance-none rounded-lg border border-line bg-surface px-3 py-2.5 pr-9 text-body font-medium text-ink outline-none transition focus:border-accent focus:shadow-glow">
                  <option value="">Choose an account…</option>
                  <optgroup label="Firm staff">
                    {firm.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} - {ROLES[u.primary]?.label}
                        {rolesFor(u.id).length > 1 ? ` (${rolesFor(u.id).length} roles)` : ''}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Taxpayers">
                    {clients.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} - {ROLES[u.primary]?.label}</option>
                    ))}
                  </optgroup>
                </select>
                <Icon name="chevron-down" size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
              </div>
            </label>

            {/* what you just picked, so the choice isn't blind */}
            {chosen ? (
              <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent-soft/50 px-3 py-2.5">
                <Avatar user={chosen} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold">{chosen.name}</span>
                  <span className="block text-micro leading-snug text-muted">{chosen.blurb}</span>
                </span>
                {rolesFor(chosen.id).length > 1 && <Tag tone="accent">{rolesFor(chosen.id).length} roles</Tag>}
              </div>
            ) : (
              <p className="mt-2 text-micro leading-snug text-faint">
                {/* Six roles share one product - the whole surface resolves from who you sign in as.
                Picking one fills the form; any password works. */}
              </p>
            )}
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
