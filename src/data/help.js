// ============================================================================
// Help content.
// Written as data rather than markup so the same entries can be filtered by
// audience, searched, and surfaced contextually in the help drawer. `audience`
// is 'client', 'firm', or 'all'.
// ============================================================================

// ---- "Start here" - the first thing each audience should do ----------------
export const START_HERE = {
  client: [
    { icon: 'upload', title: 'Send us your documents', body: 'Upload whatever you have - W-2s, 1099s, receipts. You don’t need the full set to start; we’ll tell you what’s still missing.', to: '/my-documents' },
    { icon: 'route', title: 'Understand where your return is', body: 'One plain-language tracker shows what has happened, what’s next, and who we’re waiting on.', to: '/my-return?tab=status' },
    { icon: 'chat', title: 'Ask a question', body: 'Messages attach to the exact document or figure they’re about, so nothing gets lost in an email chain.', to: '/messages' },
  ],
  firm: [
    { icon: 'grid', title: 'Work your ranked queue', body: 'The dashboard orders every open item by urgency, blockers and due date - start at the top and keep going.', to: '/dashboard' },
    { icon: 'compass', title: 'Review a return with its sources', body: 'Click any line to see the document it came from, the exact box, and the calculation applied. Switch to side-by-side to keep the form open beside it.', to: '/returns' },
    { icon: 'sparkle', title: 'Work with Vantage AI', body: 'The AI shows its evidence and its uncertainty. Where a figure is genuinely ambiguous it offers you a choice instead of a guess.', to: '/returns' },
  ],
}

