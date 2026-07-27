// People & access (Challenge 05).
// The role architecture is only credible if somebody actually controls it. This
// is the administrator's view of who holds which role - and the toggles are
// real: they write to AccessContext, which SessionContext resolves roles
// against, so signing in as that person genuinely gives them the new
// navigation, permissions and wording.
//
// The permission descriptions are generated from CAPS in lib/roles.js, the same
// map the rest of the app enforces against - one source of truth, so this screen
// can't drift from what the product actually does.
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { users, userById } from '../../data/db'
import { ROLES } from '../../data/catalog'
import { CAPS } from '../../lib/roles'
import { GRANTABLE, useAccess } from '../../context/AccessContext'
import { useSession } from '../../context/SessionContext'
import { useChrome } from '../../context/ChromeContext'
import PageHeader from '../../components/shell/PageHeader'
import { Card, Avatar, Btn, Icon, Tag, Tooltip, cx } from '../../components/ui'

// Plain-language consequence of each capability, so an administrator is never
// guessing what a checkbox actually does.
const CAP_TEXT = {
  editFields: 'Change figures on a return',
  verifyFields: 'Mark figures verified against their source',
  approveFile: 'Approve a return for filing',
  seeInternalNotes: 'Read and write internal firm notes',
  seeAllReturns: 'See every client in the firm',
  manageFirm: 'Manage people and access',
}

