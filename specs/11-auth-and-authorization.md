# Auth & authorization

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
Keeps the club's admin pages and writes to the admin's own hands while the disc
list, the QR notification forms and the owner link stay open to anyone. There is
one role — signed in or not — implemented with Supabase auth over cookie
sessions, with row-level security in Postgres as the second line.

There are two ways in, both ending in the same Supabase session cookie: a
password, and a one-time link mailed to the admin's address ("magic link"). The
password form is what `/sign-in` shows first; the link is the alternative behind
a toggle, and the fallback when a password has been forgotten.

## Actors
- **Anonymous visitor** — reads the disc list, submits found/bin-full reports, answers from an owner link.
- **Club admin** — one Supabase user per club instance; there is no user table, no roles, no per-user permissions.
- **Command-line scripts** (`scripts/`) — sign in as an admin, or use a service-role key set only in a local `.env`.

## User-facing behaviour
1. When an admin posts email + password to `/sign-in`, then the session cookies are set and they are redirected to `/`.
2. When either field is empty or Supabase rejects the credentials, then the form re-renders with a Finnish error and HTTP 422.
3. When the admin picks "Kirjaudu sähköpostilinkillä" (sign in with an email link), then the password field gives way to the email field alone and the button reads "Lähetä kirjautumislinkki" (send the sign-in link). "Kirjaudu salasanalla" (sign in with a password) switches back.
4. When an address is posted in that mode, then the reply is always the same Finnish notice — "Jos sähköpostiosoite on rekisteröity, lähetimme siihen kirjautumislinkin." (if the address is registered, we have sent a sign-in link to it) — whether or not an account exists, and whether or not the mail could be sent. The notice never confirms that an address belongs to the club.
5. When the admin opens the link from that mail, then `/auth/callback` exchanges it for session cookies and redirects to `/`, signed in.
6. When the link has expired, has already been used, or has been altered, then `/auth/callback` redirects to `/sign-in?error=magic-link`, which shows "Kirjautumislinkki on vanhentunut tai sitä on jo käytetty. Pyydä uusi linkki." (the link has expired or has already been used; request a new one).
7. When a second link is requested inside the rate-limit window, then the notice from 4 appears unchanged but no mail is sent.
8. When a signed-out visitor requests an admin page, then its loader redirects to `/sign-in`.
9. When a signed-out client POSTs to a disc resource route, then it gets `401` with `Kirjautuminen on vanhentunut. Kirjaudu uudelleen.`
10. When signed in, then `AdminMenu` appears above every page and the disc list gains admin-only columns and row actions. What that menu contains and how it behaves on a phone is [13](13-admin-navigation.md).
11. When "Kirjaudu ulos" is confirmed, then `supabase.auth.signOut()` runs in the browser; `root.tsx` sees the auth-state change and revalidates.

## Data
- Auth state lives entirely in Supabase's `auth` schema and in the browser's cookies. This app owns no users, roles or sessions table.
- **The magic link adds no table.** The one-time token is minted, stored and expired by Supabase inside `auth`; this app never sees it in the database and never writes it. The only state the app itself keeps is the rate-limit cookie described below, which holds a timestamp and nothing else. Storing no login tokens is deliberate: a `magic_link_tokens` table in this database would sit beside the disc data under the same anon key, and would need its own RLS policies to keep an anonymous visitor from reading live login codes.
- RLS is enabled by migration on `bin_full_notifications`, `disc_retrievals`, `disc_owner_responses`; `discs` and `disc_found_notifications` carry policies applied outside the migrations dir (documented in `docs/rls.md`).
- `discs` policies: `SELECT` to `public`; `INSERT`/`DELETE`/`UPDATE` to `authenticated`. The `UPDATE` policy needs `USING` as well as `WITH CHECK` — without `USING` the statement silently affects zero rows (`supabase/migrations/20260829040000_discs_update_policy.sql`).
- `disc_owner_responses` has **no INSERT policy at all**; anon instead gets `EXECUTE` on two `SECURITY DEFINER` functions, `owner_link_disc()` and `submit_owner_response()`. `disc_is_in_storage()` is revoked from `PUBLIC` and granted to nobody.
- No RLS migration exists for `message_templates`, `message_log` or `emptying_log`; whatever policies they carry were applied by hand in Supabase.

