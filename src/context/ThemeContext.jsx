// Light / dark theming. Flips a `.dark` class on <html>; every colour token in
// index.css re-resolves from there, so no component needs a theme-aware branch.
// In-memory only — same no-persistence stance as the rest of the prototype.
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

const ThemeCtx = createContext(null)

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system') // 'light' | 'dark' | 'system'
  const resolved = theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  // follow the OS while in `system` mode
  useEffect(() => {
    if (theme !== 'system' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = () => document.documentElement.classList.toggle('dark', mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [theme])

  const toggle = useCallback(() => setTheme(resolved === 'dark' ? 'light' : 'dark'), [resolved])

  const value = useMemo(() => ({ theme, resolved, setTheme, toggle, isDark: resolved === 'dark' }),
    [theme, resolved, toggle])

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
