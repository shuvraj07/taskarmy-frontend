# TaskArmy Frontend Architecture

This frontend is a **Next.js 14** app using the **App Router**, written in **TypeScript** with **Tailwind CSS**.

It is built as a small dashboard for two user roles:

- `tasker`: the person posting jobs
- `taskarmy`: the person browsing jobs and placing bids

The app separates these workflows into dedicated routes and shared UI components.

## Folder structure

```txt
app/
  globals.css                    Global Tailwind setup and base styles
  layout.tsx                     Root HTML shell and metadata
  page.tsx                       Homepage and role navigation
  bids/page.tsx                  Bid-related overview page
  login/page.tsx                 Login screen for Tasker and TaskArmy
  profile/page.tsx               Shared profile page
  register/page.tsx              Registration screen for both roles
  sample/page.tsx                Sample/demo page
  taskarmy/dashboard/page.tsx    TaskArmy dashboard
  taskarmy/profile/page.tsx      TaskArmy profile page
  taskarmy/tasks/page.tsx        Marketplace and bid placement for TaskArmy users
  tasker/dashboard/page.tsx      Tasker dashboard
  tasker/tasks/page.tsx          Task creation, management, and bid handling for Taskers
components/
  app-shell.tsx                  Page layout wrapper and shared navigation
  query-provider.tsx             Client-side query/provider wrapper
  task-card.tsx                  Reusable task listing card
  ui.tsx                         Shared buttons, fields, cards, status boxes
hooks/
  useBids.ts                     Reusable bid data hook
  useTasks.ts                    Reusable task data hook
lib/
  api.ts                         API client and typed backend request helpers
  schemas.ts                     Shared validation/data schemas
  session-store.ts               localStorage helpers for auth sessions and API URL
  types.ts                       TypeScript types for roles, sessions, tasks, bids, and API envelopes
docs/
  architecture.md                Project architecture documentation
middleware.ts                    Next.js middleware for request/route handling
next.config.mjs                  Next.js configuration
tailwind.config.ts               Tailwind CSS configuration
tsconfig.json                    TypeScript configuration
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

`components/query-provider.tsx` provides the client-side provider wrapper used by the app.

`hooks/` stores reusable React hooks that keep page components smaller.

## Component-by-component architecture

### `components/app-shell.tsx`

**Main responsibility:** Provides the shared application frame for authenticated/dashboard pages.

It includes:

- top navigation links
- active route highlighting with `usePathname`
- API base URL editor
- session status pills for `tasker` and `taskarmy`
- logout actions for each role

It depends on:

- `next/link` for navigation
- `next/navigation` for the current route
- `lucide-react` for navigation icons
- `lib/session-store.ts` for reading/writing browser session data
- `components/ui.tsx` for the logout button

Improvement ideas:

- Move the `links` array into a separate config file, such as `lib/navigation.ts`.
- Split `SessionPill` into its own file if it is reused elsewhere.
- Hide role-specific links when the matching role is signed out.
- Move API URL editing into a settings page when the app becomes production-focused.
- Add route guards so signed-out users cannot access dashboard pages directly.

### `AuthShell` in `components/app-shell.tsx`

**Main responsibility:** Provides a simpler layout for authentication pages.

It includes:

- TaskArmy brand header
- login/register navigation
- centered content wrapper for auth forms

Improvement ideas:

- Keep this shell separate from dashboard-only behavior.
- Move it to `components/auth-shell.tsx` if the file grows.
- Add responsive form width rules here so login/register pages stay visually consistent.

### `components/query-provider.tsx`

**Main responsibility:** Creates and provides the React Query client.

It wraps the app with:

- `QueryClientProvider`
- a stable `QueryClient` instance created with `useState`

Improvement ideas:

- Add default query options, such as retry count, stale time, and refetch behavior.
- Add React Query Devtools in development.
- Keep API fetching logic inside hooks so pages do not call React Query directly everywhere.

### `components/task-card.tsx`

**Main responsibility:** Renders task information in reusable card layouts.

It supports:

- `compact` variant for dashboard/task management views
- `marketplace` variant for TaskArmy browsing
- optional `action` content for buttons or forms
- poster name/email fallback handling
- task budget, status, deadline, and accepted bid display

It depends on:

- `Task` type from `lib/types.ts`
- internal helpers for poster display, date formatting, and status formatting

Improvement ideas:

- Move date/status formatting helpers into `lib/formatters.ts`.
- Add stronger empty-state handling for missing budgets or invalid dates.
- Make status labels consistent with backend status values.
- Split marketplace and compact variants if this file becomes harder to maintain.
- Add tests for poster fallback logic because it handles many possible backend shapes.

### `components/ui.tsx`

**Main responsibility:** Provides shared UI primitives used across pages.

It currently contains:

- `Button`
- `Field`
- `TextArea`
- `SelectField`
- `PageHeader`
- `Card`
- `StatusBox`

Improvement ideas:

- Split larger primitives into separate files as the design system grows.
- Add `error`, `helperText`, and `disabled` states to form fields.
- Add `size` props to `Button` instead of passing size through `className`.
- Make `Card` accept semantic variants only when repeated page patterns appear.
- Keep these components simple and avoid putting page-specific logic inside them.

### `hooks/useTasks.ts`

**Main responsibility:** Centralizes task fetching and task mutations.

Expected usage:

- Tasker dashboard/task pages can call it for owned tasks.
- TaskArmy task pages can call it for marketplace browsing.
- Pages stay smaller because task API state lives in the hook.

Improvement ideas:

- Keep query keys consistent and exported.
- Invalidate related task queries after create, update, delete, or bid actions.
- Return clear loading, error, and empty states for page components.

### `hooks/useBids.ts`

**Main responsibility:** Centralizes bid fetching and bid mutations.

Expected usage:

- Bids overview can show the current user's bids.
- Tasker pages can accept or reject bids.
- TaskArmy pages can place bids on marketplace tasks.

Improvement ideas:

- Keep bid query keys in one place.
- Invalidate both bid and task queries after bid status changes.
- Add optimistic updates only after the basic server flow is reliable.

## Design decisions

- **Next.js App Router** gives route-based folders and simple nested pages.
- **TypeScript** ensures API payloads, state, and page props are typed.
- **Tailwind CSS** is used for fast, consistent dashboard styling.
- **Local state + localStorage** is enough for session handling in this app size.
- **Middleware** gives the app a single place for request-level route behavior.

## Environment configuration

The app defaults to `http://127.0.0.1:8000` for the backend.

To use another backend URL, set:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com
```

If not set, the app will still use the default local base URL.

## Routes overview

- `/` - Home page
- `/login` - Login
- `/register` - Register
- `/profile` - Shared profile page
- `/bids` - Bids overview
- `/sample` - Sample/demo page
- `/taskarmy/dashboard` - TaskArmy dashboard
- `/taskarmy/profile` - TaskArmy profile page
- `/taskarmy/tasks` - TaskArmy marketplace and bid placement
- `/tasker/dashboard` - Tasker dashboard
- `/tasker/tasks` - Tasker task management

## Recommended next steps

- Add tests for the API client and page workflows
- Add stronger session validation and route guards
- Turn repeated fetch code into reusable hooks
- Expand the route tree with separate dashboard pages for each role
