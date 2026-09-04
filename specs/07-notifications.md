# Found-disc & bin-full notifications

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
Two public, anonymous forms reached by scanning a QR code on a poster at a course:
one to report that a disc was found and dropped into the collection bin, one to
report that the bin is full. Reports land in an admin inbox at `/notifications`,
where a club volunteer reads, marks and deletes them.

## Actors
- **Anonymous visitor at the course** — scans the poster, submits either form. No account, no session.
- **Club admin (signed in)** — reads the inbox, marks notifications read, deletes them, downloads QR posters.

## User-facing behaviour
1. Visitor scans the found-disc QR and lands on `/notify/<courseSlug>`; the form shows the course name and one button, "Ilmoita kiekosta" ("report a disc"). Submitting stores a notification and shows "Kiitos ilmoituksesta!" ("thanks for the report").
2. "Lisää yhteystiedot" ("add contact details") expands optional Nimi / Puhelinnumero / Sähköposti / Viesti (name / phone / email / message) fields, all free text, all optional.
3. Visiting `/notify` with no slug shows the same form plus a radio list of *all* courses in `app/config/courses.ts`; the course is required, but only by a client-side check in `NotifyForm.tsx`.
4. After success the found-disc form offers "Lähetä uusi ilmoitus" ("send another"), which just reloads the page.
5. Visitor scans the bin-full QR and lands on `/bin/full/<courseSlug>`; one button, "Laatikko on täynnä" ("the bin is full"). Submitting stores a notification and shows the thank-you screen.
6. If a bin-full report for that course was already submitted from this browser inside the rate-limit window, the *loader* already renders the thank-you screen — the form is never shown, and a POST is silently discarded (still answered with success).
7. An unknown course slug on either route throws a 404 `Response` with the body "Rataa ei löytynyt" ("course not found").
8. Admin opens "Ilmoitukset" ("notifications") from the admin menu. Two sections: "Ilmoitukset löydetyistä kiekoista" (found discs) and "Ilmoitukset täysistä löytökiekkolaatikoista" (full bins). Unread rows get a blue left border; empty sections read "Ei ilmoituksia."
9. "Merkitse luetuksi" ("mark as read") stamps `read_at` and the row loses its unread styling; the button then disappears. There is no way to mark a row unread again.
10. "Poista" ("delete") and "Poista kaikki" ("delete all") delete, each behind a `window.confirm`.
11. Each section has per-course QR poster buttons that generate an A4 PDF in the browser and download it.

## Data
| Table | Columns | Notes |
|---|---|---|
| `disc_found_notifications` | `id`, `created_at`, `club_id`, `course_name`, `contact_name`, `contact_phone`, `contact_email`, `message`, `read_at` | Everything but `id`/`created_at`/`club_id` is nullable — the form's only required input is the submit button. `course_name` is the display name string, not a slug or FK. |
| `bin_full_notifications` | `id`, `created_at`, `club_id`, `course_name NOT NULL`, `read_at` | Created by `supabase/migrations/20260424000000_bin_full_notifications.sql`. No payload beyond which course and when. |

- `read_at` NULL means unread; it is the only state a notification has.
- `club_id` comes from the `APP_CLUB_ID` env var at insert time, **not** from the course's `clubId`. Nothing enforces that `course_name` belongs to `club_id`.
- Mappers: `app/models/DiscFoundNotificationMapper.ts`, `app/models/BinFullNotificationMapper.ts` (snake_case row -> camelCase DTO; typed `raw: any`).

