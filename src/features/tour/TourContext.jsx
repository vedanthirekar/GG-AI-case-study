// Product tour.
// Drives the real application — navigating, switching account, and spotlighting
// the relevant UI — so a first-time viewer sees what the product does rather
// than reading about it. Grouped by the job being done, not by feature name.
import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const TourCtx = createContext(null)

// Each step drives the app: where to go, whose account to be in, what to point at.
export const TOUR_STEPS = [
  { part: 'For taxpayers', name: 'Your first ten seconds', persona: 'u-alex', to: '/home', target: 'onboarding-hero',
    body: 'A brand-new client lands here. One hero action tells them exactly what to do next — everything else stays deferred until it’s relevant.' },
  { part: 'For taxpayers', name: 'Getting help without asking', persona: 'u-alex', to: '/help/start', target: 'nav-help',
    body: 'Plain-language guides, a searchable FAQ and real support options — written for whoever is reading them. The ? in the top bar always explains the screen you’re on.' },
  { part: 'For the firm', name: 'What to work on right now', persona: 'u-dana', to: '/dashboard', target: 'dash-queue',
    body: 'Sign in as a preparer and the whole product changes. The dashboard answers “what do I work on first?” — a real ranking function orders every task by urgency, blocking and due date.' },
  { part: 'Reviewing a return', name: 'Where every number came from', persona: 'u-dana', to: '/returns/r-rivera?tab=review&field=f-1a', target: 'trace-panel',
    body: 'Click any line. Every figure traces to its exact source: the document, the precise box on it, and any calculation applied along the way.' },
  { part: 'Reviewing a return', name: 'Checking it side by side', persona: 'u-dana', to: '/returns/r-rivera?tab=review&field=f-1a&view=split', target: 'doc-pane',
    body: 'Switch to side-by-side and the source document stays open at full height beside the return — page through it, zoom in, and the matched box follows your selection.' },
  { part: 'Reviewing a return', name: 'An AI that shows its work', persona: 'u-dana', to: '/returns/r-rivera?tab=review&field=f-7&view=split', target: 'ai-card',
    body: 'Verity AI explains what it did, the evidence behind it and — crucially — its uncertainty. Where a figure has two defensible readings it offers you the choice instead of a guess. Pick one and the whole return recomputes live.' },
  { part: 'Reviewing a return', name: 'Knowing what you can touch', persona: 'u-dana', to: '/returns/r-rivera?tab=review&field=f-9', target: 'field-list',
    body: 'One visual language runs through every screen: AI-extracted, verified, needs review, editable, locked, read-only. You never have to guess which is which.' },
  { part: 'Working together', name: 'One status everyone reads the same', persona: 'u-dana', to: '/returns/r-rivera?tab=status', target: 'status-stepper',
    body: 'A single stage vocabulary, worded for two audiences. Staff see verification detail; clients see the same stage in plain language — no more “what does In Review actually mean?”.' },
  { part: 'Working together', name: 'Conversations with a context', persona: 'u-dana', to: '/returns/r-rivera?tab=messages&thread=th-basis', target: 'thread-composer',
    body: 'Threads attach to a specific line or document. Internal notes are firm-only, the toggle makes the audience unmistakable, and every thread names who owns the next action.' },
  { part: 'Working together', name: 'The rough tracker', persona: 'u-dana', to: '/returns/r-rivera?tab=notes', target: 'notes-composer',
    body: 'Not everything is a formal thread. Shared notes are the scratchpad both sides can write on — pinned to a line, ticked off when handled, and marked either “everyone” or “firm only”.' },
  { part: 'At scale', name: 'Never losing your place', persona: 'u-dana', to: '/returns/r-rivera?tab=review&field=f-7', target: 'related-rail',
    body: 'The Related rail, breadcrumbs, deep links and ⌘K search let you jump between connected objects and always find the way back. Even signing in preserves the link you followed.' },
  { part: 'At scale', name: 'Hundreds of documents, still navigable', persona: 'u-dana', to: '/documents', target: 'doc-search',
    body: 'Search, faceted filters and a collapsible hierarchy keep several hundred documents workable — depth without overwhelm.' },
  { part: 'Administration', name: 'Who can do what', persona: 'u-priya', to: '/people', target: 'access-matrix',
    body: 'Sign in as the firm administrator. These toggles are real: grant someone a role and their navigation, permissions and wording change the moment they next load a screen.' },
  { part: 'Administration', name: 'One person, two lives', persona: 'u-dana', to: '/dashboard', target: 'account',
    body: 'Dana prepares returns and also files her own. Her account menu switches between the two experiences — one login, one product, two entirely different surfaces.' },
]

export function TourProvider({ children }) {
  const [active, setActive] = useState(false)
  const [i, setI] = useState(0)

  const start = useCallback(() => { setI(0); setActive(true) }, [])
  const stop = useCallback(() => setActive(false), [])
  const next = useCallback(() => setI((x) => Math.min(x + 1, TOUR_STEPS.length - 1)), [])
  const prev = useCallback(() => setI((x) => Math.max(x - 1, 0)), [])
  const goto = useCallback((idx) => setI(idx), [])

  const value = useMemo(() => ({
    active, step: TOUR_STEPS[i], index: i, total: TOUR_STEPS.length,
    start, stop, next, prev, goto,
    isFirst: i === 0, isLast: i === TOUR_STEPS.length - 1,
  }), [active, i, start, stop, next, prev, goto])

  return <TourCtx.Provider value={value}>{children}</TourCtx.Provider>
}

export function useTour() {
  const ctx = useContext(TourCtx)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}
