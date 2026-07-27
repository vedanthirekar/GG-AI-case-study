# Vantage - an AI-powered tax platform prototype

## User flow, experience & navigation

The current landing page is the login page, which mainly aims to show the feel of how the login would look. I have created mock profiles for users to log in with - more details about each profile are shown in the demo section itself.

Once signed in, the functionality and UI vary according to the user's role. When logging in for the first time to any role, the site offers a short tour, which the user can also take anytime later if needed.

For navigation help, or if the user gets stuck or confused, there is an AI assistant to turn to. There are also guides and FAQs on the website for each page and workflow.

## What's wired up vs. simulated

**Genuinely wired up**

- **Ask Vantage.** An AI assistant, the user could go to whenever he has a question
  regarding the app, his return, or what to do next. It also has context about the user's
  role, the codebase, the website, whats going on, next processes on top of the tax
  filing process.
- **Role-based access control.** When an admin changes someone's role, it actually
  changes what that person can see and do on the site, not just a label.
- **Prioritization engine.** All the tasks are ranked by due date, how urgent or blocked
  they are, and their stage. The dashboard just shows this live ranking, not a fixed list.
- **Navigation and search.** Things like breadcrumbs, related items, search, and the
  guided tour all work off real data and permissions.

**Simulated**

- **Authentication.** Email must match a seeded account, any password passes. No
  session, no token, no server; signing out just clears React state.
- **AI extraction.** Confidence scores, evidence and candidate interpretations on the
  review screen are a stable-contract stub, not a model call. (Ask Vantage is the one
  exception, its a genuine call to an LLM API.)
- **The data.** A deterministic seeded generator plus a few hand-authored records.
- **Notifications.** These seed from mock data (live actions do push real new items onto
  the feed, just nothing pushed to a backend).

## Decisions

- **Role decides the whole experience after login.** Navigation, wording and permissions
  all vary depending on the role of the signed-in user.
- **The AI assistant only reads and explains, it never edits.** It can answer
  questions and link to pages, but it can't change a number or send a message on
  someone's behalf.
- **One app for every role.** All roles share the same components and the same data.
  But each role has its own level of access to the information.
