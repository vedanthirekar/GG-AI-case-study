# Vantage - an AI-powered tax platform (case-study prototype)

## User flow, experience & navigation

The current landing page is the login page, which mainly aims as showing the feel of how the login would look like. I have created mock profiles for user to login with. more details about each profile are shown in the demo section itself.

Once signed in, the Functionality and UI varies according to the roles. When logging in for the first time to any role, the site offers a short tour or the user can take the tour anytime if needed.

For navigability, being stuck or confused, there is mainly AI assitant to get help from. There are also guides and faqs in the website for each page, workflow.

---

## What's wired up vs. simulated

**Genuinely wired up - real code doing real work:**

- **Ask Vantage.** An AI assistant, the user could go to whenever he has question
  regarding the app, his return, or what to do next. It also has context about the user's
  role, the codebase, the website, whats going on, next processes on top of the tax
  filing process.
- **Live store and recompute engine.** Whenever the user edits, verifies, or corrects a
  number, it updates the central store right away. Every other number connected to it,
  like the refund, updates too, using a real tax calculation.
- **Role-based access control.** When an admin changes someone's role, it actually
  changes what that person can see and do on the site, not just a label.
- **Prioritization engine.** All the tasks are ranked by due date, how urgent or blocked
  they are, and their stage. The dashboard just shows this live ranking, not a fixed list.
- **Navigation and search.** Things like breadcrumbs, related items, search, and the
  guided tour all work off real data and permissions, not something hardcoded per page.


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
