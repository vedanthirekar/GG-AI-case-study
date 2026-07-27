// ============================================================================
// The assistant's grounding layer.
//
// Three jobs:
//   1. buildSystemBrief()  - what Vantage IS, compiled from the app's own source
//      of truth rather than restated in prose, so the assistant can't drift.
//   2. buildLiveContext()  - who you are, where you are, and what your data
//      currently says. This is what makes it an assistant rather than a chatbot
//      with a manual pasted into it.
//   3. parseAnswer() + validateRoute() - turning the reply into UI, and
//      refusing any link the model invented or isn't allowed to offer.
//
// A note on permissions, because it matters more than it looks: the assistant
// is not *asked* to keep firm-only content from clients. The context builder
// only ever reads what the signed-in session is already entitled to, so that
// content is never in the prompt to leak. An instruction is a request; an
// absent fact is a guarantee.
// ============================================================================
import { IDENTITY, PRODUCT, STYLE } from '../data/assistantBrief'
import { FAQ, GUIDES, START_HERE, PAGE_HELP, helpForPath, forAudience } from '../data/help'
import { STAGES, ROLES, FIELD_STATES } from '../data/catalog'
import { CAPS, NAV, SECONDARY_NAV, whyLocked } from './roles'
import { rankTasks, summarize, daysUntil } from './prioritize'
import {
  returnById, returnsForClient, tasks as allTasks, docsForReturn,
  threadsForReturn, userById,
} from '../data/db'

// ---------------------------------------------------------------------------
// 1 · The static brief
// ---------------------------------------------------------------------------

const money = (n) => (n == null ? '-' : `$${Math.abs(n).toLocaleString()}${n < 0 ? ' (owed)' : ''}`)

// Every route the app actually serves, from the table in src/App.jsx. `needs`
// names a capability; `client`/`firm` limit a route to one side of the product.
const ROUTES = [
  { path: '/dashboard', side: 'firm', desc: 'Ranked queue of everything open' },
  { path: '/returns', side: 'firm', desc: 'All returns' },
  { path: '/returns/:rid', side: 'both', desc: 'One return - add ?tab=review|documents|messages|notes|status, and &field=<id> to select a line' },
  { path: '/documents', side: 'firm', desc: 'Clients - the document library, opened by client (the nav calls this "Clients"). Its search reaches every document firm-wide' },
  { path: '/documents/:rid', side: 'firm', desc: 'One client’s documents (rid is the return id, e.g. r-rivera)' },
  { path: '/messages', side: 'both', desc: 'Threaded conversations' },
  { path: '/home', side: 'client', desc: 'Taxpayer home - the single next action' },
  { path: '/my-return', side: 'client', desc: 'Jumps to the signed-in taxpayer’s own return' },
  { path: '/my-documents', side: 'client', desc: 'The taxpayer’s own documents' },
  { path: '/help', side: 'both', desc: 'Help centre' },
  { path: '/help/:section', side: 'both', desc: 'section = start | faq | guides | interaction-system | support' },
  { path: '/people', side: 'firm', needs: 'manageFirm', desc: 'Role grants - administrators only' },
]

function routesFor(isFirm, caps) {
  return ROUTES.filter((r) => (r.side === 'both' || r.side === (isFirm ? 'firm' : 'client')))
    .filter((r) => !r.needs || caps?.[r.needs])
}

// The brief is identical for everyone on the same side of the product, so it's
// memoised - it's the large half of the prompt and rebuilding it per keystroke
// would be waste.
const briefCache = new Map()