// ---- FAQ --------------------------------------------------------------------
export const FAQ = [
  { id: 'q-start', audience: 'client', cat: 'Getting started', q: 'I just signed up. What do I actually do first?',
    a: 'Your home screen leads with a single next action - usually uploading a document or answering a short question. Do that one thing. Everything else stays out of your way until it becomes relevant.' },
  { id: 'q-docs-missing', audience: 'client', cat: 'Getting started', q: 'What if I don’t have all my documents yet?',
    a: 'Send what you have. Your preparer sees exactly which forms are still outstanding and will ask for them by name, with a due date, in Messages.' },
  { id: 'q-status', audience: 'client', cat: 'Status & progress', q: 'What does my return status actually mean?',
    a: 'There are six stages: gathering documents, questions for you, preparation, review, your approval, and filed. The tracker always names the stage, what happens next, and whose turn it is - yours or ours.' },
  { id: 'q-waiting', audience: 'client', cat: 'Status & progress', q: 'How do I know if you’re waiting on me?',
    a: 'Anything that needs you appears at the top of your home screen and in your activity bell. If nothing is there, the ball is in our court.' },
  { id: 'q-edit', audience: 'client', cat: 'Your return', q: 'Why can’t I edit the numbers on my return?',
    a: 'Tax figures are verified by your preparer against source documents, so they’re read-only to you. If something looks wrong, use the question link on that line - it opens a conversation attached to that exact figure.' },
  { id: 'q-refund', audience: 'client', cat: 'Your return', q: 'My refund estimate changed. Why?',
    a: 'Estimates recalculate whenever an underlying figure is corrected or a new document arrives. The line that changed is highlighted, and the change is always traceable back to its source.' },
  { id: 'q-privacy', audience: 'client', cat: 'Privacy & security', q: 'Can I see everything my preparer writes?',
    a: 'You see every message addressed to you and every note marked "everyone". Firms also keep internal working notes between colleagues; those are marked clearly on their side and never shown to you.' },

  { id: 'q-trace', audience: 'firm', cat: 'Reviewing returns', q: 'How do I check where a number came from?',
    a: 'Select the line. The trace panel shows the chain - source document, the exact box on it, any transformation applied, and the resulting line. Switch the view to side-by-side to keep the document open next to the return.' },
  { id: 'q-queue', audience: 'firm', cat: 'Reviewing returns', q: 'Is there a faster way to clear flagged lines?',
    a: 'Yes - Review queue in the return header. It walks only the lines needing review: j/k to move, a to accept, esc to exit.' },
  { id: 'q-ambiguous', audience: 'firm', cat: 'Vantage AI', q: 'What happens when the AI isn’t sure?',
    a: 'It says so. For low-confidence values it flags the line rather than filling it silently. Where a figure has two defensible readings it presents both with their evidence and asks you to choose - the choice, not the guess, is what gets recorded.' },
  { id: 'q-correct', audience: 'firm', cat: 'Vantage AI', q: 'How do I correct the AI without redoing everything?',
    a: 'Use "Correct value" on the AI card. The line updates, every dependent calculation and the refund recompute immediately, and the original extraction is kept alongside your correction for the audit trail.' },
  { id: 'q-confidence', audience: 'firm', cat: 'Vantage AI', q: 'What does the confidence percentage mean?',
    a: 'How closely the extracted value matched an expected pattern on a recognised form. Treat it as triage, not proof - anything under 85% is surfaced for review, and the evidence is always one click away.' },
  { id: 'q-internal', audience: 'firm', cat: 'Collaboration', q: 'What’s the difference between a note and a message?',
    a: 'Messages are threaded conversations attached to a document or line, with an explicit owner of the next action. Notes are a shared rough tracker on the return - quick jottings, tickable when handled, marked either "everyone" or "firm only".' },
  { id: 'q-visible', audience: 'firm', cat: 'Collaboration', q: 'How do I make sure a client never sees something?',
    a: 'Mark it Internal note (in Messages) or Firm only (in Notes). Both are enforced by permission, not just styling - the client’s session never receives them.' },
  { id: 'q-locked', audience: 'firm', cat: 'Permissions', q: 'Why is an action greyed out for me?',
    a: 'Your role doesn’t carry that permission. Hover it and the tooltip explains which role does - we keep locked actions visible on purpose so the model stays learnable.' },
  { id: 'q-roles', audience: 'firm', cat: 'Permissions', q: 'Who can change what someone has access to?',
    a: 'A firm administrator, in People & access. Changes apply immediately to that person’s next screen - navigation, permissions and wording all follow the role.' },
  { id: 'q-two-roles', audience: 'all', cat: 'Permissions', q: 'I work at the firm and file my own return. How does that work?',
    a: 'One login, two experiences. Your account menu shows both roles; switching flips the whole shell between your firm work and your personal return. Your own return is never visible to you through the firm surface.' },
  { id: 'q-affordance', audience: 'all', cat: 'Using the product', q: 'What do the little badges next to figures mean?',
    a: 'They tell you what you can do with a value: AI-extracted, verified by a person, needs review, freely editable, locked because it’s calculated, or read-only by rule. The same six states appear identically on every screen.' },
  { id: 'q-lost', audience: 'all', cat: 'Using the product', q: 'I opened something from a link and lost my place.',
    a: 'Breadcrumbs at the top always show the path back, the "Back to…" button returns to where you were, and the Related panel on the right lists everything connected to what you’re looking at.' },
  { id: 'q-search', audience: 'all', cat: 'Using the product', q: 'Is there a fast way to find a client or document?',
    a: 'Press ⌘K (Ctrl+K) anywhere for search across returns, documents and people.' },
]

// ---- Longer guides ----------------------------------------------------------
export const GUIDES = [
  { id: 'traceability', audience: 'all', icon: 'compass', title: 'How traceability works',
    body: 'Every figure on a return carries a link back to the document it came from, the exact region of that document, and any calculation applied along the way. Nothing on a Vantage return is an unattributed number - if you can see it, you can see where it came from.' },
  { id: 'ai', audience: 'all', icon: 'sparkle', title: 'How Vantage AI decides',
    body: 'The AI reads uploaded documents, matches recognised form layouts, and proposes values with a confidence score and the evidence behind them. It does not file anything, and it does not resolve genuine ambiguity on its own - where two readings are defensible, a person chooses.' },
  { id: 'privacy', audience: 'all', icon: 'shield', title: 'Who can see what',
    body: 'Taxpayers see their own return, their documents, messages addressed to them, and notes marked "everyone". Firm staff additionally see internal notes and - depending on role - other clients’ work. Permissions are enforced in the data each session receives, not by hiding buttons.' },
]

