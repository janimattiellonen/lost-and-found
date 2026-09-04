# Google Sheets sync

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
Both clubs originally kept their lost-disc inventory in a Google Sheet. This
feature reads those sheets over the Sheets REST API and turns rows into `discs`
rows. Discs are added through `/discs/add` now, so the in-app sync UI is
**disabled**; what remains in use is a one-off command-line import script for
Puskasoturit.

## Actors
- Club admin — runs the import script from a shell (needs `.env` credentials).
- No anonymous or in-app path exists today: the sync route is not routable.

## How a sync is triggered today
| Path | State |
|---|---|
| `npm run import:puskasoturit [-- --dry-run]` → `scripts/importPuskasoturitDiscs.ts` | **The only working trigger.** Insert-only, no deletes. |
| `/discs/sync` (`app/routes/discs.sync.tsx`) | **Disabled.** `app/routes.ts` lists `'**/discs.sync.tsx'` in `flatRoutes({ ignoredRouteFiles })`, so the URL 404s. The file, `app/features/discSync/*` and `app/models/syncDiscs.server.ts` are kept on disk; deleting that one line brings the page back. |
| Cron / scheduled job | None exists. |

`npm run archive:discs -- --before=YYYY-MM-DD` (`scripts/archiveStaleDiscs.ts`)
is a sibling script, not a sync: it sets `archived_at` on old unresolved discs.

## The two importers
Both live in `app/import/`, both call
`https://sheets.googleapis.com/v4/spreadsheets/<id>/values/<tab>?valueRenderOption=FORMATTED_VALUE&key=…`,
both `slice(1)` off the header row and keep only rows that have an id, a disc
name and a date. Column layouts differ entirely — indexes are hard-coded, so a
column inserted in either sheet silently shifts the data.

| | Puskasoturit (`PuskaSoturitImporter.ts`) | Talin Tallaajat (`TalinTallaajatImporter.ts`) |
|---|---|---|
| club_id | 1 | 2 |
| Sheet tab | `Oittaa` | `Master` |
| API key env var | `PUSKASOTURIT_SHEETS_KEY` | `TT_SHEETS_KEY` |
| internal id column | 14 (last) | 0 (first) |
| disc name / manufacturer / colour | 0 / 1 / 2 | 1 / — / 5 |
| owner name / phone | 3 / 4 | 2 / 3 |
| added at | 5, `dd/MM/y` | 9, `d.M.y` |
| returned / for sale text | 10 / 11 | 11 / 12 |
| extra columns | `additional_info` 12, `course` 13 | `owner_club_name` 6, `notified_at` 7, `additional_info` 8; no course |
| Bad date cell | `parseSheetDate()` returns null (one row reads `9248`); the script reports and skips the row | `format(parse(...))` throws — an unparsable cell takes the whole import down |
| API error | Explicit `throw` when `data.values` is missing | Unchecked; surfaces as "Cannot read properties of undefined" |

`app/import/puskasoturitDiscFields.ts` is the Puskasoturit-only post-processing
step used by the script: it normalizes course spellings (`Oiittaa` → `Oittaa`,
`ÄIjänpelto` → `Äijänpelto`), and mines the free-text notes for
`returned_to_owner_date`, `return_method` (`noud|nout` → picked up, `postit` →
by mail) and `can_be_sold_or_donated_method` (`lahjoit` → donated,
`myyd|muyyd` → sold). It duplicates the `ReturnMethod`/`DisposalMethod` numbers
instead of importing them so the module stays free of `~/` aliases and runs
under plain `node`'s TypeScript stripping; `puskasoturitDiscFields.test.ts`
asserts the two copies still agree.

## Matching a sheet row to a disc
- The key is `(internal_disc_id, club_id)` — `internal_disc_id` is the sheet row
  number and is only unique within a club.
- `scripts/importPuskasoturitDiscs.ts` pages the whole set of existing
  `internal_disc_id`s for the club (1000 rows per page), then inserts sheet rows
  whose id is not in that set. It never updates and never deletes, so **an edit
  made in the sheet after the row was imported is not propagated.**
- `syncNewDiscs()` (disabled path) instead takes `MAX(internal_disc_id)` for the
  club and inserts every sheet row above it — gaps below the maximum stay
  missing.
