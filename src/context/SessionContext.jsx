// Session state: who is signed in, which of their roles is active (multi-role),
// and a small navigation history so "return to where I was" works across the
// connected workflow (Challenge 04).
//
// Auth is deliberately fake: the email must match a seeded account, and any
// non-empty password is accepted. What's real is the *consequence* of identity -
// roles resolve through AccessContext, so an administrator's grants change what
// this person can actually see and do. Purely in-memory.
import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { userById, userByEmail } from '../data/db'
import { useAccess } from './AccessContext'
import { capsFor, navFor, isFirmRole } from '../lib/roles'

const SessionCtx = createContext(null)

export function SessionProvider({ children }) {
  const { rolesFor } = useAccess()
  const [userId, setUserId] = useState(null)
  const [activeRole, setActiveRole] = useState(null)
  const [history, setHistory] = useState([]) // [{label, to}]
  // Counts sign-ins. The shell keys itself on this so every session starts on a
  // clean mount at its own front page, rather than inheriting the screen - and
  // the URL - the previous session left behind.
  const [sessionKey, setSessionKey] = useState(0)

  const user = userId ? userById(userId) : null
  const roles = userId ? rolesFor(userId) : []

  // If an admin revokes the role you're currently using, fall back rather than
  // leaving the shell in an impossible state.
  const effectiveRole = activeRole && roles.includes(activeRole) ? activeRole : roles[0] || null

  const enter = useCallback((id) => {
    const u = userById(id)
    if (!u) return false
    setUserId(id)
    const granted = rolesFor(id)
    setActiveRole(granted.includes(u.primary) ? u.primary : granted[0])
    setHistory([])
    setSessionKey((k) => k + 1)
    return true
  }, [rolesFor])

  // Any non-empty password works; an unknown email is the only failure mode.
  const signIn = useCallback((email, password) => {
    const u = userByEmail(email)
    if (!u) return { ok: false, error: 'We don’t recognise that email address.' }
    if (!password) return { ok: false, error: 'Enter your password to continue.' }
    enter(u.id)
    return { ok: true, user: u }
  }, [enter])

  const signOut = useCallback(() => { setUserId(null); setActiveRole(null); setHistory([]) }, [])

  // Note: there is deliberately no `switchUser`. Becoming a different person
  // mid-session was a demo affordance; changing identity now goes through the
  // sign-in screen, as it would in a real product.
  const switchRole = useCallback((role) => setActiveRole(role), [])

  const recordVisit = useCallback((label, to) => {
    setHistory((h) => {
      const last = h[h.length - 1]
      if (last && last.to === to) {
        // The route changes before the new screen publishes its breadcrumb, so
        // the first record for a path arrives carrying the *previous* screen's
        // label. Correct it when the real one lands - bailing out here is what
        // made "Back to..." name the wrong screen.
        return last.label === label ? h : [...h.slice(0, -1), { label, to }]
      }
      return [...h.filter((x) => x.to !== to), { label, to }].slice(-6)
    })
  }, [])

  const value = useMemo(() => ({
    user, userId, roles, sessionKey,
    signedIn: !!userId,
    activeRole: effectiveRole,
    caps: capsFor(effectiveRole),
    nav: navFor(effectiveRole),
    isFirm: isFirmRole(effectiveRole),
    signIn, signOut, switchRole,
    history, recordVisit,
  }), [user, userId, roles, sessionKey, effectiveRole, signIn, signOut, switchRole, history, recordVisit])

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}

export function useSession() {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