## Routes & entry points
| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/sign-in` | GET, POST | public | Password sign-in (`app/features/auth/signInWithForm.server.ts`), or a request for an email link (`requestMagicLink.server.ts`); the posted `intent` field picks which |
| `/auth/callback` | GET | link only | Turns the `token_hash` from the mailed link into session cookies; `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow` |
| `/`, `/discs/data` | GET | public | Disc list; loader narrows fields for anonymous visitors |
| `/notify`, `/notify/:courseSlug`, `/bin/full/:courseSlug` | GET, POST | public | QR report forms |
| `/kiekko/:token` | GET, POST | token only | Owner link; `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow` |
| `/discs/add`, `/emptying-log`, `/message-templates`, `/message-template/:id/edit`, `/message/send/:externalId`, `/message/send-batch`, `/notifications`, `/stats` | GET (+POST) | admin, loader redirect | Admin pages |
| `/retrieval`, `/vastaukset` | GET, POST | admin, checked in the feature module | Retrieval list, owner-answer inbox |
| `/discs/create`, `/discs/delete`, `/discs/disposal`, `/discs/return`, `/discs/course`, `/discs/retrieval`, `/discs/batch` | POST JSON | admin, `requireAdminJson` | Disc resource routes |
| `/message-template/create` | GET, POST | **no server-side check** | New-template form (see gaps) |
| `/discs/sync` | — | 404 | Route file excluded in `app/routes.ts` |

## Rules & constraints
- **Session model.** `createSupabaseServerClientWithHeaders(request)` (`app/models/utils.ts`) builds a request-scoped `@supabase/ssr` server client that reads cookies from the request and collects `Set-Cookie` writes onto a `Headers` it returns. Any handler that establishes or refreshes a session **must** return those headers — `signInWithForm`, the `/auth/callback` loader and the `root.tsx` loader do; nothing else does.
- `createSupabaseServerClient(request)` is the read-only convenience: same client, cookie writes deliberately dropped. Model functions that query under RLS use it.

### The magic link

- **Supabase mints, sends and expires the token; this app only starts and finishes the exchange.** `requestMagicLink` calls `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo } })` and `/auth/callback` calls `supabase.auth.verifyOtp({ token_hash, type })`. Between those two calls the app holds nothing.
- **`shouldCreateUser: false` is mandatory, not a preference.** Left at its default of `true`, any address posted to the public `/sign-in` form would create a row in `auth.users` — and since every RLS policy in this app grants writes to the `authenticated` role as a whole, with no per-user check anywhere, that self-created account would be a full club admin. This one flag is what stands between an anonymous form and admin access.
- **The reply is deliberately uninformative.** `requestMagicLink` returns the same notice for a registered address, an unregistered one, a malformed one and a failed send. Supabase's own error for an unknown address (`Signups not allowed for otp`) is logged server-side and never reaches the browser, because passing it through would turn `/sign-in` into an oracle telling anyone which addresses are club admins.
- **Rate limiting is a cookie, backed by Supabase's own per-hour cap.** `magicLinkRateLimit.server.ts` follows `binFullRateLimit.server.ts`: an `httpOnly` cookie named `magic_link_rl`, scoped to `/sign-in`, holds the timestamp of the last request, and a second request inside two minutes returns the notice without calling Supabase. A cookie is trivially cleared, so it is a courtesy that stops an admin double-clicking into two live links — not a defence. The defence is the sending cap configured in Supabase, which applies per address regardless of cookies.
- **The email template must be changed in the Supabase dashboard, or none of this works.** The stock "Magic Link" template uses `{{ .ConfirmationURL }}`, which sends the browser through Supabase and returns the session in the URL's *fragment* (`#access_token=…`). A fragment is never sent to the server, so a loader cannot read it. The template must instead be:

  ```
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Kirjaudu sisään</a>
  ```

  `{{ .RedirectTo }}` is the `emailRedirectTo` the app passed, so the same template serves localhost, Vercel previews and production. `{{ .TokenHash }}` is readable as an ordinary query parameter, which is what makes the server-side exchange possible.
