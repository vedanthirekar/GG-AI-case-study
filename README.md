# Vantage - an AI-powered tax platform (case-study prototype)

## User flow, experience & navigation

The current landing page is the login page, which mainly aims to show the feel of how the login would look. I have created mock profiles for users to log in with - more details about each profile are shown in the demo section itself.

Once signed in, the functionality and UI vary according to the user's role. When logging in for the first time to any role, the site offers a short tour, which the user can also take anytime later if needed.

For navigation help, or if the user gets stuck or confused, there is an AI assistant to turn to. There are also guides and FAQs on the website for each page and workflow.


## What's wired up vs. simulated

**Genuinely wired up**

- **Ask Vantage.** An AI assistant, the user could go to whenever he has question
  regarding the app, his return, or what to do next. It also has context about the user's
  role, the codebase, the website, whats going on, next processes on top of the tax
  filing process.
- **Role-based access control.** When an admin changes someone's role, it actually
  changes what that person can see and do on the site, not just a label.
- **Prioritization engine.** All the tasks are ranked by due date, how urgent or blocked
  they are, and their stage. The dashboard just shows this live ranking, not a fixed list.
- **Navigation and search.** Things like breadcrumbs, related items, search, and the
  guided tour all work off real data and permissions.
- **Live store and recompute engine.** Whenever the user edits, verifies, or corrects a
  number, it updates the central store right away. Every other number connected to it,
  like the refund, updates too, using a real tax calculation.



**Simulated**

- **Authentication** - email must match a seeded account, any password passes. No
  session, no token, no server; signing out just clears React state.
- **AI extraction** (`data/ai.js`) - confidence scores, evidence and candidate
  interpretations on the review screen are a stable-contract stub, not a model call. (Ask Vantage is the one exception, its a genuine call to an LLM API)
- **Document parsing/OCR** - documents are hardcoded objects with "boxes"; the
  highlighted region is a lookup, not extraction.
- **The data** (`data/db.js`) - a deterministic seeded generator (~64 returns, ~340
  documents, ~113 tasks) plus a few hand-authored hero records for depth.
- **Notifications** seed from mock data (live actions do push real new items onto the
  feed, just nothing server-pushed).
- **Persistence** - none; a refresh resets everything.



## Decisions worth explaining

- **One app for every role, not six separate ones.** All roles share the same
  components and the same data. Only what's visible and what's allowed changes,
  based on the signed-in role.
- **Role decides the whole experience after login**, instead of a manual switcher.
  Navigation, wording and permissions all come from who signed in.
- **Locked actions stay visible with a reason**, but only on screens the user can
  already reach. Whole sections meant for a different role, like admin tools, are
  hidden completely instead of shown locked.
- **One status system, shown two ways.** Client and staff see the same underlying
  status, just worded and detailed differently for each audience, instead of two
  systems that could fall out of sync.
- **The AI assistant only reads and explains, it never edits.** It can answer
  questions and link to pages, but it can't change a number or send a message on
  someone's behalf.
- **The AI on the review screen shows a short summary first**, with evidence
  available on tap instead of dumped all at once. If it isn't confident, it asks
  the user to choose instead of guessing.
- **The visual style is built to look like an actual tax document** - serif
  headings, monospace numbers, minimal color, hairline rules instead of shadows,
  and no dark mode. Every color and spacing value comes from one token file
  (`src/index.css`), so the whole look can be changed from one place.