- `syncAllDiscs()` (disabled path) deletes every row for the club **where
  `internal_disc_id IS NOT NULL`** and re-inserts the sheet wholesale, then
  upserts `sync_log`.

### Web-added discs
Per the established decision, a disc added through `/discs/add` has
`internal_disc_id = NULL` and a uuid `external_id`
(`supabase/migrations/20260829010000_discs_internal_disc_id_nullable.sql`).
Consequences:
- It can never collide with a sheet row, and is never matched by a sync.
- Every query on the sync path adds `.not('internal_disc_id', 'is', null)` —
  in `syncAllDiscs` so the wipe does not destroy web-added discs, and in
  `getLatestInternalDiscId` because Postgres sorts NULLs first on `ORDER BY …
  DESC` and a NULL would otherwise be read as "the latest" and stall the sync.

### Rows present on only one side
| Situation | Result |
|---|---|
| In the sheet, not in the DB | Inserted (both the script and both sync modes). |
| In the DB, not in the sheet, sheet-imported | Survives the script; deleted and not restored by `syncAllDiscs`. |
| In the DB, web-added | Always left alone. |
| Edited in the sheet after import | Ignored — no update path exists. |

## Data
- `discs` — written by both paths. `internal_disc_id` nullable (web-added),
  `external_id` UUID NOT NULL UNIQUE with a `gen_random_uuid()` default, though
  both writers generate the uuid in JS rather than relying on the default.
- `sync_log` — `id`, `club_id`, `updated_at`; upserted by `saveSyncTime()` on
  `club_id` conflict, one row per club, read by `fetchClubs()` and shown on the
  (unreachable) sync page.

## Routes & entry points
| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/discs/sync` | GET, POST | signed-in (`isUserLoggedIn`, else redirect `/sign-in`) | Disabled via `ignoredRouteFiles`; would list clubs and offer "Päivitä KAIKKI … data" (update all) and "Päivitä UUSI … data" (update new). |
| `npm run import:puskasoturit` | CLI | `.env` credentials | Insert-only import of the Puskasoturit sheet. |

## Rules & constraints
- Env vars: `PUSKASOTURIT_SHEETS_KEY`, `TT_SHEETS_KEY` (Sheets API keys, one per
  club); `SUPABASE_URL` + `SUPABASE_KEY` for reading; and for writing either
  `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_EMAIL` + `SUPABASE_PASSWORD`
  (`scripts/supabaseClients.ts`). RLS lets only authenticated users write to
  `discs`, so the anon key alone is not enough.
- Spreadsheet ids and tab names are hard-coded in the importers; only the API
  key comes from the environment.
- Inserts are chunked 100 rows at a time in both paths.
- `scripts/` and `app/import/puskasoturitDiscFields.ts` must not use the `~/`
  alias — they run under `node --env-file=.env` with native TS stripping.
- Club selection: the script uses `PUSKASOTURIT` from `app/config/clubs.ts`; the
  disabled route takes `clubId` from the posted form, not `APP_CLUB_ID`.

## Edge cases & known gaps
- `syncAllDiscs()` calls `addDiscs()` and `saveSyncTime()` **without awaiting**,
  and `addDiscs()` maps an async function over chunks without awaiting them —
  the action can return before the inserts finish, and an insert error is
  swallowed. The CLI script deliberately awaits chunk by chunk instead.
- `syncAllDiscs()` is destructive: it deletes before it knows the insert
  succeeded. No transaction, no backup.
- The wipe-and-reinsert also discards any admin edit made in the app to a
  sheet-imported disc, and mints a new `external_id`, breaking existing SMS
  links and `message_log` references.
- Talin Tallaajat has no course column, so its discs have no `course`; the
  free-text field parsing in `puskasoturitDiscFields.ts` is Puskasoturit-only.
- Only `parseSheetDate` and the `puskasoturitDiscFields` helpers are unit
  tested; the fetch/map path of either importer is not.
- The `DiscDTO.internalDiscId` coming out of the importers is the raw string
  from the sheet; only `toDiscRow()` coerces it with `Number()`.

## Open questions
- Whether the Talin Tallaajat sheet still needs an import path at all, given no
  script exists for it and the route is disabled.