## Routes & entry points
| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/notify` | GET, POST | anonymous | Found-disc form with a course radio list (`app/routes/notify._index.tsx`) |
| `/notify/:courseSlug` | GET, POST | anonymous | Found-disc form for one course (`app/routes/notify.$courseSlug.tsx`) |
| `/bin/full/:courseSlug` | GET, POST | anonymous | Bin-full report for one course (`app/routes/bin.full.$courseSlug.tsx`) |
| `/notifications` | GET, POST | signed in (`isUserLoggedIn`, else redirect to `/sign-in`) | Admin inbox (`app/routes/notifications.tsx`) |

POST intents on `/notifications` (`app/features/notifications/handleNotificationAction.server.ts`):
`markAsRead`, `delete`, `deleteAll` (found-disc) and `markBinFullAsRead`, `deleteBinFull`, `deleteAllBinFull` (bin-full). Every intent returns `{}`; unknown intents and a missing `notificationId` are no-ops.

## Rules & constraints
- **What an anonymous caller can do:** insert one `disc_found_notifications` row (any course name, any/empty contact fields) or one `bin_full_notifications` row per POST. Both inserts go through `createConnection()` — the plain anon key — so the DB `Allow public insert` policy (`WITH CHECK (true)`) is what permits them. See `docs/rls.md` and the bin-full migration.
- **What an anonymous caller cannot do:** read, update or delete any notification. SELECT/UPDATE/DELETE policies on both tables are `TO authenticated`. The admin inbox uses `createSupabaseServerClient(request)` (cookie session), so an unauthenticated read returns nothing even if the route guard were bypassed.
- **No field validation, no length limits, no sanitising** on the found-disc form. `contactEmail` is `type="email"` (browser-side only). Empty strings are normalised to `null`.
- **Rate limit (bin-full only)**, `app/features/notifications/binFullRateLimit.server.ts`:
  - Window: 10 minutes (`RATE_LIMIT_MS = 10 * 60 * 1000`).
  - Keyed by **cookie only** — never by IP, user agent or DB lookup. One cookie per course, named `bin_full_rl_<slug>`, `path=/bin/full`, `sameSite=lax`, `httpOnly`, `maxAge=600`. Its value is the epoch ms of the last POST.
  - Every POST rewrites the cookie, so repeated clicks *restart* the window rather than expire it.
  - The found-disc form has no rate limit at all.
- **Club scoping:** reads, mark-as-read and single deletes filter `.eq('club_id', APP_CLUB_ID)`. `deleteAllNotifications` / `deleteAllBinFullNotifications` do **not** — they run `.delete().gte('id', 0)` across every club.
- **Insert failures are swallowed:** both `create*Notification` functions `console.error` and return void; the action still returns `{ success: true }`, so the visitor always sees the thank-you screen.
- **QR posters** are generated client-side with `qrcode` + a lazily imported `@react-pdf/renderer` (`QrPosterButtons.tsx`, `BinFullQrPosterButtons.tsx`). The encoded URL is `window.location.origin + /notify/<slug>` or `/bin/full/<slug>`, so the poster inherits whatever host generated it. The logo is picked by `course.clubId === 1 ? 'ps-logo.png' : 'TT-Logo-transparent.png'`. Downloads as `<slug>-qr.pdf` / `<slug>-bin-full-qr.pdf`. Failures are logged to the console only.
- Bin-full posters are offered for a hardcoded slug list: `BIN_FULL_COURSE_SLUGS = ['oittaa']`. Found-disc posters are offered for every course.
- `app/root.tsx` hides the admin menu on paths starting with `/notify` for anonymous visitors. `/bin/full/*` is not in that check, but `AdminMenu` returns `null` without a signed-in user anyway.

## Edge cases & known gaps
- Both poster button lists and the `/notify` course radio list iterate **all** courses, not the ones belonging to `APP_CLUB_ID`. A club admin sees the other club's courses, and a report filed against another club's course is still stored under this instance's `club_id`.
- "Poista kaikki" deletes other clubs' notifications too (no `club_id` filter).
- The bin-full rate limit is per browser: clearing cookies, a private window or a second phone bypasses it immediately. It is spam friction, not a real limit.
- `docs/rls.md` documents `disc_found_notifications` but not `bin_full_notifications`; that table's policies exist only in its migration.
- Anonymous inserts rely on `SUPABASE_KEY` (the anon key, present in page source) plus a permissive `WITH CHECK (true)`, so anyone can write arbitrary rows to both tables directly, bypassing the forms and the cookie rate limit. This is the opposite of the deliberate no-INSERT-policy approach used for `disc_owner_responses` (see `docs/rls.md`).
- No notification count is surfaced in the admin menu (unlike "Vastaukset" / "Noutolista"), so unread reports are only visible after opening the page.
- No tests cover this feature — no unit or e2e specs reference the notify, bin-full or notifications routes.

## Open questions
None recorded.
