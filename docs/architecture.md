# Taskzity Frontend Architecture

This is the frontend for **Taskzity** (a.k.a. TaskArmy), a task marketplace where one
role posts work and the other bids on and completes it. It is a **Next.js 14** app
using the **App Router**, written in **TypeScript**, styled with **Tailwind CSS**.
It talks to a separate backend over HTTP — there is no server logic or database in
this repo.

Two roles:

- `client` — posts tasks (backend calls this role `tasker`)
- `tasker` — browses tasks, bids, and delivers work (backend calls this role `taskarmy`)

The frontend renamed the roles for clarity. The translation between frontend and
backend role names happens in exactly one place — see
[Roles: frontend vs backend](#roles-frontend-vs-backend) below. Don't assume `tasker`
means the same thing in a network payload as it does in a frontend type.

## Folder structure

```txt
src/
  app/
    layout.tsx                      Root HTML shell, global metadata
    page.tsx                        Home page
    error.tsx, global-error.tsx     App Router error boundaries
    globals.css                     Tailwind base styles
    (auth)/
      login/page.tsx                Google OAuth sign-in
      register/page.tsx             Registration
      onboarding/role/page.tsx      Role picker for brand-new Google sign-ins
    (client)/
      client/dashboard/page.tsx     Client dashboard
      client/tasks/page.tsx         Client's posted tasks
    (tasker)/
      tasker/dashboard/page.tsx     Tasker dashboard
      tasker/tasks/page.tsx         Marketplace browsing + bidding
      tasker/profile/[id]/page.tsx  Public tasker profile
    (shared)/                       Routes used by both roles
      profile/page.tsx
      bids/page.tsx                 Bids overview / feed
      mybids/page.tsx                Bids the current user placed
      task/[taskId]/files/page.tsx  File exchange for one task
      (payment)/
        wallet/page.tsx             Simulated wallet balance + escrow
        payouts/page.tsx            Simulated payout confirmation
  components/
    ui/                  Design-system primitives (Button, Field, Card, ...)
    layout/              Navbar (AppShell) and AuthShell
    providers/           QueryProvider (React Query)
    task/                Task card, filters, create-task form
    bid/                 Bid feed card, modals, sidebar, bottom nav
    task-files/           File exchange feature (drop zone, activity log, etc.)
    account/             Session card, tasker profile card
    shared/skeletons/    Loading skeletons
  hooks/                 React Query hooks + small client-side state machines
  lib/
    api/                 Typed backend client (one file per resource)
    payment/             wallet-store.ts (simulated escrow, Zustand)
    types.ts             Re-exports of domain types + ApiEnvelope
    schemas.ts           Zod schemas for validating API responses
    session-store.ts      localStorage/cookie session persistence + role mapping
    task-files.ts         Task/file fetch-with-fallback helpers
    format.ts, utils.ts   Formatting and small utilities
  types/                 Domain types: user.ts, task.ts, bid.ts
  middleware.ts          Route-guard middleware for /client/* and /tasker/*
```

(`app/(groupName)/...` folder names in parentheses are route groups — they organize
files but don't appear in the URL.)

## Roles: frontend vs backend

The backend's role names (`tasker`, `taskarmy`) and the frontend's role names
(`client`, `tasker`) collide on the word "tasker" but mean different things. All
translation lives in [`lib/session-store.ts`](../src/lib/session-store.ts):

```ts
mapBackendRoleToFrontend("tasker")   -> "client"
mapBackendRoleToFrontend("taskarmy") -> "tasker"
mapFrontendRoleToBackend("client")   -> "tasker"
mapFrontendRoleToBackend("tasker")   -> "taskarmy"
```

`lib/schemas.ts` has a separate `backendRoleSchema` (`"tasker" | "taskarmy"`) used only
for validating data straight off the wire, before it passes through that mapping.

## Auth flow

Login is Google OAuth only (see [`app/(auth)/login/page.tsx`](../src/app/(auth)/login/page.tsx)):

1. User clicks "Continue with Google" (`useGoogleLogin`), gets a Google access token.
2. Frontend fetches the user's email/name/picture from Google's userinfo endpoint.
3. Frontend exchanges the Google token for a backend JWT via
   `authApi.googleLogin` → `POST /auth/google/token`.
4. Frontend calls `authApi.me` → `GET /auth/me` to find out if this user already has
   a role (the token-exchange response never includes one).
   - Role known → session saved, redirect to `/bids`.
   - No role yet (new user) → temp session saved, redirect to `/onboarding/role`.
5. [`lib/session-store.ts`](../src/lib/session-store.ts) persists the session to
   `localStorage` (`taskzity.sessions`) **and** mirrors the token into a cookie
   (`client_token` / `tasker_token`), because...
6. [`middleware.ts`](../src/middleware.ts) checks that cookie on every request to
   `/client/*` or `/tasker/*` and redirects to `/login` if it's missing or expired.
7. [`hooks/use-auth.ts`](../src/hooks/use-auth.ts) is a Zustand store wrapping
   `session-store.ts` so every component calling `useAuth()` re-renders on session
   changes (login, logout, another tab) from one shared subscription.

JWTs are decoded client-side (payload only, no signature check) just to read role and
expiry — see `isTokenExpired` / `readCurrentUserId` in `session-store.ts`.

## API layer

`lib/api/` has one file per backend resource (`auth.ts`, `tasks.ts`, `bids.ts`,
`files.ts`), all built on [`lib/api/client.ts`](../src/lib/api/client.ts):

- `request<T>()` — JSON fetch wrapper, always returns a normalized
  `ApiEnvelope<T>` (`{ ok, status, data, error }`) so pages never juggle raw
  fetch/try-catch logic.
- `requestFormData<T>()` — same envelope, for file uploads.
- `validateResponse()` — optionally parses a successful envelope's `data` against a
  Zod schema from `lib/schemas.ts`, turning a bad payload shape into a normal `ok:
  false` error instead of a runtime crash downstream.

`lib/api/files.ts` also smooths over a backend quirk: a 404 from
`GET /files/task/:id` (no files yet) is treated as a successful empty list, not an
error.

## Data fetching hooks

`hooks/use-tasks.ts`, `use-bids.ts`, and `use-task-files.ts` wrap the API layer in
TanStack Query (`useQuery`/`useMutation`), so pages get `data` / `isLoading` /
`isError` without touching fetch logic directly:

- `use-tasks.ts` — `useMyTasks`, `useBrowseTasks` (polls every 15s),
  `useCreateTask`, `useUpdateTask`, `useDeleteTask`.
- `use-bids.ts` — `useMyBids`, `usePlaceBid`, `useReviewBid` (accept/reject).
- `use-task-files.ts` — task detail + file list fetching, upload (with simulated
  progress), delete, submit/approve/request-revision. `useApproveTaskWork` also
  releases escrow in the wallet store on success.

Mutations invalidate the relevant React Query keys (`["tasks"]`, `["bids"]`,
`["task-files", taskId]`, etc.) on success rather than manually patching cache.

`hooks/use-tasker-step-machine.ts` is a separate `useReducer`-based state machine
(`download → upload → submitted`) that tracks a tasker's progress through delivering
a task. It's deliberately driven only by explicit actions and one-time server
hydration — never inferred from "files exist" — so the UI can't silently jump ahead
when a task is reopened with leftover files. This is one of the few pieces with unit
tests ([`use-tasker-step-machine.test.ts`](../src/hooks/use-tasker-step-machine.test.ts)).

## Client-side state (Zustand)

Two independent stores:

- **Auth** (`hooks/use-auth.ts`) — reactive cache over `session-store.ts`, described
  above.
- **Wallet** ([`lib/payment/wallet-store.ts`](../src/lib/payment/wallet-store.ts)) —
  a *simulated* escrow system, no real money and no backend call. Each role starts
  with a dummy balance; accepting a bid holds the task budget in escrow, approving
  work releases it to the tasker's balance, cancelling refunds the client.
  `payoutConfirmed` tracks the separate manual step of actually sending a real
  transfer once funds are released. Persisted to `localStorage` and re-synced across
  browser tabs via the `storage` event (the Zustand `persist` middleware alone only
  writes, it doesn't push updates to other open tabs).

## UI components

`components/ui/` holds shared primitives: `Button`, `Field`, `TextArea`,
`SelectField`, `PageHeader`, `Card`, `StatusBox` — re-exported from
[`components/ui/index.ts`](../src/components/ui/index.ts).

`components/layout/navbar/index.tsx` (exported as `AppShell`) is the authenticated
app frame: top nav, an editable API base-URL field, per-role session pills with
logout, and wallet balance pills. `components/layout/auth-shell.tsx` is the simpler
centered layout used by login/register/onboarding.

Feature folders build on the primitives:

- `components/task/` — `TaskCard`, `TaskFilters`, `CreateTaskForm`.
- `components/bid/` — `BidsHeader`, `BidsSidebar`, `TaskBidCard`, `BottomNav`, and
  the bid modals (`PlaceBidModal`, `ViewBidsModal`, `ChecklistModal`,
  `PosterProfileModal`).
- `components/task-files/` — the file-exchange UI for a single task: drop zone,
  file list, activity log, step indicator, role-specific exchange views
  (`client-file-exchange.tsx`, `tasker-file-exchange.tsx`), banners and empty states.
- `components/account/` — `SessionCard`, `TaskerProfileCard`.
- `components/shared/skeletons/` — loading skeletons (e.g. `TaskCardSkeleton`).

`components/providers/query-provider.tsx` creates the single `QueryClient` instance
(via `useState`) and wraps the app in `QueryClientProvider`.

## Design decisions

- **Next.js App Router** with route groups keeps each role's pages physically
  separate while sharing layout and shared pages cleanly.
- **TypeScript + Zod** types and validates API payloads so a backend shape change
  surfaces as a typed error instead of a silent `undefined`.
- **TanStack Query** owns all server state; Zustand is reserved for state that's
  genuinely local to the browser (session cache, simulated wallet).
- **localStorage + cookies** are enough for session handling at this app's size —
  localStorage for the rich session object, a thin cookie mirror so `middleware.ts`
  can guard routes server-side.
- **Middleware** is the single place for request-level route protection, scoped to
  `/client/*` and `/tasker/*` via the `matcher` config.

## Environment configuration

The backend base URL defaults to `http://127.0.0.1:8000`. Override it by setting:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com
```

It can also be changed live from the navbar's "API" field, which persists per-browser
to `localStorage` (this overrides the env default at runtime).

Google sign-in requires:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-client-id>
```

## Routes overview

- `/` — Home page
- `/login`, `/register` — Auth
- `/onboarding/role` — Role picker for new Google sign-ins
- `/profile` — Shared profile page
- `/bids` — Bids feed/overview
- `/mybids` — Bids the current user placed
- `/task/:taskId/files` — File exchange for a task
- `/wallet`, `/payouts` — Simulated wallet and payouts
- `/client/dashboard`, `/client/tasks` — Client workflow
- `/tasker/dashboard`, `/tasker/tasks`, `/tasker/profile/:id` — Tasker workflow

## Testing & CI

- `npm test` runs Vitest (`vitest.config.ts` scopes it to `src/**/*.test.ts`, node
  environment). Current coverage: `use-tasker-step-machine.test.ts` and
  `lib/task-files.test.ts`.
- `npm run typecheck` runs `tsc --noEmit`.
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every push/PR to
  `main`: install → typecheck → test → build.

## Recommended next steps

- Add tests around the API client envelope/validation logic and the wallet store's
  escrow transitions.
- Add stronger session validation (the JWT is decoded but never signature-verified
  client-side, by design — confirm the backend is the only place that matters).
- Replace the simulated wallet with a real payments integration once the backend
  supports it.
- Expand test coverage beyond the two current files as more features stabilize.
