# Emptying log

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
Records when a course's lost-and-found collection bin was last checked/emptied,
and shows that date to the public on the disc list so a visitor knows how fresh
the inventory is. Despite the name, it is not an append-only log: it holds one
row per course and overwrites the timestamp in place.

## Actors
- **Club admin (signed in)** — presses "Merkitse tyhjennetyksi" ("mark as emptied") on `/emptying-log`.
- **Anonymous visitor** — sees the resulting date on the public disc list, read-only.

## User-facing behaviour
1. Admin opens "Tyhjennysloki" ("emptying log") from the admin menu and sees one row per course: the course name and a button.
2. Pressing "Merkitse tyhjennetyksi" sets that row's `emptied_at` to `now()` and the page reloads; the previous date is gone.
3. On the public disc list, when at least one row exists for the club, a heading "Löytökiekot tarkistettu viimeksi" ("lost discs last checked") lists each course with a short `fi-FI` date.
4. A row with no `emptied_at` renders as "Ei tiedossa" ("not known").
5. The course name is shown next to the date only when the club has more than one row (`showCourseName` in `app/ui/EmptyingLogItem.tsx`).
6. Anonymous visitors are redirected to `/sign-in` if they open `/emptying-log`.

## Data
`emptying_log`: `id`, `created_at`, `club_id`, `course_name`, `emptied_at` (nullable — a bin that has never been marked). No migration file exists for this table; it was created outside `supabase/migrations/`.

- `course_name` is a plain string, not an FK to anything.
- Rows are seeded manually in the DB. The app has **no INSERT path** — adding a course to the log requires a hand-written row.
- Invariant not enforced anywhere: exactly one row per (club, course).
- Mapper: `app/models/EmptyingLogMapper.ts` (`EmptyingLogDTO` in `app/types.ts`).

## Routes & entry points
| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/emptying-log` | GET | signed in (`isUserLoggedIn`, else redirect to `/sign-in`) | Lists every log row with its mark button (`app/routes/emptying-log.tsx`) |
| `/emptying-log` | POST | signed in | `item` = row id -> `markBinEmptied` -> `markAsEmptied` (`app/features/emptyingLog/markBinEmptied.server.ts`) |
| `/` (disc list) | GET | anonymous | Read-only display via `getEmptyingLogItemsForClub` in `app/features/discs/list/loadDiscListData.server.ts` |

## Rules & constraints
- Writes go through `createSupabaseServerClient(request)`, so RLS with the caller's session is the real gate; the route guard is a convenience redirect.
- `getEmptyingLogItemsForClub(clubId, request)` filters `.eq('club_id', clubId)` — that is the public path.
- `getEmptyingLogItems(request)` (the admin page) has **no club filter**: it lists every club's rows.
- `markAsEmptied(courseId, request)` filters only on `id` — no `club_id` check.
- `emptied_at` is set with the string `'now()'`, evaluated by Postgres, not by the app clock.
- Missing POST body `item` is a silent no-op.

## Relationship to bin-full notifications (spec 07)
Separate and unlinked. A `bin_full_notifications` row is an anonymous *request* to
come empty the bin; marking a row emptied here does not read, clear or mark read
any bin-full notification, and vice versa. An admin acting on a full-bin report
has to visit both `/notifications` and `/emptying-log`.

## Edge cases & known gaps
- History is destroyed on every press: only the latest emptying date survives.
- `EmptyingLogPage.tsx` uses `{emptyingLogItems.length && ...}`, so an empty log renders a stray `0` on the page.
- No confirmation dialog — a mis-click overwrites the date with no undo.
- No tests reference this feature.

## Open questions
None recorded.