export function buildSystemBrief({ isFirm, caps }) {
  const cacheKey = `${isFirm}|${caps?.manageFirm ? 'admin' : 'std'}`
  if (briefCache.has(cacheKey)) return briefCache.get(cacheKey)

  const audience = isFirm ? 'firm' : 'client'

  const stages = STAGES.map((s, i) =>
    `${i + 1}. ${isFirm ? s.staffLabel : s.clientLabel} - ${s.desc}` +
    (isFirm ? `  (the client sees this as “${s.clientLabel}”)` : '')).join('\n')

  const states = Object.values(FIELD_STATES).map((s) =>
    `- ${s.label}: ${s.desc}${s.editable ? '' : ' Not editable.'}`).join('\n')

  // The permission matrix, generated from the map the app enforces against -
  // the same anti-drift trick the People & access screen uses for its copy.
  const roleLines = Object.entries(CAPS).map(([key, c]) => {
    const can = ['editFields', 'verifyFields', 'approveFile', 'seeInternalNotes', 'manageFirm', 'seeAllReturns']
      .filter((k) => c[k])
    return `- ${ROLES[key]?.label || key}: ${c.label} Can: ${can.length ? can.join(', ') : 'view only'}.`
  }).join('\n')

  // Why a given action is locked, in the exact words the tooltips use.
  const locks = ['verifyFields', 'approveFile', 'seeInternalNotes', 'manageFirm']
    .flatMap((cap) => Object.keys(CAPS)
      .filter((role) => !CAPS[role][cap])
      .map((role) => `- ${ROLES[role]?.label} / ${cap}: ${whyLocked(role, cap)}`))
    .join('\n')

  const routes = routesFor(isFirm, caps).map((r) => `- ${r.path} - ${r.desc}`).join('\n')

  const nav = (isFirm ? NAV.firm : NAV.client).map((n) => `${n.label} (${n.to})`).join(', ')
  const secondary = SECONDARY_NAV.filter((n) => !n.firmOnly || isFirm)
    .map((n) => `${n.label} (${n.to})`).join(', ')

  const startHere = START_HERE[audience]
    .map((s, i) => `${i + 1}. ${s.title} - ${s.body} → ${s.to}`).join('\n')

  const faqs = forAudience(FAQ, isFirm)
    .map((f) => `[${f.id}] (${f.cat}) Q: ${f.q}\n    A: ${f.a}`).join('\n')

  const guides = forAudience(GUIDES, isFirm)
    .map((g) => `[${g.id}] ${g.title}: ${g.body}`).join('\n')

  const pageHelp = PAGE_HELP
    .map((p) => `- ${p.match} (${p.title}): ${p.points.join(' ')}`).join('\n')

  const brief = [
    IDENTITY,
    PRODUCT,
    `## The six stages of a return, in order\n${stages}`,
    `## The six states a figure can be in\n${states}`,
    `## Roles and what each can do\n${roleLines}`,
    `## Why an action is locked, by role - use this exact reasoning\n${locks}`,
    `## ROUTES you may link to (nothing else exists)\n${routes}\n\nThis person's navigation: ${nav}. Also: ${secondary}.`,
    `## Where this audience should start\n${startHere}`,
    `## Per-screen guidance\n${pageHelp}`,
    `## HELP CONTENT - cite these ids in SOURCES when you use them\n${guides}\n${faqs}`,
    STYLE,
  ].join('\n\n---\n\n')

  briefCache.set(cacheKey, brief)
  return brief
}

// ---------------------------------------------------------------------------
// 2 · Live context
// ---------------------------------------------------------------------------

/**
 * A snapshot of what this session can see right now. Everything here is read
 * through the same entitlement rules the UI uses - nothing is added because
 * "the model probably won't repeat it".
 */