export default function AccessManager() {
  const { rolesFor, setRole, audit } = useAccess()
  const { user } = useSession()
  const { publish } = useChrome()
  const [focus, setFocus] = useState('preparer')
  const [notice, setNotice] = useState(null)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => { publish({ crumbs: [{ label: 'People & access' }] }) }, [publish])

  const staff = useMemo(() => users.filter((u) => rolesFor(u.id).some((r) => !CAPS[r]?.isClient)), [rolesFor])
  const clients = useMemo(() => users.filter((u) => !rolesFor(u.id).some((r) => !CAPS[r]?.isClient)), [rolesFor])

  const flash = (msg, tone = 'good') => { setNotice({ msg, tone }); setTimeout(() => setNotice(null), 4200) }

  const apply = (u, role, on) => {
    const res = setRole(u.id, role, on, user)
    if (!res.ok) { flash(res.reason, 'danger'); return }
    flash(on
      ? `${u.name} can now act as ${ROLES[role].label.toLowerCase()}. It takes effect on their next screen.`
      : `Removed ${ROLES[role].label.toLowerCase()} from ${u.name}.`)
  }

  // Granting sign-off authority is the one change worth a second look.
  const request = (u, role, on) => {
    if (on && role === 'reviewer') { setConfirm({ u, role }); return }
    apply(u, role, on)
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <PageHeader eyebrow="Administration" icon="users" title="People & access"
        subtitle="Who works here, and what each of them is allowed to do."
        actions={<Btn variant="default"><Icon name="plus" size={14} /> Invite someone</Btn>} />

      <AnimatePresence>
        {notice && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cx('mt-4 flex items-start gap-2 rounded-xl2 border px-4 py-2.5 text-body',
              notice.tone === 'good' ? 'border-good/30 bg-good-soft text-good' : 'border-danger/30 bg-danger-soft text-danger')}>
            <Icon name={notice.tone === 'good' ? 'check' : 'alert'} size={15} className="mt-0.5 shrink-0" />
            {notice.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* ---- the matrix ---- */}
        <div>
          <Card className="overflow-hidden" data-tour="access-matrix">
            <div className="grid grid-cols-[1fr_repeat(4,60px)] items-center gap-1 border-b border-line2 bg-bgtint/50 px-4 py-2.5">
              <span className="text-micro font-bold uppercase tracking-wider text-faint">Firm staff</span>
              {GRANTABLE.map((r) => (
                <button key={r} onClick={() => setFocus(r)}
                  className={cx('rounded px-1 py-0.5 text-center text-[10px] font-bold uppercase tracking-wide transition',
                    focus === r ? 'bg-accent-soft text-accent' : 'text-faint hover:text-ink')}>
                  {ROLES[r].short}
                </button>
              ))}
            </div>

            <div className="divide-y divide-line2">
              {staff.map((u) => {
                const roles = rolesFor(u.id)
                return (
                  <div key={u.id} className="grid grid-cols-[1fr_repeat(4,60px)] items-center gap-1 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar user={u} size={30} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-body font-semibold">{u.name}</span>
                          {roles.length > 1 && <Tag tone="accent">{roles.length} roles</Tag>}
                          {u.id === user?.id && <Tag tone="muted">you</Tag>}
                        </div>
                        <div className="truncate font-mono text-[10.5px] text-faint">{u.email}</div>
                      </div>
                    </div>
                    {GRANTABLE.map((r) => (
                      <div key={r} className="grid place-items-center">
                        <Check on={roles.includes(r)} dim={focus !== r} onClick={() => request(u, r, !roles.includes(r))} />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* taxpayers, for completeness - their role comes from having a return */}
            <div className="border-t border-line bg-bgtint/50 px-4 py-2.5 text-micro font-bold uppercase tracking-wider text-faint">
              Taxpayers
            </div>
            <div className="divide-y divide-line2">
              {clients.map((u) => (
                <div key={u.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <Avatar user={u} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body font-semibold">{u.name}</div>
                    <div className="truncate font-mono text-[10.5px] text-faint">{u.email}</div>
                  </div>
                  <Tooltip label="A taxpayer role comes from having a return in the system - it isn’t granted here.">
                    <span className="flex items-center gap-1.5 text-micro font-semibold text-faint">
                      <Icon name="lock" size={12} /> {ROLES[rolesFor(u.id)[0]]?.label}
                    </span>
                  </Tooltip>
                </div>
              ))}
            </div>
          </Card>

          <p className="mt-2 flex items-start gap-1.5 text-micro text-faint">
            <Icon name="shield" size={12} className="mt-0.5 shrink-0" />
            Everyone keeps at least one role - the last one can’t be removed. Changes apply immediately;
            switch to that person in your account menu to see it.
          </p>

          {/* audit trail */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-1.5 text-micro font-bold uppercase tracking-wider text-faint">
              <Icon name="history" size={12} /> Recent changes
            </div>
            <Card className="divide-y divide-line2">
              {audit.length === 0 && <div className="px-4 py-3 text-body text-muted">No access changes yet this session.</div>}
              {audit.map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 text-body">
                  <Icon name={a.action === 'granted' ? 'unlock' : 'lock'} size={14}
                    className={a.action === 'granted' ? 'text-good' : 'text-warn'} />
                  <span className="flex-1">
                    <b className="font-semibold">{a.actorName}</b> {a.action} <b className="font-semibold">{ROLES[a.role]?.label.toLowerCase()}</b> to{' '}
                    <b className="font-semibold">{userById(a.userId)?.name}</b>
                  </span>
                  <span className="shrink-0 text-micro text-faint">just now</span>
                </div>
              ))}
            </Card>
          </div>
        </div>

        {/* ---- what the focused role means ---- */}
        <div>
          <Card className="sticky top-4 p-4">
            <div className="text-micro font-bold uppercase tracking-wider text-faint">What this role can do</div>
            <div className="mt-1.5 font-display text-lead font-bold">{ROLES[focus].label}</div>
            <p className="mt-1 text-body leading-relaxed text-muted">{CAPS[focus].label}</p>

            <div className="mt-3 space-y-1.5">
              {Object.keys(CAP_TEXT).map((cap) => {
                const on = !!CAPS[focus][cap]
                return (
                  <div key={cap} className={cx('flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-body',
                    on ? 'bg-good-soft/60 text-ink' : 'bg-slateSoft text-faint')}>
                    <Icon name={on ? 'check' : 'x'} size={13} className={on ? 'text-good' : 'text-faint'} />
                    <span className={cx(!on && 'line-through')}>{CAP_TEXT[cap]}</span>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 flex gap-1">
              {GRANTABLE.map((r) => (
                <button key={r} onClick={() => setFocus(r)}
                  className={cx('flex-1 rounded-lg border px-1.5 py-1 text-micro font-semibold transition',
                    focus === r ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:text-ink')}>
                  {ROLES[r].short}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl2 border border-accent/25 bg-accent-soft/50 p-3 text-meta leading-relaxed text-muted">
              <b className="font-semibold text-accent">Try it:</b> give Jordan Lee the reviewer role, then
              switch to their account. The approve action unlocks and internal notes appear - the same
              shell, a different set of permissions.
            </div>
          </Card>
        </div>
      </div>

      {/* confirmation for sign-off authority */}
      <AnimatePresence>
        {confirm && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-scrim/50 p-4" onClick={() => setConfirm(null)}>
            <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[min(94vw,420px)] rounded-xl3 border border-line bg-surface p-5 shadow-e3">
              <div className="flex items-center gap-2 text-warn">
                <Icon name="alert" size={18} /> <span className="font-display text-lead font-bold">Grant sign-off authority?</span>
              </div>
              <p className="mt-2 text-body leading-relaxed text-muted">
                A reviewer can approve returns for filing - the last check before a return leaves the firm.
                Give this to <b className="font-semibold text-ink">{confirm.u.name}</b>?
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancel</Btn>
                <Btn variant="primary" onClick={() => { apply(confirm.u, confirm.role, true); setConfirm(null) }}>
                  <Icon name="check" size={14} /> Grant reviewer
                </Btn>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Check({ on, dim, onClick }) {
  return (
    <button onClick={onClick}
      className={cx('grid h-6 w-6 place-items-center rounded-md border-2 transition',
        on ? 'border-accent bg-accent-fill text-white' : 'border-line hover:border-accent',
        dim && !on && 'opacity-45')}>
      {on && <Icon name="check" size={13} />}
    </button>
  )
}
