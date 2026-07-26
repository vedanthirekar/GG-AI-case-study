// Lets feature pages feed the shell: breadcrumbs (Challenge 04 orientation) and
// the "related node" that powers the Related rail. Pages call useChrome() in an
// effect to publish their context; the shell renders it.
import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const ChromeCtx = createContext(null)

export function ChromeProvider({ children }) {
  const [crumbs, setCrumbs] = useState([])
  const [related, setRelated] = useState(null)

  const publish = useCallback(({ crumbs, related }) => {
    if (crumbs) setCrumbs(crumbs)
    setRelated(related ?? null)
  }, [])

  const value = useMemo(() => ({ crumbs, related, publish }), [crumbs, related, publish])
  return <ChromeCtx.Provider value={value}>{children}</ChromeCtx.Provider>
}

export function useChrome() {
  const ctx = useContext(ChromeCtx)
  if (!ctx) throw new Error('useChrome must be used within ChromeProvider')
  return ctx
}
