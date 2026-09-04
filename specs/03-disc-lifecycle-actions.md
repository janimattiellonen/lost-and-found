# Disc lifecycle actions

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
Once a disc is in the club's inventory, an admin records what became of it: it went back
to its owner, it was released for sale or donation, it was filed under the wrong course,
or it was entered by mistake. Talin Tallaajat additionally keeps a *noutolista*
("retrieval list") of discs that have to be fetched out of the club's storage before an
owner can get them.

## Actors
- **Club admin** (signed in) — the only actor. Every action below is behind
  `requireAdminJson` or an `isUserLoggedIn` check.
- No anonymous or cron path writes any of these.

## Disc state model

A disc's state is not one column. It is the combination of three flags/timestamps on
`discs` plus the presence of an open row in `disc_retrievals`.

| State | How it is stored | Public list shows it? |
|---|---|---|
| Listed (default) | `is_returned_to_owner = false`, `can_be_sold_or_donated = false`, `archived_at IS NULL` | yes |
| Returned to owner | `is_returned_to_owner = true` + `returned_to_owner_date` + `return_method` | no |
| Released for sale/donation | `can_be_sold_or_donated = true` + `can_be_sold_or_donated_date` + `can_be_sold_or_donated_method` | no |
| Archived | `archived_at` set | no |
| Deleted | row gone (`disc_retrievals` cascades) | no |
| On the retrieval list | orthogonal: an open `disc_retrievals` row (`retrieved_at IS NULL`) on a *listed* disc | yes, with an extra icon |

Transitions:

```
                    +-- mark returned ---> Returned  (terminal in the UI)
                    |
   Listed ----------+-- mark disposal ---> Released  (terminal in the UI)
     |  ^           |
     |  |           +-- delete ----------> gone
     |  |
     |  +-- (manual SQL) archived_at cleared
     +----- (archive:discs script) archived_at set -----> Archived

   Listed --- request retrieval ---> on retrieval list (open row)
                  ^        |
                  |        +-- change method (updates the same open row)
                  |        |
                  |        +-- "Merkitse noudetuksi" --> retrieved_at set, row closes
                  |
                  +-- a later request inserts a NEW row (history keeps both)

   Marking a listed disc returned / released / archived silently drops any
   open retrieval row off the list (it is filtered out, never closed).
```

Course is not a state; `setDiscCourse` can run in any state.

## User-facing behaviour
1. When an admin clicks the return icon on a disc row, an inline
   "Merkitse palautetuksi" (mark as returned) form opens with today's date and optional
   radios "Postitettu"/"Noudettu"; submitting sets the three return columns.
2. When an admin clicks the sale icon, "Merkitse myytäväksi tai lahjoitettavaksi"
   (mark for sale or donation) opens with the same shape and radios
   "Myydään"/"Lahjoitetaan".
3. When an admin clicks the delete icon, `window.confirm`
   "Poistetaanko kiekko X (owner)? Poistoa ei voi peruuttaa." precedes a hard delete.
4. When a club has courses configured, a course icon opens `CourseForm`; "Ei rataa"
   (no course) is a real option that clears `discs.course`.
5. When the club is Talin Tallaajat, a storage icon opens `RetrievalMethodForm`; the
   method is **required** ("Postitus"/"Nouto (minulta)"). The icon turns orange once the
   disc is on the list, and reopening the form preselects the current method.
6. When an admin opens `/retrieval`, "Noutolista" lists the pending errands oldest first
   as phone-sized cards: colour + name, date entered, method, request date, a `tel:` link
   and the owner's name. "Merkitse noudetuksi" (mark as fetched), behind a confirm, closes
   the row.
7. When the retrieval list has pending rows, the admin menu item shows the count
   (`loadRetrievalCount.server.ts`); the item is absent entirely for other clubs.

## Data

`discs` columns this feature owns:

| Column | Type | Notes |
|---|---|---|
| `is_returned_to_owner` | bool | set by the return mark |
| `returned_to_owner_date` | date | |
| `return_method` | smallint, nullable | CHECK in (0,1); nullable = "unanswered" |
| `can_be_sold_or_donated` | bool | set by the disposal mark |
| `can_be_sold_or_donated_date` | date | |
| `can_be_sold_or_donated_method` | smallint, nullable | CHECK in (0,1) |
| `can_be_sold_or_donated_text` | text | legacy free text from the Sheet; never written by these actions |
| `archived_at` | timestamptz, nullable | "club stopped listing it", indexed; stats ignore it |
| `course` | text, nullable | |

`disc_retrievals` (`20260903000000_disc_retrievals.sql`) — one row per errand, deliberately
not columns on `discs`:

- `disc_id BIGINT` FK to `discs.id` `ON DELETE CASCADE` (numeric id, not `external_id`)
- `requested_at`, `retrieved_at` (nullable — NULL is what puts the row on the list)
- `retrieval_method SMALLINT NOT NULL`, CHECK in (0,1)
- CHECK `retrieved_at >= requested_at`; partial UNIQUE index on `disc_id WHERE retrieved_at IS NULL`
- RLS: `authenticated` only, all four verbs; nothing for `anon`
- `requested_by` existed in the original migration and was dropped again in
  `20260904010000_owner_link_club_scope.sql` — provenance lives in `disc_owner_responses`.

### Three distinct method enums

