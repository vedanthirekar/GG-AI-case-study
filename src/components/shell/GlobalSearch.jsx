// Global search (Challenges 04 & 09). Searches across returns, documents and
// clients in the mock db and deep-links straight to the object — one of the ways
// a user moves between connected objects without losing their place.
import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { returns, documents } from '../../data/db'
import { Icon, Tag } from '../ui'

export default function GlobalSearch() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); ref.current?.querySelector('input')?.focus() } }
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    const r = returns.filter((x) => x.clientName.toLowerCase().includes(term) || x.form.toLowerCase().includes(term))
      .slice(0, 5).map((x) => ({ kind: 'return', id: x.id, label: x.clientName, sub: `${x.form} · ${x.year}`, to: `/returns/${x.id}` }))
    const d = documents.filter((x) => x.name.toLowerCase().includes(term) || x.type.toLowerCase().includes(term))
      .slice(0, 5).map((x) => ({ kind: 'document', id: x.id, label: x.name, sub: x.type, to: `/returns/${x.returnId}?tab=documents&doc=${x.id}` }))
    return [...r, ...d].slice(0, 8)
  }, [q])

  const go = (to) => { setQ(''); setOpen(false); nav(to) }

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-md" ref={ref}>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2 text-faint focus-within:border-accent">
        <Icon name="search" size={16} />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
          placeholder="Search returns, documents, clients…"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint" />
        <kbd className="hidden rounded border border-line bg-surface px-1.5 text-[10px] text-faint sm:block">⌘K</kbd>
      </div>
      {open && q && (
        <div className="absolute z-40 mt-1.5 w-full animate-fade overflow-hidden rounded-xl2 border border-line bg-surface shadow-pop">
          {results.length === 0 ? (
            <div className="px-3 py-4 text-center text-[13px] text-muted">No matches for “{q}”.</div>
          ) : results.map((r) => (
            <button key={r.kind + r.id} onClick={() => go(r.to)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slateSoft">
              <Icon name={r.kind === 'return' ? 'folder' : 'doc'} size={16} className="text-faint" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{r.label}</span>
                <span className="block truncate text-[11px] text-muted">{r.sub}</span>
              </span>
              <Tag tone="muted">{r.kind}</Tag>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
