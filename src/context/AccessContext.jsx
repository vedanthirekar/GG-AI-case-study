// ============================================================================
// Role access control (Challenge 05).
// The mock db ships each person with a starting set of roles; from then on this
// store is the authority. A firm administrator grants and revokes here, and
// because SessionContext resolves a user's roles through this store, the change
// is real: sign in as that person and the navigation, permissions and language
// have actually changed.
// In-memory only - no backend, no persistence.
// ============================================================================
import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { users } from '../data/db'
import { CAPS } from '../lib/roles'

const AccessCtx = createContext(null)

// Roles an administrator can hand out. Client roles are tied to *being* a
// taxpayer in the system, so they're shown but not grantable to firm staff.
export const GRANTABLE = ['preparer', 'reviewer', 'admin', 'seasonal']

const seed = () => Object.fromEntries(users.map((u) => [u.id, [...u.roles]]))

export function AccessProvider({ children }) {
  const [grants, setGrants] = useState(seed)
  const [audit, setAudit] = useState([])

  const rolesFor = useCallback((userId) => grants[userId] || [], [grants])

  const hasRole = useCallback((userId, role) => (grants[userId] || []).includes(role), [grants])

  const log = useCallback((entry) => setAudit((a) => [{ ...entry, at: Date.now() }, ...a].slice(0, 20)), [])

  // Returns { ok, reason } so the UI can explain a refusal instead of silently
  // doing nothing - same "communicate the permission" principle as lib/roles.
  const setRole = useCallback((userId, role, on, actor) => {
    const current = grants[userId] || []
    if (on && current.includes(role)) return { ok: true }
    if (!on && !current.includes(role)) return { ok: true }
    if (!on && current.length === 1) {
      return { ok: false, reason: 'Everyone needs at least one role - assign another before removing this one.' }
    }
    if (!on && CAPS[role]?.isClient) {
      return { ok: false, reason: 'A taxpayer role comes from having a return in the system; it isn’t revoked here.' }
    }
    const next = on ? [...current, role] : current.filter((r) => r !== role)
    setGrants((g) => ({ ...g, [userId]: next }))
    log({ actorId: actor?.id, actorName: actor?.name || 'Someone', userId, role, action: on ? 'granted' : 'revoked' })
    return { ok: true }
  }, [grants, log])

  const value = useMemo(() => ({ grants, rolesFor, hasRole, setRole, audit }),
    [grants, rolesFor, hasRole, setRole, audit])

  return <AccessCtx.Provider value={value}>{children}</AccessCtx.Provider>
}

export function useAccess() {
  const ctx = useContext(AccessCtx)
  if (!ctx) throw new Error('useAccess must be used within AccessProvider')
  return ctx
}
