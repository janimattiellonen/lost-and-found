# Multi-club configuration

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
One codebase serves two disc golf clubs, Puskasoturit ry (club id 1) and Talin
Tallaajat ry (club id 2), as **two separate deployments of the same app**. The
club a deployment serves comes from a single environment variable, `APP_CLUB_ID`,
and everything club-specific is keyed on it.

## Actors
Deployment configuration; no user interacts with it directly. Visitors and
admins only ever see the one club their instance serves.

## User-facing behaviour
1. When a page loads, then the header shows the club's logo and name and the tab shows the club's favicon.
2. When the disc list renders, then it contains only that club's discs, and links to that club's own lost-discs page.
3. When an admin adds a disc, then it is filed under `APP_CLUB_ID` — the club never comes from the request.
4. When an admin signs in on either instance, then the "Noutolista" (retrieval list) menu item, the `/retrieval` page and the row action are there, listing only that instance's club's discs. It was Talin Tallaajat only until 2026-09-04; both admins have to fetch the disc before an owner can have it — out of the club's koppi (storage shed) at Tali, off the admin's own shelf at Puskasoturit — so the retrieval list is no longer a per-club feature at all.
5. When an owner opens their SMS link, then the page works on both clubs and shows that club's MobilePay number and contact email.
6. When an admin adds a disc on Puskasoturit, then a course picker is offered (Oittaa / Äijänpelto); on Talin Tallaajat there is none.

## Data
- `clubs` table — `id`, `name`, timestamps, joined `sync_log`. Read only by `fetchClubs()` (`app/models/clubs.server.ts`), mapped by `app/models/ClubMapper.ts`. Its only caller is `app/routes/discs.sync.tsx`, which is excluded from routing, so this table is effectively unused at runtime.
- `discs.club_id`, `disc_found_notifications.club_id`, `bin_full_notifications.club_id`, `message_templates.club_id`, `message_log.club_id`, `emptying_log` (per course) all carry the club. Every query in `app/models/*.server.ts` filters on `process.env.APP_CLUB_ID`.
- Club scoping is **application-level only** — no RLS policy mentions `club_id`. Both deployments point at the same Supabase project and the same rows.
- `app/config/courses.ts` is the course catalog: a hard-coded array of `{ slug, name, clubId, clubName, discCourseName? }`. `discCourseName` is the short name the Google Sheet used and is what lands in `discs.course`; it is absent for Tali, which collects from one course.