| Enum | Where stored | Values | Labels |
|---|---|---|---|
| `ReturnMethod` (`return/returnMethod.ts`) | `discs.return_method` | 0, 1 | "Postitettu", "Noudettu" (past tense — what happened) |
| `DisposalMethod` (`disposal/disposalMethod.ts`) | `discs.can_be_sold_or_donated_method` | 0, 1 | "Myydään", "Lahjoitetaan" |
| `RetrievalMethod` (`retrieval/retrievalMethod.ts`) | `disc_retrievals.retrieval_method` | 0, 1 | "Postitus", "Nouto (minulta)" (what was asked for) |

`RetrievalMethod` is **not its own enum**: it is `HandoverMethod`
(`app/features/discs/handoverMethod.ts`, values 0 `ByMail` / 1 `PickedUpFromHome` /
2 `PickedUpFromStorage`) narrowed to `FETCHING_HANDOVER_METHODS` — the two that require a
trip to storage. `PickedUpFromStorage` (2) is rejected by `isRetrievalMethod` and by the DB
CHECK. All three enums are built by `app/lib/methodEnum.ts`; the numbers are persisted, so
add, never renumber, and extend the CHECK alongside.

## Routes & entry points

| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/discs/return` | POST JSON | admin | `{externalId, returnedToOwnerDate, returnMethod\|null}` → `{returned:true}` |
| `/discs/disposal` | POST JSON | admin | `{externalId, canBeSoldOrDonatedDate, canBeSoldOrDonatedMethod\|null}` → `{marked:true}` |
| `/discs/delete` | POST JSON | admin | `{externalId}` → `{deleted:true}` |
| `/discs/course` | POST JSON | admin | `{externalId, course\|null}` → `{marked:true}` |
| `/discs/retrieval` | POST JSON | admin + Talin only | `{externalId, retrievalMethod}` → `{onRetrievalList:true}` |
| `/retrieval` | GET | signed in + Talin only | the "Noutolista" page |
| `/retrieval` | POST form | signed in + Talin only | `externalId` → closes the open row, revalidates |

All five JSON routes are resource routes (no component) delegating to a
`handle*Request.server.ts`.

## Rules & constraints
- `requireAdminJson`: POST only (405), signed in (401), parseable JSON (400).
- `isExternalId` is a strict uuid regex; `isIsoDate` rejects `2026-02-30`.
- Return and disposal methods are **optional** (`null` allowed, and clearable). The
  retrieval method is **required** — a list line that does not say post-or-hand-over sends
  the admin back to the SMS thread.
- Course is validated against `getDiscCourseNames(APP_CLUB_ID)`; an unknown name is a 422
  `Tuntematon rata "X".` so it cannot leak into the list page's course filter.
- Every write is scoped to `APP_CLUB_ID`: the disc updates/deletes add `.eq('club_id', …)`,
  and every `disc_retrievals` write resolves `external_id → id` through
  `queryDiscIdByExternalId.server.ts`, which carries the club filter.
- `updateDisc` distinguishes `not-found` (404) from `not-permitted` (403) by re-selecting
  the row: RLS refuses an UPDATE by filtering, not by raising. `markRefusal` maps both.
- `queryPendingRetrievals.server.ts` is the single filter chain behind the page, the menu
  count and the row icons: open row **and** disc still listed (not returned, not released,
  not archived), club-scoped through the `discs!inner` join.
- The retrieval list is gated by `isRetrievalListEnabled()` in `app/config/clubs.ts` —
  hardcoded `currentClubId() === TALIN_TALLAAJAT` — checked in the loader, the action and
  the list loader, not only in the UI.
- Dates are formatted in the browser (`format(new Date(), 'y-MM-dd')`), because the server
  runs in UTC and a Finnish evening is already the next day there.

## Edge cases & known gaps
- **Archiving has no UI.** `archived_at` is read by `getDiscs`, the owner-link loader
  and the retrieval filter, and mapped by `DiscMapper`, but no route or action writes it.
  It is set by the maintenance script `scripts/archiveStaleDiscs.ts`
  (`npm run archive:discs`), which archives unresolved discs added before a cutoff.
  Clearing it (putting a disc back on the list) is a manual SQL update.
- No transition is reversible from the UI: nothing clears `is_returned_to_owner`,
  `can_be_sold_or_donated` or `archived_at`. A wrong mark is fixed in SQL.
- Two maintenance scripts sit outside the UI entirely and are the only writers of their
  columns: `npm run archive:discs` and `npm run import:puskasoturit` (spec 09).
- The return mark does *not* close an open retrieval row. The row stays in the table with
  `retrieved_at IS NULL` for ever; it merely stops being *pending* because the disc is no
  longer listed. Retrieval-duration statistics computed later would see these as open.
- `queryCompleteRetrieval` reports `done` for a disc with no open request, so a double tap
  on "Merkitse noudetuksi" is not an error.
- `handleRetrievedRequest` returns `null` for a disc from another club: the club filter
  lives in `queryDiscIdByExternalId`, and a `not-found` outcome is discarded.
- `queryRetrievalList` falls back to `RetrievalMethod.PickedUp` for an out-of-range
  smallint — a wasted trip rather than a wasted stamp.
- Two sources of truth for "this club stores discs offsite": `isRetrievalListEnabled()`
  hardcodes club 2 in TypeScript, while `clubs.stores_discs_offsite` (set for club 2 in
  `20260903010000_owner_responses.sql`) says the same thing in SQL for the owner-link
  functions. They can drift.
- The delete is a hard delete; `disc_retrievals` cascades, message log rows do not go with it.

## Open questions
- Whether a return mark should close the open retrieval row rather than let it be
  filtered out.
