// "Related" rail (Challenge 04). Given the object a user is currently looking at,
// it shows every connected object (source doc ↔ field ↔ thread ↔ return) and lets
// them jump across the workflow - then get back - without losing context.
import { Link } from 'react-router-dom'
import { relatedTo, KIND_ICON } from '../../lib/relationships'
import { Icon } from '../ui'

export default function RelatedObjectsPanel({ node, onNavigate }) {
  const items = node ? relatedTo(node) : []
  if (!node) return null
  return (
    <div className="animate-fade">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-faint">
        <Icon name="link" size={12} /> Related to this {node.kind}
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line px-3 py-3 text-[12px] text-muted">No linked objects.</div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i}>
              <Link to={it.to} onClick={onNavigate}
                className="group flex items-center gap-2.5 rounded-lg border border-line2 bg-surface px-2.5 py-2 hover:border-accent/40 hover:bg-accent-soft/50">
                <span className="text-base leading-none">{KIND_ICON[it.kind] || '•'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-ink">{it.label}</span>
                  <span className="block truncate text-[11px] text-muted">{it.sub}</span>
                </span>
                <Icon name="arrow-right" size={13} className="text-faint opacity-0 transition group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