export function buildLiveContext({ session, store, location, crumbs }) {
  const { user, activeRole, caps, isFirm, roles } = session
  const path = location.pathname
  const params = new URLSearchParams(location.search)
  const out = []

  out.push(`Signed in: ${user?.name} - ${ROLES[activeRole]?.label}.` +
    (roles.length > 1 ? ` This person holds ${roles.length} roles (${roles.map((r) => ROLES[r]?.short).join(', ')}) and can switch between them from the account menu at the foot of the sidebar.` : ''))

  const can = Object.entries(caps).filter(([k, v]) => v === true && k !== 'isClient').map(([k]) => k)
  const cannot = ['editFields', 'verifyFields', 'approveFile', 'seeInternalNotes', 'manageFirm', 'seeAllReturns']
    .filter((k) => !caps[k])
  out.push(`Their permissions right now - can: ${can.join(', ') || 'view only'}.` +
    (cannot.length ? ` Cannot: ${cannot.join(', ')}.` : ''))

  // Locked nav is the subtle one. These items are *visible* to this person -
  // that's the "communicate, don't hide" rule - but they can't open them. Left
  // implicit, an answer happily tells someone to go somewhere they can't.
  const lockedNav = SECONDARY_NAV
    .filter((n) => (!n.firmOnly || isFirm) && n.needs && !caps[n.needs])
    .map((n) => `${n.label} (${n.to}) - visible in their sidebar but locked: ${whyLocked(activeRole, n.needs)}`)
  if (lockedNav.length) {
    out.push(`Locked for them - do NOT tell them to open these, and never link them:\n` +
      lockedNav.map((l) => `- ${l}`).join('\n'))
  }

  out.push(`Current screen: ${path}${location.search || ''}` +
    (crumbs?.length ? ` - breadcrumb "${crumbs.map((c) => c.label).join(' › ')}"` : '') +
    `. Screen help: ${helpForPath(path)?.title || 'unknown'}.`)

  // -- the return in front of them ------------------------------------------
  const rid = path.startsWith('/returns/') ? path.split('/')[2] : null
  const openReturn = rid ? visibleReturn(rid, session) : null
  if (rid && !openReturn) {
    out.push(`They are on return ${rid}, which is not one they're entitled to see. Don't discuss its contents.`)
  }
  if (openReturn) out.push(describeReturn(openReturn, session, store, params))

  // -- a taxpayer's own return, wherever they are ---------------------------
  if (!isFirm && !openReturn) {
    const mine = returnsForClient(user?.id)[0]
    if (mine) out.push(describeReturn(mine, session, store, null, 'Their own return'))
  }

  // -- a firm user's ranked queue ------------------------------------------
  if (isFirm) out.push(describeQueue(session))

  return out.filter(Boolean).join('\n\n')
}

// A client may only ever see their own return. Seasonal staff see only what
// they're assigned. Both rules already govern the UI; they govern the prompt too.
function visibleReturn(rid, { user, caps, isFirm }) {
  const ret = returnById(rid)
  if (!ret) return null
  if (!isFirm) return ret.clientId === user?.id ? ret : null
  if (!caps.seeAllReturns) {
    const assigned = allTasks.some((t) => t.returnId === rid && t.assigneeId === user?.id)
    return assigned || ret.preparerId === user?.id ? ret : null
  }
  return ret
}

