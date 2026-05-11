# TaskArmy Frontend Architecture

This frontend is a **Next.js 14** app using the **App Router**, written in **TypeScript** with **Tailwind CSS**.

It is built as a small dashboard for two user roles:

- `tasker`: the person posting jobs
- `taskarmy`: the person browsing jobs and placing bids

The app separates these workflows into dedicated routes and shared UI components.

## Folder structure

```txt
app/
  globals.css        Global Tailwind setup and base styles
  layout.tsx         Root HTML shell and metadata
  page.tsx           Homepage and role navigation
  login/page.tsx     Login screen for Tasker and TaskArmy
  register/page.tsx  Registration screen for both roles
  profile/page.tsx   User profile page
  bids/page.tsx      Bid-related overview page
  taskarmy/tasks/page.tsx  Marketplace and bid placement for TaskArmy users
  tasker/tasks/page.tsx   Task creation, management, and bid handling for Taskers
components/
  app-shell.tsx      Page layout wrapper and shared navigation
  task-card.tsx      Reusable task listing card
  ui.tsx             Shared buttons, fields, cards, status boxes
lib/
  api.ts             API client and typed backend request helpers
  session-store.ts   localStorage helpers for auth sessions and API URL
  types.ts           TypeScript types for roles, sessions, tasks, bids, and API envelopes
docs/
  architecture.md    Project architecture documentation
```

## Core app behavior

- `app/layout.tsx` defines the root HTML structure and global metadata.
- `app/globals.css` contains global styling and Tailwind configuration.
- `app/page.tsx` is the home page with quick access to login, register, and the TaskArmy task browser.
- Nested folders like `app/taskarmy/tasks` become routes like `/taskarmy/tasks`.

This makes the app easy to navigate and keeps each role's workflow isolated.

## API layer

`lib/api.ts` contains the backend client and a shared fetch wrapper.

It provides typed methods such as:

- `login` and `register`
- `createTask`, `myTasks`, `updateTask`, `deleteTask`, `acceptBid`, `rejectBid`
- `browseTasks`, `placeBid`, `myBids`
- `root`, `health`

All requests return a normalized `ApiEnvelope<T>` shape, so pages can handle success/failure uniformly.

## Session storage

`lib/session-store.ts` saves user sessions in browser `localStorage`.

It keeps:

- separate tokens for `tasker` and `taskarmy`
- the API base URL

This lets the app switch roles without losing the other session and keeps auth state available on page reload.

## UI components

`components/ui.tsx` defines shared UI primitives:

- `Button`
- `Field`
- `TextArea`
- `SelectField`
- `PageHeader`
- `Card`
- `StatusBox`

These keep appearance consistent across pages and reduce duplicate markup.

`components/task-card.tsx` is used to render task listings in feeds and marketplaces.

## Design decisions

- **Next.js App Router** gives route-based folders and simple nested pages.
- **TypeScript** ensures API payloads, state, and page props are typed.
- **Tailwind CSS** is used for fast, consistent dashboard styling.
- **Local state + localStorage** is enough for session handling in this app size.

## Environment configuration

The app defaults to `http://127.0.0.1:8000` for the backend.

To use another backend URL, set:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com
```

If not set, the app will still use the default local base URL.

## Routes overview

- `/` — Home page
- `/login` — Login
- `/register` — Register
- `/profile` — Profile page
- `/bids` — Bids overview
- `/taskarmy/tasks` — TaskArmy marketplace and bid placement
- `/tasker/tasks` — Tasker task management

## Recommended next steps

- Add tests for the API client and page workflows
- Add stronger session validation and route guards
- Turn repeated fetch code into reusable hooks
- Expand the route tree with separate dashboard pages for each role
