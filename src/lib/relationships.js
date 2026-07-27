// ============================================================================
// Relationship graph (Challenge 04 - navigation that preserves context).
// The connections between objects are derived from IDs already present in the
// mock data (a field points to a source doc; a thread points to a field or doc;
// a task belongs to a return). relatedTo() returns everything connected to a
// given object so the "Related" panel can let a user jump without losing place.
// ============================================================================
import {
  returnById, docById, threadById, docsForReturn, tasksForReturn,
  threadsForReturn, fieldById,
} from '../data/db'

// Each related item: { kind, id, label, sub, to }  (to = route path)
export function relatedTo(node) {
  if (!node) return []
  const items = []
  const push = (kind, id, label, sub, to) => items.push({ kind, id, label, sub, to })

  if (node.kind === 'field') {
    const ret = returnById(node.returnId)
    const f = fieldById(node.returnId, node.id)
    if (f?.sourceDocId) {
      const d = docById(f.sourceDocId)
      if (d) push('document', d.id, d.name, `Source · ${f.sourceLocation || ''}`, `/returns/${node.returnId}?tab=documents&doc=${d.id}`)
    }
    // threads that discuss this field
    threadsForReturn(node.returnId)
      .filter((t) => t.contextType === 'field' && t.contextId === node.id)
      .forEach((t) => push('thread', t.id, t.subject, statusText(t), `/returns/${node.returnId}?tab=messages&thread=${t.id}`))
    if (ret) push('return', ret.id, `${ret.clientName} · ${ret.form}`, 'Parent return', `/returns/${ret.id}`)
  }

  if (node.kind === 'document') {
    const ret = returnById(node.returnId)
    // fields sourced from this doc
    ;(ret?.fields || [])
      .filter((f) => f.sourceDocId === node.id)
      .forEach((f) => push('field', f.id, `Line ${f.line} · ${f.label}`, `$${f.amount.toLocaleString()}`, `/returns/${node.returnId}?tab=review&field=${f.id}`))
    threadsForReturn(node.returnId)
      .filter((t) => t.contextType === 'document' && t.contextId === node.id)
      .forEach((t) => push('thread', t.id, t.subject, statusText(t), `/returns/${node.returnId}?tab=messages&thread=${t.id}`))
    if (ret) push('return', ret.id, `${ret.clientName} · ${ret.form}`, 'Parent return', `/returns/${ret.id}`)
  }

  if (node.kind === 'thread') {
    const t = threadById(node.id)
    const ret = returnById(t.returnId)
    if (t.contextType === 'field') {
      const f = fieldById(t.returnId, t.contextId)
      if (f) push('field', f.id, `Line ${f.line} · ${f.label}`, 'Discussed here', `/returns/${t.returnId}?tab=review&field=${f.id}`)
    }
    if (t.contextType === 'document') {
      const d = docById(t.contextId)
      if (d) push('document', d.id, d.name, 'Discussed here', `/returns/${t.returnId}?tab=documents&doc=${d.id}`)
    }
    if (ret) push('return', ret.id, `${ret.clientName} · ${ret.form}`, 'Parent return', `/returns/${ret.id}`)
  }

  if (node.kind === 'return') {
    const docs = docsForReturn(node.id)
    const tks = tasksForReturn(node.id)
    const ths = threadsForReturn(node.id)
    if (docs.length) push('group', 'docs', `${docs.length} documents`, 'Source documents', `/returns/${node.id}?tab=documents`)
    if (tks.length) push('group', 'tasks', `${tks.filter((t) => t.status === 'open').length} open tasks`, 'Work items', `/returns/${node.id}?tab=review`)
    if (ths.length) push('group', 'threads', `${ths.length} conversations`, 'Messages', `/returns/${node.id}?tab=messages`)
  }

  return items
}

function statusText(t) {
  return {
    open: 'Open',
    resolved: 'Resolved',
    'waiting-client': 'Waiting on client',
    'waiting-firm': 'Waiting on firm',
  }[t.status] || t.status
}

export const KIND_ICON = {
  field: '🔢', document: '📄', thread: '💬', return: '📁', task: '✓', group: '📂',
}
