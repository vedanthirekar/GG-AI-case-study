// Product tour — role-specific.
//
// A tour that walks everyone through the same fourteen screens is a product
// pitch, not onboarding: a taxpayer does not need to see the review queue, and a
// preparer does not need "how to upload your W-2". So the library below is one
// pool of steps, each declaring which roles it belongs to, and the tour that
// runs is assembled for whoever is signed in.
//
// Two consequences worth noting:
//   · The tour never switches account. It runs as *you*, through *your* work.
//   · Paths resolve against the signed-in user's own return, so a client tours
//     their return and a preparer tours the one on their desk.
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { useSession } from '../../context/SessionContext'
import { returnsForClient, returnById } from '../../data/db'

const TourCtx = createContext(null)

// The hero return used for firm-side steps — the one with full traceability.
const FIRM_DEMO_RETURN = 'r-rivera'

// `roles`  — who this step is for.
// `when`   — optional extra condition, given the resolved context.
// `to`     — path, or a function of the context (so it can target your return).
const LIBRARY = [
  // ---------- taxpayers ----------
  {
    id: 'client-first-action', roles: ['individual', 'business'], when: (c) => c.isNewClient,
    part: 'Getting started', name: 'Your next step', to: '/home', target: 'onboarding-hero',
    body: 'Everything starts here. One action is highlighted at a time — do that, and the next one appears. Nothing else demands your attention until it matters.',
  },
  {
    id: 'client-home', roles: ['individual', 'business'], when: (c) => !c.isNewClient,
    part: 'Getting started', name: 'Your home', to: '/home', target: 'client-home',
    body: 'This is the whole picture at a glance: whether we need anything from you, where your return has got to, and where to go next. If nothing is asked of you here, the ball is in our court.',
  },
  {
    id: 'client-status', roles: ['individual', 'business'], to: (c) => `/returns/${c.rid}?tab=status`, target: 'status-stepper',
    part: 'Your return', name: 'Where things stand', body:
      'Six plain-language stages, no jargon. You can always see what has happened, what happens next, and who it is waiting on — you or us.',
  },
  {
    id: 'client-docs', roles: ['individual', 'business'], to: '/my-documents', target: 'doc-search',
    part: 'Your return', name: 'Your documents', body:
      'Everything you have sent us, plus anything we imported for you. Send what you have whenever you have it — we will tell you what is still missing rather than expecting a complete set up front.',
  },
  {
    id: 'client-review', roles: ['individual', 'business'], when: (c) => c.hasFields,
    to: (c) => `/returns/${c.rid}?tab=review`, target: 'trace-panel',
    part: 'Your return', name: 'Where your numbers came from', body:
      'Click any figure and you can see the document it came from, the exact box on it, and the maths applied. You cannot edit these — your preparer verifies them — but you never have to take them on trust.',
  },
  {
    id: 'client-messages', roles: ['individual', 'business'], to: (c) => `/returns/${c.rid}?tab=messages`, target: 'thread-composer',
    part: 'Talking to us', name: 'Questions, in context', body:
      'Every conversation is attached to the document or figure it is about, so nothing gets lost the way it does in email. Each one shows whose turn it is.',
  },
  {
    id: 'client-notes', roles: ['individual', 'business'], to: (c) => `/returns/${c.rid}?tab=notes`, target: 'notes-composer',
    part: 'Talking to us', name: 'The shared notepad', body:
      'For the smaller things — "heads up, I changed jobs in March". Jot it here and your preparer sees it against your return.',
  },
  {
    id: 'client-help', roles: ['individual', 'business'], to: '/help/start', target: 'nav-help',
    part: 'If you get stuck', name: 'Help, without having to ask', body:
      'Plain-language guides and a searchable list of common questions. The ? in the top bar always explains the screen you are on.',
  },

  // ---------- preparers & seasonal staff ----------
  {
    id: 'staff-queue', roles: ['preparer', 'seasonal'], to: '/dashboard', target: 'dash-queue',
    part: 'Your day', name: 'What to work on first', body: (c) => c.role === 'seasonal'
      ? 'Your queue, ranked by urgency, blockers and due date — and limited to the returns assigned to you. Start at the top.'
      : 'Your queue, ranked by urgency, blockers and due date rather than listed by date. Start at the top and keep going.',
  },
  {
    id: 'staff-trace', roles: ['preparer', 'seasonal'], to: (c) => `/returns/${c.rid}?tab=review&field=f-1a`, target: 'trace-panel',
    part: 'Preparing a return', name: 'Every number, traced', body:
      'Select any line to see the chain behind it: source document, the exact box, the transformation applied, and the resulting figure. Nothing on the return is an unattributed number.',
  },
  {
    id: 'staff-split', roles: ['preparer', 'reviewer'], to: (c) => `/returns/${c.rid}?tab=review&field=f-1a&view=split`, target: 'doc-pane',
    part: 'Preparing a return', name: 'Checking against the form', body:
      'Switch to side-by-side and the source document takes its own full-height column — page through it, zoom in, and the matched box follows whichever line you select.',
  },
  {
    id: 'staff-ai', roles: ['preparer', 'reviewer', 'seasonal'], to: (c) => `/returns/${c.rid}?tab=review&field=f-7&view=split`, target: 'ai-card',
    part: 'Preparing a return', name: 'Working with Verity AI', body:
      'The AI shows its evidence and its confidence. Where a figure has two defensible readings it hands you the choice instead of guessing — and whichever you pick, the dependent lines and the refund recompute immediately.',
  },
  {
    id: 'staff-affordance', roles: ['preparer', 'reviewer', 'seasonal'], to: (c) => `/returns/${c.rid}?tab=review&field=f-9`, target: 'field-list',
    part: 'Preparing a return', name: 'What you can touch', body: (c) => c.canVerify
      ? 'One visual language everywhere: AI-extracted, verified, needs review, editable, locked, read-only. Use Review queue to clear the flagged lines from the keyboard — j / k to move, a to accept.'
      : 'One visual language everywhere: AI-extracted, verified, needs review, editable, locked, read-only. You can prepare figures; a full preparer or reviewer marks them verified, and locked controls explain who can.',
  },
  {
    id: 'staff-status', roles: ['preparer', 'reviewer', 'seasonal'], to: (c) => `/returns/${c.rid}?tab=status`, target: 'status-stepper',
    part: 'Keeping people informed', name: 'One status, two audiences', body:
      'You see the verification detail; the client sees the same stage in plain language. Same underlying vocabulary, so nobody is reading a different story.',
  },
  {
    id: 'staff-messages', roles: ['preparer', 'reviewer'], to: (c) => `/returns/${c.rid}?tab=messages&thread=th-basis`, target: 'thread-composer',
    part: 'Keeping people informed', name: 'Internal vs. client-visible', body:
      'Threads attach to a specific line or document. The toggle makes the audience unmistakable — internal notes never reach the client — and every thread names who owns the next action.',
  },
  {
    id: 'seasonal-messages', roles: ['seasonal'], to: (c) => `/returns/${c.rid}?tab=messages&thread=th-basis`, target: 'thread-composer',
    part: 'Keeping people informed', name: 'Messaging the client', body:
      'You can write to clients here. Internal firm notes are limited to preparers and reviewers, so you will not see them on this screen — the composer says so rather than quietly hiding the option.',
  },
  {
    id: 'staff-notes', roles: ['preparer', 'reviewer', 'seasonal'], to: (c) => `/returns/${c.rid}?tab=notes`, target: 'notes-composer',
    part: 'Keeping people informed', name: 'The rough tracker', body:
      'Not everything deserves a thread. Shared notes are the scratchpad — pin one to a line, tick it off when handled, and mark it for everyone or firm-only.',
  },
  {
    id: 'staff-docs', roles: ['preparer', 'reviewer'], to: '/documents', target: 'doc-search',
    part: 'At scale', name: 'Hundreds of documents', body:
      'Search, category facets and a collapsible hierarchy keep the whole library workable, and selecting a file keeps the list beside it so you never lose your place.',
  },

  // ---------- reviewers ----------
  {
    id: 'reviewer-queue', roles: ['reviewer'], to: '/dashboard', target: 'dash-queue',
    part: 'Your day', name: 'What needs your sign-off', body:
      'Your queue, ranked by urgency and blockers. As a reviewer you are the last check before a return is filed, so approvals and blocked work surface first.',
  },
  {
    id: 'reviewer-verify', roles: ['reviewer'], to: (c) => `/returns/${c.rid}?tab=review&field=f-3a`, target: 'field-list',
    part: 'Reviewing', name: 'Verify and approve', body:
      'You can mark figures verified against their source and approve the return for filing — the two things a preparer cannot do alone. Review queue walks only the flagged lines: j / k to move, a to accept.',
  },

  // ---------- firm administrators ----------
  {
    id: 'admin-overview', roles: ['admin'], to: '/dashboard', target: 'dash-queue',
    part: 'Running the firm', name: 'The whole practice', body:
      'You see every open item across the firm, ranked, and can filter to any member of staff. You do not edit tax figures — that stays with preparers and reviewers — but nothing is hidden from you.',
  },
  {
    id: 'admin-access', roles: ['admin'], to: '/people', target: 'access-matrix',
    part: 'Running the firm', name: 'Who can do what', body:
      'This is yours alone. Toggling a role takes effect the moment that person loads their next screen — navigation, permissions and wording all follow. Everyone keeps at least one role, and granting sign-off authority asks you to confirm.',
  },
  {
    id: 'admin-returns', roles: ['admin'], to: '/returns', target: 'nav-returns',
    part: 'Running the firm', name: 'Every return, one vocabulary', body:
      'The status wording here is exactly what the client sees on their side, so you can answer "where is my return?" without translating anything.',
  },

  // ---------- everyone ----------
  {
    id: 'multi-role', roles: ['preparer', 'reviewer', 'admin', 'seasonal', 'individual', 'business'],
    when: (c) => c.multiRole, to: '/dashboard', target: 'account',
    part: 'Your account', name: 'Your two roles', body:
      'You work at the firm and you also file your own return. Your account menu switches between them — one login, two entirely separate experiences, and your personal return never appears in your firm work.',
  },
  {
    id: 'orientation', roles: ['preparer', 'reviewer', 'admin', 'seasonal'],
    to: (c) => `/returns/${c.rid}?tab=review&field=f-7`, target: 'related-rail',
    part: 'Finding your way', name: 'Never losing your place', body:
      'The Related panel, breadcrumbs, "Back to…" and ⌘K search connect everything. Links carry full context — even signing in preserves the one you followed.',
  },
  {
    id: 'staff-help', roles: ['preparer', 'reviewer', 'admin', 'seasonal'], to: '/help/start', target: 'nav-help',
    part: 'Finding your way', name: 'Help when you need it', body:
      'Working guidance for firm staff, a searchable FAQ, and the ? in the top bar for whatever screen you are on.',
  },
]

