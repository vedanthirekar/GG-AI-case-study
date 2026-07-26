# Verity — an AI-powered tax platform (case-study prototype)

A greenfield, clickable prototype of a tax platform shared by taxpayers and the firms
that serve them, built for the AI Engineer case study. It's **one product** — one shell,
one data model, one sign-in — that answers all ten challenges as real parts of the same
application rather than ten disconnected demos.

> The frontend is the point. Everything behind it is deliberately "quick and dirty":
> generated data, a simulated AI, no backend, no real auth, no real parsing.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run build` produces a static bundle in `dist/` — deploy anywhere (Vercel, Netlify,
any static host). No environment variables, no services.

**Stack:** React 18 · Vite · Tailwind · react-router · framer-motion.
State is in-memory: **a page refresh signs you out and resets every edit.** That's a
deliberate prototype trade-off, not a bug.

---

## Signing in

The app opens on a real sign-in screen. Pick any **demo account** below the form — it
fills in the credentials — then sign in. **Any password works.**

| Account | Email | What you'll see |
| --- | --- | --- |
| **Dana Morales** | `dana.morales@verity.tax` | Preparer **+ her own personal return** — the multi-role case |
| **Sam Okafor** | `sam.okafor@verity.tax` | Reviewer — approves filing, sees every internal note |
| **Priya Nair** | `priya.nair@verity.tax` | Firm administrator — controls **People & access** |
| **Jordan Lee** | `jordan.lee@verity.tax` | Seasonal staff — reduced permissions, assigned work only |
| **Jordan Rivera** | `j.rivera@gmail.com` | Returning taxpayer, return mid-review |
| **Alex Chen** | `alex.chen@outlook.com` | Brand-new client — **first-run onboarding** |
| **Maya Torres** | `maya@torresdesign.co` | Business owner — 1120-S |

Once inside, the account menu at the foot of the sidebar has **Switch demo account** as
a shortcut for exploring, plus **Sign out** to return to the real login.

**A deep link survives sign-in.** Paste `/returns/r-rivera?tab=review&field=f-7` while
signed out: after you authenticate it opens that exact field, rather than dumping you on
a dashboard.

---

## Start with the tour

Click **Show me around** in the top bar. The tour is assembled for whoever is signed in:
a taxpayer gets seven steps about their own return, an admin gets five about running the
practice, a preparer gets the review workflow. It never switches account — it runs as
*you*, navigating the real application and spotlighting the relevant UI, and every path
resolves against your own work. Sign in as two different people to see two different
tours. (`→`/`←` to move, `Esc` to exit.)

---

## The things worth clicking

**Live recompute.** Open Jordan Rivera's return → **Review** → **Line 7**. The AI is only
68% confident, so instead of guessing it offers two defensible readings. Choose *"Assume
$0 basis on 2 lots"*: the gain becomes **$8,910**, every dependent locked line (total
income → AGI → taxable → tax) recomputes with a highlight flash, the **refund moves
$6,789 → $6,453**, and the verified counter goes 7/13 → 8/13. Nothing here is a static
mock.

**Side by side.** In the same screen, switch **View** to *Side by side*. The source
document opens at full height in its own column — page through it, zoom, and the matched
box follows whichever line you select.

**Review queue.** Click **Review queue** to walk only the flagged lines from the
keyboard: `j`/`k` to move, `a` to accept, `esc` to exit.

**Shared notes.** The **Notes** tab is a rough tracker both sides can write on. Add one
as Dana marked *Firm only*, then sign in as Jordan Rivera — it isn't there. The count on
the tab drops from 4 to 3.

**Access that actually applies.** Sign in as **Priya Nair** → **People & access** → give
Jordan Lee the **Reviewer** role. Sign in as Jordan Lee and the approve action is
unlocked and internal notes appear. Try removing someone's last role and it's refused,
with an explanation.

**Document ingestion.** Any return's **Documents** tab → **Add a document**: a simulated
extraction reveals fields with rising confidence, then lands as a new, fully traceable
line on the return.

Also: **⌘K** searches everything, **?** opens help for the screen you're on, and the top
bar toggles **dark mode**.

---

## What's real vs. simulated

**Genuinely wired up — real code doing real work:**

- **A live store + recompute engine** (`src/context/StoreContext.jsx`). Verifying,
  correcting, choosing an interpretation, adding a note or ingesting a document all
  write to it; dependent locked lines and the refund recompute through a simplified but
  real 2025 MFJ bracket function, and every counter, badge and status follows.
- **Role access control** (`src/context/AccessContext.jsx` + `src/lib/roles.js`). The
  administrator's grants are the authority — `SessionContext` resolves a user's roles
  through them, so a change genuinely alters what that person can see and do. Guardrails
  (last role, sign-off confirmation) are real logic, and the People & access screen
  generates its permission descriptions from the same `CAPS` map the app enforces
  against, so the two can't drift.
- **The prioritisation engine** (`src/lib/prioritize.js`) — scores and ranks every task
  by due date, blocking, kind and stage. The dashboard is driven by it, across 113 tasks.
- **The relationship graph** (`src/lib/relationships.js`) — derives object connections
  from IDs; powers the Related rail and cross-object navigation.
- **Search, filtering, faceting and progressive disclosure** over the full generated set.
- **The status state machine**, breadcrumbs, deep links, and the affordance system.
- **The tour engine** — one pool of steps filtered by role and by live conditions, driving
  real navigation and spotlighting against the signed-in user's own records.

**Simulated — fabricated but plausible, by design:**

- **Authentication.** The email must match a seeded account; any password is accepted.
  There is no session, no token, no server. Signing out just clears React state.
- **AI output** (`src/data/ai.js`) — a stub returning structured confidence, evidence,
  uncertainty and recommended actions derived from each mock field. No model is called.
- **Document parsing / OCR** — documents are hardcoded objects carrying "boxes"; the
  highlighted region is a lookup, not extraction. Page and zoom controls are real UI over
  fake paper.
- **The data** (`src/data/db.js`) — a deterministic seeded generator makes ~64 returns,
  ~340 documents and ~113 tasks, plus hand-authored hero records (Rivera's fully
  traceable 1040, Alex's onboarding, the seeded notes) so the key screens have depth.
- **Notifications** — the activity feed is seeded from the mock data; live actions push
  genuine new items onto it, but nothing is pushed from a server.
- **Loading states** — route and filter changes show a deliberate ~260ms skeleton
  (`src/lib/useSimulatedLoad.js`). With no backend, everything would otherwise appear
  instantly and the loading design would never be visible.
- **Persistence** — none. Refreshing resets everything.

---

## Design decisions worth explaining

1. **One product, not ten demos.** Every capability lives inside a single shell with
   shared components. Traceability, affordances, status and AI trust reuse the same
   primitives — which is the actual test of whether the system is coherent.
2. **Identity is the entry point.** A platform serving six roles can't open on a
   role-switcher dropdown; that's a demo affordance, not a product. You sign in as
   someone, and the whole surface — navigation, permissions, vocabulary — resolves from
   who that is. The demo-account picker keeps it one click for anyone evaluating it.
3. **Permissions are communicated, not just enforced.** Locked actions stay visible with
   a tooltip explaining *which role* has them, rather than vanishing. Hiding them would
   leave two colleagues with different mental models of the same product and no way to
   discover what they'd need.
4. **Same status, two audiences.** Rather than inventing separate client and staff status
   systems — the root cause of people reading statuses differently — there's one ordered
   stage vocabulary with audience-appropriate labels and depth.
5. **Trust through layered transparency.** The AI card leads with a plain summary and
   confidence; technical evidence is one tap away. Showing everything at once was
   explicitly not the goal. Uncertainty and the correction path are first-class, and
   where a figure is genuinely ambiguous the AI presents both readings and asks rather
   than guessing.
6. **Two kinds of conversation.** Threads carry an owner and a resolution; notes are the
   quick shared scratchpad that would otherwise end up in email. Collapsing them into one
   inbox is how communication becomes noise.
7. **Deep-linkable state.** Selection lives in the URL — including the review layout — so
   you can land mid-context, and the breadcrumb plus Related rail reconstruct where you
   are. Sign-in preserves it too.
8. **The visual language is an argument, not a default.** A tax return is a printed
   instrument, so the interface is built like one: a serif (Newsreader) for headings over
   a humanist sans (IBM Plex Sans), tabular mono (IBM Plex Mono) for every figure, hairline
   rules instead of drop shadows, near-square corners, and status shown as a ruled print
   mark rather than a filled pill. Colour is deliberately scarce — warm stock, ink, and a
   single blue, with each semantic tone chosen as a printer's ink rather than a screen
   colour. This direction ("Ledger") was picked against five alternatives, all of which
   are still browsable at `mockups/v2/index.html`; the runners-up were a dark data-dense
   terminal, a navy-and-gold institutional treatment, a calm taxpayer-first layout,
   glassmorphism, and a bento grid.

Everything visual resolves from the token block in `src/index.css` plus the scales in
`tailwind.config.js` — the font stack, radii, elevation ramp and every colour. Re-theming
the product means editing those two files, not the feature code.

---

## Where each challenge is demonstrated

The product deliberately doesn't label these anywhere in its UI. For assessment:

| # | Challenge | Where to see it |
| --- | --- | --- |
| **01** | Source Document Traceability | Rivera → **Review**. Any line shows the trace chain, the source document with the exact box highlighted, and the calculation. **Side by side** view gives the document its own full-height column. |
| **02** | Client & CPA Collaboration | Rivera → **Messages** (threads anchored to a line/doc, internal vs client-visible, outstanding requests, owner of next action) and **Notes** (the shared rough tracker). Sign in as the client to watch firm-only content disappear. |
| **03** | Where to Start | Sign in as **Alex Chen** → Home: one hero action, a checklist with states, deferred/locked steps. Plus **Help & guides** — role-aware "start here", FAQ, and support. |
| **04** | Getting Lost / Navigation | Breadcrumbs, "Back to…", the Related rail, ⌘K search, deep links that carry full context — and survive sign-in. |
| **05** | Role-Aware Experiences | The login itself, the sidebar account menu (multi-role switch for Dana), and **People & access** where an administrator really grants and revokes. |
| **06** | Return Status & Progress | Any return → **Status**. One stepper, two audiences; what's next, who owns it, what's blocking. |
| **07** | Actionable Dashboard | **Dashboard** (firm roles). A real ranking function orders work; My work / Whole firm; filters by kind, assignee and blocked. |
| **08** | Clickable vs. Editable | The affordance system — AI / Verified / Needs review / Editable / Locked / Read-only — used on every screen. Reference at **Help → Reading the interface**. |
| **09** | Complexity Made Navigable | **Documents** — ~340 generated files with search, category facets, collapsible hierarchy and summary→detail with context kept beside it. |
| **10** | Trustworthy AI | The **Verity AI** card in Review: what it did, why, evidence behind a disclosure, uncertainty, a prior-year sanity check, and — for ambiguous fields (**Line 7**, **Line 3a**) — a choice between interpretations. Correcting or choosing recomputes the return live. |

---

## Project map

```
src/
  data/        catalog.js (vocabulary) · db.js (seeded generator + hero records)
               ai.js (AI stub) · help.js (guides, FAQ, contextual help)
  lib/         prioritize.js · relationships.js · roles.js · useSimulatedLoad.js
  context/     Theme · Access (role grants) · Session (who/role/history)
               Store (live edits + recompute + notes + activity) · Chrome (breadcrumbs/rail)
  components/  shell/ (Sidebar, AppShell, PageHeader, GlobalSearch, NotificationBell,
                       RelatedObjectsPanel)
               affordances/ (StateBadge, ConfidenceBadge, legend) · ai/ (AIRecommendationCard)
               ui.jsx (primitives, icons, skeletons)
  features/    auth/ · dashboard/ · return/ (workspace, review, source doc viewer) ·
               collaboration/ (threads, notes) · onboarding/ · status/ · documents/ ·
               help/ · admin/ · tour/
mockups/       the three visual directions explored before building (A/B/C)
```

Colour, type and elevation all resolve from CSS custom properties in `src/index.css`, so
the entire product themes light/dark from one block.