function describeReturn(ret, session, store, params, heading = 'The return on screen') {
  const { caps, isFirm } = session
  const live = store.summary(ret.id)
  const stage = STAGES.find((s) => s.key === ret.stage)
  const lines = [
    `${heading}: ${ret.clientName}'s ${ret.year} Form ${ret.form} (id ${ret.id}).`,
    `Stage: ${isFirm ? stage?.staffLabel : stage?.clientLabel}. Due ${ret.due} (${daysUntil(ret.due)} days). ` +
      `Refund/balance as it stands: ${money(live.refund)}.`,
    `Progress: ${live.fieldsVerified} of ${live.fieldsTotal} lines verified; ${live.needsReview} still need review.` +
      (live.allVerified ? ' Every line is done.' : ''),
  ]
  if (ret.blocked && ret.blockReason) lines.push(`BLOCKED: ${ret.blockReason}`)

  // The lines that actually need attention, with their live amounts.
  const fields = store.getFields(ret.id)
  const attention = fields.filter((f) => f.state === 'review' || f.state === 'ai')
  if (attention.length) {
    lines.push('Lines needing attention:\n' + attention.map((f) =>
      `- Line ${f.line} ${f.label}: ${money(f.amount)}, ${FIELD_STATES[f.state]?.label}` +
      (f.confidence != null ? `, AI confidence ${f.confidence}%` : '') +
      (f.flag ? `. Flag: ${f.flag}` : '') +
      ` (field id ${f.id})`).join('\n'))
  }

  // The selected line, if the URL names one.
  const fid = params?.get('field')
  const sel = fid && fields.find((f) => f.id === fid)
  if (sel) {
    lines.push(`Selected line: ${sel.line} ${sel.label} = ${money(sel.amount)} - ${FIELD_STATES[sel.state]?.label}.` +
      (sel.sourceLocation ? ` Traced to ${sel.sourceLocation}.` : '') +
      (sel.transform ? ` Transformation: ${sel.transform}.` : '') +
      (sel.flag ? ` Flagged: ${sel.flag}` : ''))
  }

  const docs = docsForReturn(ret.id).concat(store.getExtraDocs(ret.id))
  if (docs.length) {
    const outstanding = docs.filter((d) => d.status === 'requested')
    lines.push(`Documents: ${docs.length} on file.` +
      (outstanding.length ? ` Still requested: ${outstanding.map((d) => d.name).join('; ')}.` : ''))
  }

  // Threads and notes, filtered exactly as the UI filters them. Internal-ness
  // lives on the individual message, so a thread is only visible at all if it
  // has at least one message this person may read - the same test MessagesInbox
  // applies.
  const threads = threadsForReturn(ret.id)
    .filter((t) => caps.seeInternalNotes || t.messages.some((m) => !m.internal))
  const open = threads.filter((t) => t.status !== 'resolved')
  if (open.length) {
    lines.push('Open conversations:\n' + open.map((t) => {
      const msgs = t.messages.filter((m) => caps.seeInternalNotes || !m.internal)
      const last = msgs[msgs.length - 1]
      const pending = t.request && !t.request.fulfilled && !store.isFulfilled(t.id)
      return `- "${t.subject}" (about ${t.contextLabel}) - next action sits with ` +
        `${t.ownerRole === 'firm' ? 'the firm' : 'the client'}.` +
        (pending ? ` Outstanding request: ${t.request.what}, due ${t.request.due}.` : '') +
        (last ? ` Latest message: “${last.body.slice(0, 160)}”` : '')
    }).join('\n'))
  }

  const notes = store.getNotes(ret.id).filter((n) => n.visibility === 'all' || caps.seeInternalNotes)
  const openNotes = notes.filter((n) => !n.done)
  if (openNotes.length) {
    lines.push('Open notes:\n' + openNotes.map((n) =>
      `- ${n.body}${n.visibility === 'firm' ? ' (firm only)' : ''} - ${userById(n.authorId)?.name || 'someone'}`).join('\n'))
  }

  return lines.join('\n')
}

function describeQueue({ user, caps }) {
  const mine = caps.seeAllReturns ? allTasks : allTasks.filter((t) => t.assigneeId === user?.id)
  const ranked = rankTasks(mine, { assigneeId: user?.id })
  const s = summarize(mine.filter((t) => t.assigneeId === user?.id))
  const top = ranked.slice(0, 6).map((t) => {
    const ret = returnById(t.returnId)
    return `- [${t.band.label}] ${t.title} - ${ret?.clientName || 'unknown client'}` +
      `, due in ${t.dLeft} day${t.dLeft === 1 ? '' : 's'}${t.blocked ? ', BLOCKED' : ''}` +
      ` → /returns/${t.returnId}`
  }).join('\n')
  return `Their assigned queue: ${s.total} open, ${s.overdue} overdue, ${s.dueToday} due today, ` +
    `${s.blocked} blocked, ${s.critical} critical.` +
    (top ? `\nTop of the ranked queue (this order is what the dashboard shows):\n${top}` : '')
}

// ---------------------------------------------------------------------------
// 3 · Parsing the reply back into UI
// ---------------------------------------------------------------------------

const SENTINEL = /\n-{3,}\s*\n/

/**
 * Split an answer from its trailing LINKS/SOURCES block.
 * Safe to call on a partial stream: while the sentinel is incomplete the tail
 * is withheld, so the raw block never flashes on screen mid-stream.
 */
