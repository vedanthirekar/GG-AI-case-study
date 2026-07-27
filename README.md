# Vantage - an AI-powered tax platform (case-study prototype)

A greenfield, clickable prototype of a tax platform shared by taxpayers and the firms
that serve them, built for the AI Engineer case study. It's **one product** - one shell,
one data model, one sign-in - that answers all ten challenges as real parts of the same
application rather than ten disconnected demos.

> The frontend is the point. Everything behind it is deliberately "quick and dirty":
> generated data, a simulated AI, no real auth, no real parsing. The single exception is
> **Ask Vantage**, which calls a real model through a serverless function - the only
> server in the project, and it exists to keep an API key out of the browser.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

### Optional: the AI assistant

One feature calls a real model - **Ask Vantage**, the assistant in the help drawer. To
enable it, copy `.env.example` to `.env.local` and paste a free
[Google AI Studio](https://aistudio.google.com/apikey) key:

```
GEMINI_API_KEY=your-key-here
```

Restart the dev server afterwards - Vite doesn't hot-reload env changes.

**Without a key the app still works.** Ask Vantage falls back to a deterministic answerer
over the help-centre content and labels every answer as such, so nothing appears broken.

Note the variable has **no `VITE_` prefix**, and must not gain one. Vite inlines every
`VITE_`-prefixed variable into the client bundle, where anyone can read it in DevTools.
The key is read instead by `api/gemini.js`, a serverless function that proxies the call, so
it stays server-side and never reaches the browser. `npm run dev` mounts that same handler
as Vite middleware (see `vite.config.js`), so local and deployed behaviour are identical
and there is only one implementation to keep correct.

### Deploying

The project is connected to this GitHub repo (via `vercel git connect`), so **a push to
`master` builds and deploys to production automatically** - no manual step. Every other
branch and pull request gets its own preview URL instead. `vercel --prod` from the CLI
still works if you need to deploy something that isn't pushed yet, but it's no longer the
normal path; git is.

Set `GEMINI_API_KEY` in the Vercel project's environment variables (Production scope is
enough - it's not required for previews to build, they just fall back to the deterministic
answerer same as running with no key locally). Two pieces of configuration matter:

- **`vercel.json`** rewrites every non-`/api` path to `index.html`. The app uses
  `BrowserRouter`, so `/dashboard` and `/returns/r-rivera` have no file behind them -
  without the rewrite, refreshing any page except `/` returns 404.
- **`api/gemini.js`** runs on the Edge runtime because the response is a stream; the SSE
  body from Google is piped straight through so answers still type out token by token.

The endpoint is unauthenticated - it protects the key, not the quota - so it caps system
size, turn count and turn length. Real protection is a signed session, which this
prototype deliberately doesn't have.

**Stack:** React 18 · Vite · Tailwind · react-router · framer-motion.
State is in-memory: **a page refresh signs you out and resets every edit.** That's a
deliberate prototype trade-off, not a bug.

---

## Signing in

The app opens on a real sign-in screen. Under **Evaluating this?** there's a
**Use a demo account** dropdown - pick one, it fills the credentials and shows you who
you're about to be, then sign in. **Any password works.**

The picker is deliberately one collapsed control rather than a browsable roster: the
front door should look like a front door. The identities below are scaffolding for
assessment, not part of the product.

| Account | Email | What you'll see |
| --- | --- | --- |
| **Dana Morales** | `dana.morales@vantage.tax` | Preparer **+ her own personal return** - the multi-role case |
| **Sam Okafor** | `sam.okafor@vantage.tax` | Reviewer - approves filing, sees every internal note |
| **Priya Nair** | `priya.nair@vantage.tax` | Firm administrator - controls **People & access** |
| **Jordan Lee** | `jordan.lee@vantage.tax` | Seasonal staff - reduced permissions, assigned work only |
| **Jordan Rivera** | `j.rivera@gmail.com` | Returning taxpayer, return mid-review |
| **Alex Chen** | `alex.chen@outlook.com` | Brand-new client - **first-run onboarding** |
| **Maya Torres** | `maya@torresdesign.co` | Business owner - 1120-S |

To try another account, **Sign out** from the menu at the foot of the sidebar and pick a
different one. There is no in-app identity switcher: becoming a different person
mid-session is a demo trick no real platform offers, and having it there taught the wrong
thing about what this is. What the menu *does* keep is the **role** switch for Dana, who
genuinely holds two - same login, her firm work and her own return.

**A deep link survives sign-in.** Paste `/returns/r-rivera?tab=review&field=f-7` while
signed out: after you authenticate it opens that exact field, rather than dumping you on
a dashboard.

---

## Start with the tour

