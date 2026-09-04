# Public disc list & search

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
The front page of the app: every disc the club currently holds and has not
returned, sold, donated or archived. An owner comes here to find their own disc
and recognise it by the last four digits of the phone number written on it. The
same page is the club admin's working surface — signed in, each row grows the
lifecycle actions and the club-internal notes.

## Actors
- **Anonymous visitor** — browses, filters and searches; sees no phone numbers in full, no notes and no actions.
- **Club admin** (signed in via Supabase) — same list plus full phone numbers, `additional_info`, row actions and batch selection.

## User-facing behaviour
1. When the page loads, the client fetches `/discs/data` (`useFetcher`) and shows a spinner until the first payload arrives; a later reload keeps the table on screen at 50% opacity with `aria-busy`.
2. When the club has an emptying log, "Löytökiekot tarkistettu viimeksi" (last checked) is shown above the filters; the course name is shown only when there is more than one entry.
3. When a visitor picks a disc name in the "Kiekko" combobox (`DiscSelector`, downshift), the list is filtered to rows whose `discName` is exactly that string.
4. When a visitor types more than 2 characters into "Puh nro., 4 viimeistä" (phone no., last 4), a 300 ms-debounced filter keeps rows whose `ownerPhoneNumber` *ends with* the typed digits.
5. When the club records courses **and** the loaded discs name more than one, a "Rata" (course) radio row appears with "Kaikki radat" (all courses) plus one option per course found in the data.
6. When a header is clicked, the table re-sorts (TanStack Table); default sort is `addedAt` descending. Column widths are pointer-draggable.
7. When a disc has been held over three months, a red warning icon sits next to its "Lisätty" (added) date.
8. When signed in, each row gains a checkbox, an SMS link, and the action icons (return, disposal, retrieval, course, notes, delete); the panels open as an extra row under the disc.
9. When an admin action succeeds, `DiscListPage.reload()` re-fetches `/discs/data` **and** revalidates the root loader, so the retrieval badge in the menu stays in step.

## Data
Reads `public.discs`, scoped to `club_id = APP_CLUB_ID`.

| Column | Notes |
|---|---|
| `external_id` | uuid, NOT NULL, unique, default `gen_random_uuid()`. Sent to signed-in visitors only; every admin action is keyed on it. |
| `internal_disc_id` | Nullable — web-added discs have no Google Sheet row. |
| `disc_name`, `disc_colour`, `disc_manufacturer` | Public. `disc_name` carries "Mould, Plastic". |
| `owner_name`, `owner_club_name` | Public. |
| `owner_phone_number` | Truncated to the last 4 digits for anonymous visitors in `toListedDiscs` (`app/models/discs.server.ts`), before the payload is built. |
| `added_at` | Public; drives the >3-month warning. |
| `course` | Nullable; only Puskasoturit (club 1) records one. |
| `additional_info` | Left out of the `SELECT` entirely unless signed in. |
| `is_returned_to_owner`, `can_be_sold_or_donated`, `archived_at` | Exclusion filters, see below. |

Also reads `emptying_log` (via `getEmptyingLogItemsForClub`) and, for a signed-in
admin of a retrieval-list club, `disc_retrievals` (`queryPendingRetrievalMethods`).

Exclusion is a single query in `getDiscs()`:
`is_returned_to_owner = false AND can_be_sold_or_donated = false AND archived_at IS NULL AND club_id = APP_CLUB_ID`,
ordered by `disc_name` ascending. `archived_at` (indexed) means "the club stopped
listing it" without claiming what became of it; statistics deliberately ignore it.

## Routes & entry points
| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/` (`app/routes/_index.tsx`) | GET | public | Renders `DiscListPage`; no loader of its own. |
| `/discs/data` (`app/routes/discs.data.tsx`) | GET | public (content varies by session) | The loader the page fetches: `{ clubId, data, pendingRetrievals, distinctDiscNames, distinctCourses, emptyingLogItems }`. |
| `/discs/course` (`app/routes/discs.course.tsx`) | POST | admin (`requireAdminJson`) | Sets or clears one disc's course from the row action; course must be one of `getDiscCourseNames(APP_CLUB_ID)`. |

## Rules & constraints
- **Phone truncation happens server-side.** `PUBLIC_PHONE_DIGITS = 4`; the digits an anonymous visitor never receives cannot be read out of the payload.
- **`externalId` is stripped for anonymous visitors** in `loadDiscListData`, and `DiscTable` renders the checkbox/action columns only when `session.user.id` exists (read from the root outlet context). Both must hold: the columns key off the session, the data off the loader.
- **`additional_info` is never selected** for an anonymous request, rather than selected and dropped.
- **Club scoping is from `APP_CLUB_ID`**, never from the request.
- **The course filter has two gates**: the club must have >1 configured `discCourseName` (`getDiscCourseNames`) *and* the loaded discs must name >1 distinct course. The `Rata` column follows the first gate only.
- Row selection is keyed on `external_id` (`getRowId`), so a tick survives re-sorting; rows without one cannot be selected. There is deliberately **no select-all** — only a clear-selection checkbox.
- `getDistinctCourses` sorts with the `fi` collator and drops discs with no course, so those appear only under "Kaikki radat".

## Edge cases & known gaps
- The phone search filters on whatever the DTO holds, so for an anonymous visitor only a suffix of ≤4 digits can ever match, while the field's own label says "4 viimeistä". A signed-in admin matches against the full number, so the same input can give different results to the two audiences.
- The search fires from 3 characters, not 4, despite the label.
- `getDistinctDiscNames` dedupes case-insensitively but keeps the first spelling seen; the filter then compares `discName` with `===`, so discs whose name differs only in case are unreachable through the combobox.
- The list is ordered `disc_name` ascending by the DB but immediately re-sorted client-side by `addedAt desc`, so the SQL `ORDER BY` only affects the row numbering (`#` is the array index at map time, not a stable id).
- The `#` column therefore renumbers on every filter or reload; it is a display counter, not an identifier.
- The disc-name filter is exact-match, not substring.
- Everything is loaded and filtered client-side — there is no pagination and no server-side search.
- `DiscListIntro` warns that a disc's state may be wrong, i.e. the list can show a disc the club no longer holds.

## Open questions
- CDN caching of `/discs/data` is designed but **not implemented** (`docs/caching-the-public-disc-list.md`, deferred 2026-08-30). The blocker recorded there: the same URL serves two payloads (with and without `externalId`) and Vercel's edge cache does not vary on `Cookie`, so a cached anonymous copy would silently strip an admin's action buttons.
