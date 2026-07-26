// Session state: who is signed in, which of their roles is active (multi-role),
// and a small navigation history so "return to where I was" works across the
// connected workflow (Challenge 04).
//
// Auth is deliberately fake: the email must match a seeded account, and any
// non-empty password is accepted. What's real is the *consequence* of identity —
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

  // Fast path used by the account menu and the guided tour — skips the form.
  const switchUser = useCallback((id) => { enter(id) }, [enter])

  const switchRole = useCallback((role) => setActiveRole(role), [])

  const recordVisit = useCallback((label, to) => {
    setHistory((h) => {
      if (h.length && h[h.length - 1].to === to) return h
      return [...h.filter((x) => x.to !== to), { label, to }].slice(-6)
    })
  }, [])

  const value = useMemo(() => ({
    user, userId, roles,
    signedIn: !!userId,
    activeRole: effectiveRole,
    caps: capsFor(effectiveRole),
    nav: navFor(effectiveRole),
    isFirm: isFirmRole(effectiveRole),
    signIn, signOut, switchUser, switchRole,
    history, recordVisit,
  }), [user, userId, roles, effectiveRole, signIn, signOut, switchUser, switchRole, history, recordVisit])

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}

export function useSession() {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