- **Three things live in the Supabase dashboard rather than in this repo**, and a deploy to a new URL is not finished until all three are right. This is the price of not sending the mail ourselves:
  1. **Custom SMTP** (Project Settings → Authentication → SMTP): host `smtp.resend.com`, user `resend`, password = the Resend API key, sender an address on a domain verified in Resend. Resend's shared `onboarding@resend.dev` sender only ever delivers to the Resend account owner's own address, so it is unusable here.
  2. **The redirect allowlist** (Authentication → URL Configuration) must contain every origin's `/auth/callback`. An origin missing from it makes Supabase silently fall back to the project's Site URL, and the link then signs the admin into the wrong deployment.
  3. **The email template** above, and the OTP expiry (`email_otp_expiration`).
- **`emailRedirectTo` is built from the request's own origin**, so the link in the mail returns to the deployment the request came from rather than to a hard-coded `APP_URL`. Supabase refuses an origin that is not on the allowlist, which is what keeps this from being an open redirect.
- **`/auth/callback` never redirects anywhere but `/` or `/sign-in`.** It takes no destination parameter. A `next=` parameter is the usual way this kind of route becomes an open redirect, and there is only one place a signed-in admin needs to land, so the parameter does not exist.
- **`type` is checked against an allowlist** (`email`, `magiclink`, `recovery`) before being handed to `verifyOtp`, rather than passed through from the query string as whatever the caller wrote.
- **The callback must return the client's headers.** `verifyOtp` is what establishes the session, so `/auth/callback` uses `createSupabaseServerClientWithHeaders` and attaches those `Set-Cookie` headers to its redirect. Returning a bare `redirect('/')` there would verify the token, consume it, and sign nobody in.
- The token in the callback URL is a live credential for the seconds before it is used, so the route sets `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex, nofollow`, as `/kiekko/:token` does.
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
- No CSRF token, and no password reset or sign-up flow — accounts are created in the Supabase dashboard. The magic link is the nearest thing to a password reset: an admin who has forgotten the password can still get in, but cannot change it from the app.
- **The magic-link rate limit is a cookie and stops nobody who does not want to be stopped.** Clearing it, or posting from `curl`, sends another mail. Whether an admin's inbox can be flooded therefore depends entirely on the per-hour cap set in the Supabase dashboard — a setting this repo cannot assert. There is no server-side, per-address limit in the app.
- **The Finnish wording of the sign-in email is not in version control.** It lives in the Supabase dashboard, so it is not reviewable in a pull request, cannot be tested, and will silently revert to the English stock template — breaking the flow entirely, because the stock template omits `{{ .TokenHash }}` — if the project's email templates are ever reset.
- Password sign-in remains the primary form, so the weaknesses of `signInWithForm` above (the `!` reads, the swallowed `catch`) are unchanged by this work.
- A signed-in admin who opens a link is not redirected away from `/auth/callback`; the token is verified and consumed, replacing the current session with an identical new one. Harmless, but it means a link cannot be "saved for later" once opened.
- Sessions expire with Supabase's defaults; a stale tab discovers this as a `401` from a resource route rather than a redirect.

## Open questions
- Whether `message_templates`, `message_log` and `emptying_log` have RLS enabled at all — no migration in this repo says so.
- What the per-hour email cap in the Supabase dashboard is actually set to. It is the only real limit on how many sign-in mails one address can be sent, and nothing in this repo records or enforces it.
