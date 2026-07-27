# Vantage - an AI-powered tax platform (case-study prototype)

## User flow, experience & navigation

The app opens on a real sign-in screen, not a role picker. A **Use a demo account**
dropdown fills in credentials for one of seven seeded identities - any password works -
but it's deliberately one collapsed control rather than a browsable roster, so the front
door still looks like a front door.

| Account | Role |
| --- | --- |
| Dana Morales | Preparer **+** her own personal return (two roles, one login) |
| Sam Okafor | Reviewer - approves filing, sees internal notes |
| Priya Nair | Firm administrator - controls People & access |
| Jordan Lee | Seasonal staff - reduced permissions, assigned work only |
| Jordan Rivera | Returning taxpayer, return mid-review |
| Alex Chen | Brand-new client - first-run onboarding |
| Maya Torres | Business owner - 1120-S |

Once signed in, **who you are decides everything you see** - navigation, permissions,
vocabulary all resolve from the active role, in the same shell and the same components.
A first-time visit to any role offers a short tour once (never auto-starting, dismissed
is dismissed for that role/session); it runs as *you*, spotlighting your own records.

Getting around and staying oriented: a persistent sidebar (contents differ by role, same
component), breadcrumbs with a working "Back to <previous screen>", a Related-objects
rail for jumping between connected records, **⌘K** search, and deep links that carry full
context and **survive signing in** - a link opened while signed out resumes exactly there
after authentication instead of dropping you on a dashboard. The `?` drawer holds two
tabs: written guides/FAQ, and **Ask Vantage**, an assistant grounded in your role, your
permissions and the screen in front of you.

---

## What's wired up vs. simulated

**Genuinely wired up - real code doing real work:**

- **A live store + recompute engine** (`StoreContext.jsx`). Verifying or correcting a
  field, choosing an AI interpretation, adding a note, ingesting a document - all write to
  it, and dependent lines, the refund and every counter recompute through a real
  (simplified) 2025 MFJ bracket function.
- **Role access control** (`AccessContext.jsx` + `roles.js`). An administrator's grants
  are the actual authority a session resolves against, so changing someone's role
  genuinely changes what they can do. The People & access screen generates its
  permission text from the same `CAPS` map the app enforces, so they can't drift apart.
- **The prioritisation engine** (`prioritize.js`) - scores and ranks all 113 tasks by due
  date, blocking status, kind and stage; the dashboard is a real view over it.
- **The relationship graph** (`relationships.js`), search/filtering/faceting, the status
  state machine, breadcrumbs, deep links, and the tour engine (one step pool filtered by
  role and live conditions).
- **Ask Vantage** (`assistant.js`, `gemini.js`, `api/gemini.js`) - the one place a real
  model is called, behind a serverless function so the API key never reaches the browser.
  Its brief is *compiled* from the app's own sources (so it can't drift from what the
  product does), its context is live session/store state (so it quotes current figures,
  not seed data), and permission is enforced at prompt assembly - a client's prompt never
  contains firm-only content, so there's nothing to leak. Every link and citation it
  offers is validated against the real route table before it renders.

**Simulated - fabricated but plausible, by design:**

- **Authentication** - email must match a seeded account, any password passes. No
  session, no token, no server; signing out just clears React state.
- **AI extraction** (`data/ai.js`) - confidence scores, evidence and candidate
  interpretations on the review screen are a stable-contract stub, not a model call. The
  case study is about how AI output is presented and trusted, so that surface is
  deliberately faked while the trust design around it is real. (Ask Vantage is the one
  exception - that's a genuine call.)
- **Document parsing/OCR** - documents are hardcoded objects with "boxes"; the
  highlighted region is a lookup, not extraction.
- **The data** (`data/db.js`) - a deterministic seeded generator (~64 returns, ~340
  documents, ~113 tasks) plus a few hand-authored hero records for depth.
- **Notifications** seed from mock data (live actions do push real new items onto the
  feed, just nothing server-pushed). **Loading states** are a deliberate ~260ms skeleton
  with no backend behind them. **Persistence** - none; a refresh resets everything.

---

## Decisions worth explaining

- **One product, not ten demos.** Every capability lives in one shell on shared
  primitives - traceability, affordances, status and AI trust all reuse the same
  components, which is the real test of whether the system holds together.
- **Identity is the entry point**, not a role-switcher dropdown. You sign in as someone,
  and the whole surface resolves from who that is - closer to how a real product works,
  even though it costs the evaluator one extra click via the demo picker.
- **Permissions are communicated, not hidden - within the screen you're already on.** A
  control you can't use stays visible with a tooltip naming who has it, so two colleagues
  share one mental model. The line is drawn at whole *sections*: a permanently locked nav
  destination (People & access) is clutter, not communication, so it's hidden instead -
  the route guard, not the missing link, is what actually enforces it.
- **One status vocabulary, two audiences.** Rather than separate client/staff status
  systems (the usual cause of people reading "done" differently), there's one ordered
  stage list with audience-appropriate labels and depth.
- **Trust through layered disclosure.** The AI card leads with a plain summary and
  confidence; evidence is one tap away, not dumped all at once. Where a figure is
  genuinely ambiguous, it offers a choice between readings instead of guessing.
- **The assistant reads; it never writes.** It can explain and navigate (links checked
  against the real route table), but it can't verify a field, correct a figure or send a
  message. A product whose whole claim is "every number traces to a person's decision"
  can't let a model quietly make one of those decisions.
- **An assistant didn't replace the documentation.** The guides are the assistant's
  grounding corpus, so deleting them would make it worse - and a help centre answers *the*
  question (browsable, works offline) while the assistant answers *your* question. They're
  wired together instead: the assistant cites the guide it drew on.
- **The visual language is an argument, not a default.** A tax return is a printed
  instrument, so the interface is built like one - serif headings, tabular mono for every
  figure, hairline rules instead of shadows, near-square corners, and a deliberately
  scarce palette. This direction ("Ledger") was picked over five alternatives, still
  browsable at `mockups/v2/index.html`. There is no dark mode, for the same reason a
  printed instrument has one stock, not two.

Everything visual resolves from the token block in `src/index.css` plus the scales in
`tailwind.config.js` - re-theming the product means editing those two files, not the
feature code.