export function parseAnswer(raw, { session } = {}) {
  const text = raw || ''
  const m = text.match(SENTINEL)
  if (!m) {
    // A lone trailing "---" (or the start of one) means the block is coming.
    return { body: text.replace(/\n-{1,3}\s*$/, ''), links: [], sources: [], complete: false }
  }
  const body = text.slice(0, m.index).trim()
  const tail = text.slice(m.index + m[0].length)

  const links = []
  const sources = []
  for (const line of tail.split('\n')) {
    const l = line.trim()
    if (/^LINKS:/i.test(l)) pushLink(links, l.replace(/^LINKS:/i, ''), session)
    else if (/^SOURCES:/i.test(l)) {
      l.replace(/^SOURCES:/i, '').split(',').forEach((id) => {
        const src = resolveSource(id.trim())
        if (src && !sources.some((s) => s.id === src.id)) sources.push(src)
      })
    } else if (l.includes('|') && l.startsWith('/')) pushLink(links, l, session) // continuation line
  }
  return { body, links: links.slice(0, 3), sources, complete: true }
}

function pushLink(acc, spec, session) {
  const [rawPath, ...rest] = spec.split('|')
  const to = rawPath.trim()
  const label = rest.join('|').trim()
  if (!to || !label) return
  if (!validateRoute(to, session)) return
  if (acc.some((l) => l.to === to)) return
  acc.push({ to, label })
}

function resolveSource(id) {
  const f = FAQ.find((x) => x.id === id)
  if (f) return { id, label: f.q, to: '/help/faq' }
  const g = GUIDES.find((x) => x.id === id)
  if (g) return { id, label: g.title, to: '/help/guides' }
  return null
}

/**
 * Would this path actually resolve, for this person?
 *
 * Two failure modes to catch: a route the model invented (it would render as a
 * button that lands on a redirect), and a real route this role can't reach
 * (offering a client the firm dashboard is worse than offering nothing).
 */
export function validateRoute(to, session) {
  if (!session || typeof to !== 'string' || !to.startsWith('/')) return false
  const [path] = to.split('?')
  const segs = path.split('/').filter(Boolean)
  const { isFirm, caps, user } = session

  for (const r of routesFor(isFirm, caps)) {
    const rs = r.path.split('/').filter(Boolean)
    if (rs.length !== segs.length) continue
    if (!rs.every((s, i) => s.startsWith(':') || s === segs[i])) continue

    // /returns/:rid is the one route both sides share - and the one where a
    // wrong id would show someone a return that isn't theirs. /documents/:rid
    // is the same risk by another door, so it gets the same check.
    if (r.path === '/returns/:rid' || r.path === '/documents/:rid') {
      return Boolean(visibleReturn(segs[1], session))
    }
    if (r.path === '/help/:section') {
      return ['start', 'faq', 'guides', 'interaction-system', 'support'].includes(segs[1])
    }
    if (r.path === '/my-return') return returnsForClient(user?.id).length > 0
    return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Starter prompts - route- and role-aware, so the empty state is never a
// blank box asking someone who is already lost to know what to ask.
// ---------------------------------------------------------------------------
export function starterPrompts({ session, location }) {
  const { isFirm, caps, activeRole } = session
  const p = location.pathname
  const out = []

  if (p.startsWith('/returns/')) {
    out.push('What’s blocking this return?', 'Where did the flagged figure come from?')
    if (caps.verifyFields) out.push('What do I need to do before this can be filed?')
  } else if (p.startsWith('/dashboard')) {
    out.push('What should I work on first?', 'Why is that item ranked above the others?')
  } else if (p.startsWith('/people')) {
    out.push('What can a seasonal preparer not do?', 'What happens if I remove someone’s last role?')
  } else if (p.startsWith('/documents') || p.startsWith('/my-documents')) {
    out.push('How do I find a specific document fast?')
  } else if (p.startsWith('/messages')) {
    out.push('What’s the difference between a note and a message?')
  } else if (p.startsWith('/home')) {
    out.push('What do I need to do next?', 'What if I don’t have all my documents yet?')
  }

  if (isFirm) {
    out.push('How does Vantage AI decide what to flag?')
    if (!caps.approveFile) out.push(`Why can’t I approve a return as ${ROLES[activeRole]?.label.toLowerCase()}?`)
  } else {
    out.push('What does my return status mean?', 'Why can’t I edit the numbers on my return?')
  }
  out.push('What do the badges next to figures mean?')

  return [...new Set(out)].slice(0, 4)
}