Click **Show me around** in the top bar. The tour is assembled for whoever is signed in:
a taxpayer gets seven steps about their own return, an admin gets five about running the
practice, a preparer gets the review workflow. It never switches account - it runs as
*you*, navigating the real application and spotlighting the relevant UI, and every path
resolves against your own work. Sign in as two different people to see two different
tours. (`→`/`←` to move, `Esc` to exit.)

The first time you land in any role, a card offers the tour once and then leaves you
alone - dismissed is dismissed, for that role, for the session. It never auto-starts:
a product that seizes the screen before you've looked at anything teaches you to
dismiss things.

---

## The things worth clicking

**Live recompute.** Open Jordan Rivera's return → **Review** → **Line 7**. The AI is only
68% confident, so instead of guessing it offers two defensible readings. Choose *"Assume
$0 basis on 2 lots"*: the gain becomes **$8,910**, every dependent locked line (total
income → AGI → taxable → tax) recomputes with a highlight flash, the **refund moves
$6,789 → $6,453**, and the verified counter goes 7/13 → 8/13. Nothing here is a static
mock.

**Side by side.** In the same screen, switch **View** to *Side by side*. The source
document opens at full height in its own column - page through it, zoom, and the matched
box follows whichever line you select.

**Review queue.** Click **Review queue** to walk only the flagged lines from the
keyboard: `j`/`k` to move, `a` to accept, `esc` to exit.

**Shared notes.** The **Notes** tab is a rough tracker both sides can write on. Add one
as Dana marked *Firm only*, then sign in as Jordan Rivera - it isn't there. The count on
the tab drops from 4 to 3.

**Access that actually applies.** Sign in as **Priya Nair** → **People & access** → give
Jordan Lee the **Reviewer** role. Sign in as Jordan Lee and the approve action is
unlocked and internal notes appear. Try removing someone's last role and it's refused,
with an explanation.

**Document ingestion.** Any return's **Documents** tab → **Add a document**: a simulated
extraction reveals fields with rising confidence, then lands as a new, fully traceable
line on the return.

**Ask Vantage.** The ✨ in the top bar (or the second tab of the `?` drawer) opens an
assistant that is grounded in three things at once: the app's written knowledge, the *live*
permission model, and the screen you're on. Sign in as **Jordan Lee** (seasonal staff) and
ask *"why can't I approve this return?"* - the answer comes from the same `CAPS` map the app
enforces against, not from a guess. Open Rivera's return as Dana and ask *"what's blocking
this?"* - it reads the live store, so after you change Line 7 the numbers it quotes move
with it. It cites the help-centre entry it used, and every link it offers is validated
against the real route table before it renders.

Also: **⌘K** searches everything, and **?** opens help for the screen you're on.

---

## What's real vs. simulated

**Genuinely wired up - real code doing real work:**

- **A live store + recompute engine** (`src/context/StoreContext.jsx`). Verifying,
  correcting, choosing an interpretation, adding a note or ingesting a document all
  write to it; dependent locked lines and the refund recompute through a simplified but
  real 2025 MFJ bracket function, and every counter, badge and status follows.
- **Role access control** (`src/context/AccessContext.jsx` + `src/lib/roles.js`). The
  administrator's grants are the authority - `SessionContext` resolves a user's roles
  through them, so a change genuinely alters what that person can see and do. Guardrails
  (last role, sign-off confirmation) are real logic, and the People & access screen
  generates its permission descriptions from the same `CAPS` map the app enforces
  against, so the two can't drift.
- **The prioritisation engine** (`src/lib/prioritize.js`) - scores and ranks every task
  by due date, blocking, kind and stage. The dashboard is driven by it, across 113 tasks.
- **The relationship graph** (`src/lib/relationships.js`) - derives object connections
  from IDs; powers the Related rail and cross-object navigation.
- **Search, filtering, faceting and progressive disclosure** over the full generated set.
- **The status state machine**, breadcrumbs, deep links, and the affordance system.
- **The tour engine** - one pool of steps filtered by role and by live conditions, driving
  real navigation and spotlighting against the signed-in user's own records.
- **Ask Vantage** (`src/lib/assistant.js`, `src/lib/gemini.js`, `api/gemini.js`) - **the one
  place a real model is called**, and the one real server in the project: a serverless
  function holds the API key so it never ships to the browser.
  Its system brief is *compiled* from the app's own sources (`help.js`,
  `catalog.js`, `roles.js`) rather than restated, so it can't drift from what the product
  does; its live context is assembled from `SessionContext` + `StoreContext`, so it quotes
  current figures rather than seed data. Permission is enforced at assembly - firm-only
  notes and other clients' returns are never placed in a client's prompt, so there is
  nothing to leak. Replies are parsed for links, which are validated against the real route
  table and the active role's reach before they render, and for citations, which resolve to
  real help-centre entries.



