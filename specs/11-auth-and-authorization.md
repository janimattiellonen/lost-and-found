# Auth & authorization

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
Keeps the club's admin pages and writes to the admin's own hands while the disc
list, the QR notification forms and the owner link stay open to anyone. There is
one role — signed in or not — implemented with Supabase email/password auth over
cookie sessions, with row-level security in Postgres as the second line.

## Actors
- **Anonymous visitor** — reads the disc list, submits found/bin-full reports, answers from an owner link.
- **Club admin** — one Supabase user per club instance; there is no user table, no roles, no per-user permissions.
- **Command-line scripts** (`scripts/`) — sign in as an admin, or use a service-role key set only in a local `.env`.

## User-facing behaviour
1. When an admin posts email + password to `/sign-in`, then the session cookies are set and they are redirected to `/`.
2. When either field is empty or Supabase rejects the credentials, then the form re-renders with a Finnish error and HTTP 422.
3. When a signed-out visitor requests an admin page, then its loader redirects to `/sign-in`.
4. When a signed-out client POSTs to a disc resource route, then it gets `401` with `Kirjautuminen on vanhentunut. Kirjaudu uudelleen.`
5. When signed in, then `AdminMenu` appears above every page and the disc list gains admin-only columns and row actions.
6. When "Kirjaudu ulos" is confirmed, then `supabase.auth.signOut()` runs in the browser; `root.tsx` sees the auth-state change and revalidates.

## Data
- Auth state lives entirely in Supabase's `auth` schema and in the browser's cookies. This app owns no users, roles or sessions table.
- RLS is enabled by migration on `bin_full_notifications`, `disc_retrievals`, `disc_owner_responses`; `discs` and `disc_found_notifications` carry policies applied outside the migrations dir (documented in `docs/rls.md`).
- `discs` policies: `SELECT` to `public`; `INSERT`/`DELETE`/`UPDATE` to `authenticated`. The `UPDATE` policy needs `USING` as well as `WITH CHECK` — without `USING` the statement silently affects zero rows (`supabase/migrations/20260829040000_discs_update_policy.sql`).
- `disc_owner_responses` has **no INSERT policy at all**; anon instead gets `EXECUTE` on two `SECURITY DEFINER` functions, `owner_link_disc()` and `submit_owner_response()`. `disc_is_in_storage()` is revoked from `PUBLIC` and granted to nobody.
- No RLS migration exists for `message_templates`, `message_log` or `emptying_log`; whatever policies they carry were applied by hand in Supabase.