// Build the context a step's `to` / `body` / `when` resolve against.
function buildContext({ user, activeRole, caps, roles }) {
  const isClient = !!caps?.isClient
  const own = user ? returnsForClient(user.id)[0] : null
  const rid = isClient ? own?.id : FIRM_DEMO_RETURN
  const ret = rid ? returnById(rid) : null
  return {
    role: activeRole,
    rid,
    isNewClient: !!ret?.isNewClient,
    hasFields: (ret?.fields?.length || 0) > 0,
    canVerify: !!caps?.verifyFields,
    multiRole: (roles?.length || 0) > 1,
  }
}

export function TourProvider({ children }) {
  const { user, activeRole, caps, roles } = useSession()
  const [active, setActive] = useState(false)
  const [i, setI] = useState(0)

  const ctx = useMemo(() => buildContext({ user, activeRole, caps, roles }),
    [user, activeRole, caps, roles])

  // The tour for whoever is signed in, with paths and copy resolved.
  const steps = useMemo(() => LIBRARY
    .filter((s) => s.roles.includes(activeRole))
    .filter((s) => (s.when ? s.when(ctx) : true))
    .filter((s) => !String(typeof s.to === 'function' ? s.to(ctx) : s.to).includes('undefined'))
    .map((s, idx) => ({
      ...s,
      n: idx + 1,
      to: typeof s.to === 'function' ? s.to(ctx) : s.to,
      body: typeof s.body === 'function' ? s.body(ctx) : s.body,
    })), [activeRole, ctx])

  // Changing role mid-tour would leave you on a step that is no longer yours.
  useEffect(() => { setActive(false); setI(0) }, [activeRole, user?.id])

  const start = useCallback(() => { setI(0); setActive(true) }, [])
  const stop = useCallback(() => setActive(false), [])
  const total = steps.length
  const next = useCallback(() => setI((x) => Math.min(x + 1, total - 1)), [total])
  const prev = useCallback(() => setI((x) => Math.max(x - 1, 0)), [])
  const goto = useCallback((idx) => setI(idx), [])

  const value = useMemo(() => ({
    active: active && total > 0,
    step: steps[Math.min(i, total - 1)],
    index: Math.min(i, Math.max(total - 1, 0)),
    total,
    start, stop, next, prev, goto,
    isFirst: i === 0, isLast: i >= total - 1,
  }), [active, steps, i, total, start, stop, next, prev, goto])

  return <TourCtx.Provider value={value}>{children}</TourCtx.Provider>
}

export function useTour() {
  const ctx = useContext(TourCtx)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}