**Simulated - fabricated but plausible, by design:**

- **Authentication.** The email must match a seeded account; any password is accepted.
  There is no session, no token, no server. Signing out just clears React state.
- **AI extraction** (`src/data/ai.js`) - the confidence scores, evidence and candidate
  interpretations on the review screen are a stub with a stable contract, derived
  deterministically from each mock field. No model is called *there*. The case study is about
  how you present and build trust around AI output, so that surface is deliberately faked
  while the trust design around it is real. (**Ask Vantage is the exception** - that one is a
  genuine API call, listed above.)
- **Document parsing / OCR** - documents are hardcoded objects carrying "boxes"; the
  highlighted region is a lookup, not extraction. Page and zoom controls are real UI over
  fake paper.
- **The data** (`src/data/db.js`) - a deterministic seeded generator makes ~64 returns,
  ~340 documents and ~113 tasks, plus hand-authored hero records (Rivera's fully
  traceable 1040, Alex's onboarding, the seeded notes) so the key screens have depth.
- **Notifications** - the activity feed is seeded from the mock data; live actions push
  genuine new items onto it, but nothing is pushed from a server.
- **Loading states** - route and filter changes show a deliberate ~260ms skeleton
  (`src/lib/useSimulatedLoad.js`). With no backend, everything would otherwise appear
  instantly and the loading design would never be visible.
- **Persistence** - none. Refreshing resets everything.

---

## Design decisions worth explaining

1. **One product, not ten demos.** Every capability lives inside a single shell with
   shared components. Traceability, affordances, status and AI trust reuse the same
   primitives - which is the actual test of whether the system is coherent.
2. **Identity is the entry point.** A platform serving six roles can't open on a
   role-switcher dropdown; that's a demo affordance, not a product. You sign in as
   someone, and the whole surface - navigation, permissions, vocabulary - resolves from
   who that is. The demo-account picker keeps it one click for anyone evaluating it.
3. **Permissions are communicated, not just enforced - within reach.** An action you
   can't use on a screen you're already on stays visible, with a tooltip naming *which
   role* has it. Hiding those would leave two colleagues with different mental models of
   the same product and no way to discover what they'd need. The line is drawn at whole
   sections: **People & access** belongs to one job, so it isn't in anyone else's rail -
   a permanently shut door in the navigation is clutter, not communication. The route
   guard, not the missing link, is what enforces it.
4. **Same status, two audiences.** Rather than inventing separate client and staff status
   systems - the root cause of people reading statuses differently - there's one ordered
   stage vocabulary with audience-appropriate labels and depth.
5. **Trust through layered transparency.** The AI card leads with a plain summary and
   confidence; technical evidence is one tap away. Showing everything at once was
   explicitly not the goal. Uncertainty and the correction path are first-class, and
   where a figure is genuinely ambiguous the AI presents both readings and asks rather
   than guessing.
6. **Two kinds of conversation.** Threads carry an owner and a resolution; notes are the
   quick shared scratchpad that would otherwise end up in email. Collapsing them into one
   inbox is how communication becomes noise.
7. **Deep-linkable state.** Selection lives in the URL - including the review layout - so
   you can land mid-context, and the breadcrumb plus Related rail reconstruct where you
   are. Sign-in preserves it too.
8. **The visual language is an argument, not a default.** A tax return is a printed
   instrument, so the interface is built like one: a serif (Newsreader) for headings over
   a humanist sans (IBM Plex Sans), tabular mono (IBM Plex Mono) for every figure, hairline
   rules instead of drop shadows, near-square corners, and status shown as a ruled print
   mark rather than a filled pill. Colour is deliberately scarce - warm stock, ink, and a
   single blue, with each semantic tone chosen as a printer's ink rather than a screen
   colour. This direction ("Ledger") was picked against five alternatives, all of which
   are still browsable at `mockups/v2/index.html`; the runners-up were a dark data-dense
   terminal, a navy-and-gold institutional treatment, a calm taxpayer-first layout,
   glassmorphism, and a bento grid.

   There is **no dark mode**, and that is the same argument rather than an omission. A
   printed instrument has one stock; a second palette would have meant maintaining two
   arguments and hedging on the one that was chosen.

9. **An assistant did not replace the documentation.** The obvious move once you have a
   working LLM is to delete the FAQ. That's backwards twice over: the written guides are
   the assistant's grounding corpus, so deleting them makes it worse, and they answer a
   different question. A help centre answers *the* questions - browsable, scannable,
   deep-linkable, correct when the network is down. The assistant answers *your* question,
   about your role and your return. So they were wired together instead: the assistant
   cites the guide it drew on, and a help search that finds nothing hands the query
   straight to it. Same argument the product already makes about tax figures - show where
   it came from.
10. **The assistant reads; it never writes.** It can explain, and it can navigate you
   somewhere - with links checked against the real route table so it cannot offer a dead
   end or point a taxpayer at a firm screen. It cannot verify a line, correct a figure or
   send a message. In a product whose entire claim is that every number is traceable to a
   person's decision, letting a model quietly make one of those decisions would undercut
   the thing being demonstrated.

Everything visual resolves from the token block in `src/index.css` plus the scales in
`tailwind.config.js` - the font stack, radii, elevation ramp and every colour. Re-theming
the product means editing those two files, not the feature code.

---

## Where each challenge is demonstrated

The product deliberately doesn't label these anywhere in its UI. For assessment:

| # | Challenge | Where to see it |
| --- | --- | --- |
| **01** | Source Document Traceability | Rivera → **Review**. Any line shows the trace chain, the source document with the exact box highlighted, and the calculation. **Side by side** view gives the document its own full-height column. |
| **02** | Client & CPA Collaboration | Rivera → **Messages** (threads anchored to a line/doc, internal vs client-visible, outstanding requests, owner of next action) and **Notes** (the shared rough tracker). Sign in as the client to watch firm-only content disappear. |
| **03** | Where to Start | Sign in as **Alex Chen** → Home: one hero action, a checklist with states, deferred/locked steps. Plus **Help & guides** - role-aware "start here", FAQ, and support - and **Ask Vantage**, which answers from your actual role and screen when the written guides don't cover it. |
| **04** | Getting Lost / Navigation | Breadcrumbs, "Back to…", the Related rail, ⌘K search, deep links that carry full context - and survive sign-in. |
| **05** | Role-Aware Experiences | The login itself, the sidebar account menu (multi-role switch for Dana), and **People & access** where an administrator really grants and revokes. |
| **06** | Return Status & Progress | Any return → **Status**. One stepper, two audiences; what's next, who owns it, what's blocking. |
| **07** | Actionable Dashboard | **Dashboard** (firm roles). A real ranking function orders work, presented as a ledger: click **Work**, **Severity** or **Due** to re-sort, and the live column is marked - so "why is this first?" is answerable from the table. Search by client, filter by kind, severity, assignee and blocked. A preparer toggles *Assigned to me / All staff*; a reviewer and an administrator are firm-wide by definition, so they get no redundant switch. |
| **08** | Clickable vs. Editable | The affordance system - AI / Verified / Needs review / Editable / Locked / Read-only - used on every screen. Reference at **Help → Reading the interface**. |
| **09** | Complexity Made Navigable | **Clients** - ~340 generated files, opened *by client* rather than as one flat pile, with anything outstanding sorted first. Search still reaches every document you can see, so one file by name is one step. Inside a client: category facets, collapsible hierarchy, and summary→detail with context kept beside it. |
| **10** | Trustworthy AI | The **Vantage AI** card in Review: what it did, why, evidence behind a disclosure, uncertainty, a prior-year sanity check, and - for ambiguous fields (**Line 7**, **Line 3a**) - a choice between interpretations. Correcting or choosing recomputes the return live. And **Ask Vantage** - a real model call, grounded in live session state, that cites its sources, validates every link it offers, refuses to give tax advice, and cannot change anything. |

---

## Project map

```
src/
  data/        catalog.js (vocabulary) · db.js (seeded generator + hero records)
               ai.js (extraction stub) · help.js (guides, FAQ, contextual help)
               assistantBrief.js (what the assistant knows about the product)
  lib/         prioritize.js · relationships.js · roles.js · useSimulatedLoad.js
               gemini.js (streaming client) · assistant.js (grounding + link validation)
               assistantFallback.js (keyless/offline answerer)
  context/     Access (role grants) · Session (who/role/history)
               Store (live edits + recompute + notes + activity) · Chrome (breadcrumbs/rail)
               Assistant (conversation, grounded per turn)
  components/  shell/ (Sidebar, AppShell, PageHeader, GlobalSearch, NotificationBell,
                       RelatedObjectsPanel)
               affordances/ (StateBadge, ConfidenceBadge, legend) · ai/ (AIRecommendationCard)
               ui.jsx (primitives, icons, skeletons)
  features/    auth/ · dashboard/ · return/ (workspace, review, source doc viewer) ·
               collaboration/ (threads, notes) · onboarding/ · status/ · documents/ ·
               help/ (centre + two-tab drawer) · assistant/ · admin/ · tour/
mockups/       v2/ the six visual directions; "Ledger" (d1) is what shipped
```

Colour, type and elevation all resolve from CSS custom properties in `src/index.css`, so
re-theming the entire product is one block of tokens rather than a pass over the
components.