## Routes & entry points
| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/notify/:courseSlug` | GET, POST | public | Found-disc form for the course resolved by `getCourseBySlug` |
| `/bin/full/:courseSlug` | GET, POST | public | Bin-full form, same slug resolution |
| `/retrieval` | GET, POST | admin | Both clubs; scoped by `queryPendingRetrievals`' `.eq('discs.club_id', currentClubId())` |
| `/kiekko/:token` | GET, POST | token | Owner link — both clubs; club taken from `currentClubId()` and passed into the RPC |
| `/discs/sync` | — | 404 | Per-club Sheets importers; route excluded in `app/routes.ts` |

## Rules & constraints
- `currentClubId()` (`app/config/clubs.ts`) is the single parse of `APP_CLUB_ID`; `PUSKASOTURIT = 1` and `TALIN_TALLAAJAT = 2` are the constants. A few older call sites still do `parseInt(process.env.APP_CLUB_ID!, 10)` inline (`app/root.tsx`, `app/routes/discs.add.tsx`, `app/features/discs/{submission,courseChange}/…`).
- `APP_CLUB_NAME` is a separate, free-text env var; it is what the header and the `<title>` show. Nothing checks that it matches `APP_CLUB_ID`.
- `root.tsx` forwards `CLUB_ID` and `CLUB_NAME` to the browser in the loader's `env` object, so client components take the club as a prop rather than reading the env.
- Every write scopes on the club so that an id belonging to the other club cannot be acted on: disc create, delete, batch delete, the mark-* updates, retrieval errands (`queryDiscIdByExternalId.server.ts`), and owner-response handling all add `.eq('club_id', currentClubId())` or pass `p_club_id`.
- `isRetrievalListEnabled()` was a per-club gate on the retrieval list, checked in `loadRetrievalList`, `loadRetrievalCount`, `handleRetrievalRequest`, `handleRetrievedRequest` and the disc list's pending-retrieval lookup. Removed on 2026-09-04 along with all five checks. `clubs.stores_discs_offsite` is now the one place recording where a club keeps its discs, and it decides only whether an owner is offered "Nouto varastolta" (collect from the koppi) on the sms link.
- Course slugs are **global, not club-scoped**: `getCourseBySlug` searches the whole catalog, and `/notify/:courseSlug` and `/bin/full/:courseSlug` do not check `course.clubId === currentClubId()`.
- `getDiscCourseNames(clubId)` returns the club's course names only when there is more than one; a single-course club gets `[]`, which is how the add form knows not to ask.
- Per-club lookups all fall back rather than throw: `getClubLogo`/`getClubFavicon`/`getClubLostDiscsUrl`/`getClubPayment` return `null` for an unknown club so the element is left out, while `getClubContactEmail` falls back to Talin Tallaajat's address.
- The Sheets importers are chosen by club id in `getImporter()` (`app/models/syncDiscs.server.ts`): `PuskaSoturitImporter` (spreadsheet `1dyROk…`, tab `Oittaa`, key `PUSKASOTURIT_SHEETS_KEY`) vs. `TalinTallaajatImporter` (spreadsheet `1_E4YY…`, tab `Master`, key `TT_SHEETS_KEY`). An unrecognised club id throws.
- `vercel.json` carries only `{"framework": "react-router"}` — no per-club config. The two deployments differ purely by their Vercel environment variables.

## What varies per club vs. what is shared
| Varies per club | Where |
|---|---|
| Club id and display name | `APP_CLUB_ID`, `APP_CLUB_NAME` |
| Logo and favicon | `CLUB_IMAGES` in `app/config/clubs.ts` |
| Contact email | `CONTACT_EMAILS` |
| Club's own lost-discs page URL | `LOST_DISCS_URLS` |
| MobilePay number + payee name | `CLUB_PAYMENTS` |
| Courses, slugs, and whether a disc records a course | `app/config/courses.ts` |
| Whether the club stores discs offsite, i.e. whether an owner may collect from the koppi | `clubs.stores_discs_offsite` (true for club 2) |
| Google Sheets importer, spreadsheet and API key | `app/import/`, `getImporter()` |
| Which discs, notifications, templates and message log rows are visible | `club_id` filters in `app/models/*.server.ts` |

| Shared across clubs | Where |
|---|---|
| Supabase project, database, and all tables | one `SUPABASE_URL` / `SUPABASE_KEY` per deployment, same project |
| RLS policies (none mention `club_id`) | `docs/rls.md` |
| Postage fee and the payee who receives it | `app/config/shipping.ts` |
| Owner link page and owner-response flow | `app/features/discs/ownerResponse/` |
| Disc parser, list, batch actions, stats, SMS templates, notifications, emptying log | `app/features/*` |
| Finnish UI copy, admin menu, header layout | `app/ui/` |
| Bin-full QR posters, currently only offered for `oittaa` | `BIN_FULL_COURSE_SLUGS` in `BinFullQrPosterButtons.tsx` |

## Edge cases & known gaps
- A visitor on either deployment can open `/notify/tali` or `/bin/full/oittaa` regardless of which club that course belongs to; the report is then filed under the *instance's* `APP_CLUB_ID` while naming the other club's course.
- Both clubs share one database, so club separation depends entirely on every query remembering its `.eq('club_id', …)`. Nothing in the schema enforces it.
- `APP_CLUB_ID` is read with `!` and `parseInt`; a missing or non-numeric value yields `NaN` and silently empty lists rather than a startup failure.
- Adding a third club means editing four hard-coded maps in `app/config/clubs.ts`, the `courses` array, and `getImporter()` — there is no data-driven club registry.
- `SUPABASE_FUNCTIONS_URL` is in `.env.example` but is referenced nowhere in the code.
- `app/models/clubs.server.ts` and `ClubMapper.ts` are reachable only from the disabled `/discs/sync` route.

## Open questions
- None.