// ---- Support ----------------------------------------------------------------
export const SUPPORT = [
  { icon: 'chat', title: 'Message your preparer', body: 'Best for anything about your return. Replies usually the same working day.', cta: 'Open messages', to: '/messages', audience: 'client' },
  { icon: 'chat', title: 'Ask the client team', body: 'Questions about a client’s file, deadlines or handoffs.', cta: 'Open messages', to: '/messages', audience: 'firm' },
  { icon: 'mail', title: 'Email support', body: 'support@vantage.tax - for accounts, access and billing.', audience: 'all' },
  { icon: 'phone', title: 'Call us', body: '(555) 014-2200 · Mon–Fri, 8am–7pm during filing season.', audience: 'all' },
]

// ---- Client info tips -------------------------------------------------------
// Five, deliberately. These sit at the points where a taxpayer predictably
// stalls - not as decoration on every label. Kept here rather than inline so
// the whole of what we say to a nervous client is reviewable in one place.
export const CLIENT_TIPS = {
  stage: 'This is the stage your return is at. The tracker below always names what happens next and whose turn it is - yours or ours.',
  refund: 'An estimate, not a final figure. It recalculates whenever a number is corrected or a new document arrives, and every change traces back to its source.',
  readonly: 'Your figures are read-only because your preparer verifies each one against the document it came from. If something looks wrong, use the question link on that line - it opens a conversation attached to that exact figure.',
  waiting: 'When it says we’re waiting on you, something is genuinely paused until you act. When it’s with us, you don’t need to do anything - we’ll come to you.',
  documents: 'You don’t need the full set. Send what you have and we’ll tell you exactly what’s still missing, by name, in Messages.',
}

// ---- Contextual help, keyed by route prefix --------------------------------
export const PAGE_HELP = [
  { match: '/dashboard', title: 'Your dashboard', points: [
    'Items are ranked by urgency, not listed by date - the top of the list is genuinely what to do next.',
    'Filter by severity, or re-sort by due date when a deadline is what matters.',
    'A red bar means overdue; "Blocked" means something outside your control is holding it up.',
  ], faq: ['q-queue', 'q-locked'] },
  { match: '/returns/', title: 'Reviewing a return', points: [
    'Click any line to trace it back to its source document and calculation.',
    'Switch to Side-by-side to keep the source document open beside the return.',
    'Review queue walks only the flagged lines with the keyboard: j / k / a / esc.',
  ], faq: ['q-trace', 'q-ambiguous', 'q-correct'] },
  { match: '/returns', title: 'All returns', points: [
    'Status wording here is the same vocabulary the client sees - no translation needed.',
    'Use ⌘K to jump straight to a client instead of scrolling.',
  ], faq: ['q-search'] },
  { match: '/documents', title: 'Client Docs', points: [
    'The library opens by client, so you start from a file rather than a pile.',
    'Clients with something outstanding sort to the top.',
    'The search box still reaches every document you can see - you don’t have to know whose it is.',
  ], faq: ['q-search', 'q-lost'] },
  { match: '/my-documents', title: 'Your documents', points: [
    'Everything you’ve sent us, plus anything we imported on your behalf.',
    'Add a document at any time - we’ll tell you if it changes anything.',
  ], faq: ['q-docs-missing'] },
  { match: '/messages', title: 'Messages', points: [
    'Every conversation is attached to a specific document or figure.',
    'The owner strip tells you whose turn it is - yours or theirs.',
  ], faq: ['q-internal', 'q-visible'] },
  { match: '/home', title: 'Your home', points: [
    'One next action leads the page. Do that, and the next one appears.',
    'Anything we need from you shows up here first.',
  ], faq: ['q-start', 'q-waiting'] },
  { match: '/people', title: 'People & access', points: [
    'Toggling a role takes effect immediately for that person.',
    'Everyone must keep at least one role - the last one can’t be removed.',
  ], faq: ['q-roles', 'q-two-roles'] },
  { match: '/help', title: 'Help & guides', points: [
    'Search the FAQ, or read how traceability, the AI and permissions work.',
    'The ? button in the top bar always shows help for the screen you’re on.',
  ], faq: [] },
]

export function helpForPath(path) {
  return PAGE_HELP.find((p) => path.startsWith(p.match)) || PAGE_HELP.find((p) => p.match === '/help')
}

export const forAudience = (list, isFirm) =>
  list.filter((x) => x.audience === 'all' || x.audience === (isFirm ? 'firm' : 'client'))