## Routes & entry points
| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/sign-in` | GET, POST | public | Email/password sign-in (`app/features/auth/signInWithForm.server.ts`) |
| `/`, `/discs/data` | GET | public | Disc list; loader narrows fields for anonymous visitors |
| `/notify`, `/notify/:courseSlug`, `/bin/full/:courseSlug` | GET, POST | public | QR report forms |
| `/kiekko/:token` | GET, POST | token only | Owner link; `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow` |
| `/discs/add`, `/emptying-log`, `/message-templates`, `/message-template/:id/edit`, `/message/send/:externalId`, `/message/send-batch`, `/notifications`, `/stats` | GET (+POST) | admin, loader redirect | Admin pages |
| `/retrieval`, `/vastaukset` | GET, POST | admin, checked in the feature module | Retrieval list, owner-answer inbox |
| `/discs/create`, `/discs/delete`, `/discs/disposal`, `/discs/return`, `/discs/course`, `/discs/retrieval`, `/discs/batch` | POST JSON | admin, `requireAdminJson` | Disc resource routes |
| `/message-template/create` | GET, POST | **no server-side check** | New-template form (see gaps) |
| `/discs/sync` | — | 404 | Route file excluded in `app/routes.ts` |

## Rules & constraints
- **Session model.** `createSupabaseServerClientWithHeaders(request)` (`app/models/utils.ts`) builds a request-scoped `@supabase/ssr` server client that reads cookies from the request and collects `Set-Cookie` writes onto a `Headers` it returns. Any handler that establishes or refreshes a session **must** return those headers — `signInWithForm` and the `root.tsx` loader do; nothing else does.
- `createSupabaseServerClient(request)` is the read-only convenience: same client, cookie writes deliberately dropped. Model functions that query under RLS use it.
- **There is no single `requireUser` helper.** Three mechanisms coexist:
  1. `isUserLoggedIn(request)` — `supabase.auth.getUser()`, true when a user id comes back. Called inline at the top of each admin page's loader, which returns `redirect('/sign-in')`.
  2. `requireAdminJson(request)` (`app/lib/api/resourceRoute.server.ts`) — the shared preamble for the JSON disc routes: POST-only (405), `isUserLoggedIn` (401), parseable JSON body (400). Returns either `{ body }` or `{ response }`.
  3. `isUserLoggedIn` called inside the feature loader/handler instead of the route, for `/retrieval` and `/vastaukset`.
- **Route-level checks guard loaders, not actions.** On `/emptying-log`, `/notifications`, `/message-templates` and `/message-template/:id/edit` the check sits in the loader only; the `action` on those routes performs its write with no auth check of its own and relies on RLS.
- **Keys.** `SUPABASE_KEY` is the **anon** key. It is deliberately public — `root.tsx` ships it to the browser in the loader's `env` object so `createBrowserClient` can run. Every server client (`createConnection`, `createFunctionConnection`, both SSR clients) uses the same anon key; a signed-in request differs only by carrying the session JWT from its cookies.
- **The service-role key is never reachable from app code.** `SUPABASE_SERVICE_ROLE_KEY` appears nowhere under `app/` and is not in `.env.example`; only `scripts/supabaseClients.ts` reads it, optionally, for local maintenance scripts, falling back to signing in with `SUPABASE_EMAIL`/`SUPABASE_PASSWORD`.
- Because the anon key is public, **RLS is the real boundary**: anything an anonymous client may not do must be refused by a policy, not only by a loader.
- Anonymous field narrowing on the disc list happens in `loadDiscListData.server.ts` before the query — `additional_info` is never read, the phone number is cut to four digits, and `externalId` is stripped — so a policy-level `SELECT` to `public` on `discs` is safe.
- `markRefusal` (`app/lib/api/resourceRoute.server.ts`) turns a zero-row UPDATE into a `403` naming RLS, because row-level security filters rather than raising.
- Club scoping is enforced in application queries via `APP_CLUB_ID`, not by any RLS policy (see spec 12).
- `AdminMenu` and `Header` are hidden on `/notify*` for signed-out visitors (`showHeader` in `root.tsx`); hiding UI is cosmetic, never the authorization.

## Edge cases & known gaps
- `/message-template/create` has **no loader and no auth check** — an anonymous visitor can render the form and POST it. Whether the insert lands depends solely on RLS on `message_templates`, for which there is no migration in this repo.
- Likewise the unguarded `action`s on `/emptying-log`, `/notifications` and `/message-templates` — deletes and updates there are protected by RLS alone.
- `root.tsx` uses `auth.getSession()` (cookie-derived, unverified) for UI state, while every gate uses `auth.getUser()` (verified against Supabase). The mismatch is intentional but means the menu can render for a session the gates would reject.
- `signInWithForm` reads `email`/`password` with `!` and calls `.toString()` before the emptiness check, so a missing field throws and is swallowed by the `catch`, which logs and returns `undefined` rather than the 422.
- No CSRF token, no rate limiting on `/sign-in`, no password reset or sign-up flow — accounts are created in the Supabase dashboard.
- Sessions expire with Supabase's defaults; a stale tab discovers this as a `401` from a resource route rather than a redirect.

## Open questions
- Whether `message_templates`, `message_log` and `emptying_log` have RLS enabled at all — no migration in this repo says so.
