# Disc lifecycle actions

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
Once a disc is in the club's inventory, an admin records what became of it: it went back
to its owner, it was released for sale or donation, it was filed under the wrong course,
or it was entered by mistake. The admin also keeps a *noutolista* ("retrieval list")
of discs that have to be brought to hand before an owner can get them — out of the
club's koppi (its storage shed) at Talin Tallaajat, off the admin's own shelf at
Puskasoturit. Either way it is a trip the admin has to remember to make, which is why
it is worth writing down.

## Actors
- **Club admin** (signed in) — the actor for every action below, each behind
  `requireAdminJson` or an `isUserLoggedIn` check.
- **A disc's owner** (anonymous, holding an sms link) — can put a disc on the retrieval
  list, and nothing else here. Never by writing to the table:
  the only way in is `submit_owner_response()`, a `SECURITY DEFINER` function (one that
  runs with its creator's rights rather than the caller's, so `anon` needs no privilege
  on the tables it touches). See spec 05.
- No cron path writes any of these.

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
     |            ^        |
     +-- owner answers "I want it back, post it / I'll collect it from you"
     |   on the sms link --> the same open row, owner_response_id set
     |            |
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
5. When an admin clicks the storage icon, `RetrievalMethodForm` opens; the method is
   **required** ("Postitus" (by post) / "Nouto (minulta)" (collect from me)). The icon
   turns orange once the disc is on the list, and reopening the form preselects the
   current method. Offered on both clubs.
6. When an admin opens `/retrieval`, "Noutolista" lists the pending errands oldest first
   as phone-sized cards: colour + name, date entered, method, request date, a `tel:` link
   and the owner's name. "Merkitse noudetuksi" (mark as fetched), behind a confirm, closes
   the row.
7. When the retrieval list has pending rows, the admin menu item shows the count
   (`loadRetrievalCount.server.ts`); it is absent only when nobody is signed in.
8. When a disc's owner answers "haluan kiekkoni takaisin" (I want my disc
   back) on the sms link and asks for either post or collection from the admin, the disc
   appears on the retrieval list by itself, with no admin step in between. An owner who
   says they will collect it from the koppi themselves creates no row — the disc never
   comes to the admin, so there is no errand — and neither does an owner who gives the
   disc up. The answer still lands in the "Vastaukset" (answers) inbox either way; the
   retrieval row is in addition to it, not instead of it.
9. The intro paragraph on `/retrieval` names no place: "Kiekot, joita omistajat ovat
   pyytäneet ja joita ei ole vielä haettu. Merkitse kiekko noudetuksi, kun se on
   sinulla…" (discs owners have asked for and that have not been fetched yet; mark one
   as fetched when you have it). On Puskasoturit the disc is on the admin's own shelf,
   and a wording per club would be a second place recording where a club keeps its
   discs.

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
- RLS (row level security — the PostgreSQL feature that decides, row by row, whether a
  database role may read or write it): `authenticated` only, all four verbs; nothing for
  `anon`. Still true now that an owner's answer can create a row: it reaches this table
  only from inside `submit_owner_response()`, which runs as its creator.
- `owner_response_id BIGINT NULL REFERENCES disc_owner_responses(id) ON DELETE SET NULL`
  (`20260904020000_owner_answer_creates_retrieval.sql`) — which answer put the disc on
  the list. NULL means the admin did, by hand. `SET NULL` rather than `CASCADE`: losing
  the answer must not silently lose the errand, since the disc still has to be fetched.
- `requested_by SMALLINT` (0 = the club, 1 = the owner) existed in the original migration
  and was dropped again in `20260904010000_owner_link_club_scope.sql`, because nothing
  ever wrote anything but 0 and a column with one value reads like a fact that is being
  kept. That migration's own comment says provenance should come back as
  `owner_response_id` if an answer ever creates a retrieval; this is that case, and
  follows it. A foreign key to the answer beats an enum: it says *which* answer,
  so the admin can read the address and the phone number the request came with.

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
| `/discs/retrieval` | POST JSON | admin | `{externalId, retrievalMethod}` → `{onRetrievalList:true}` |
| `/retrieval` | GET | signed in | the "Noutolista" page |
| `/retrieval` | POST form | signed in | `externalId` → closes the open row, revalidates |

No route of this feature is reachable without a session. The one non-admin entry point
is the database function `submit_owner_response()`, described in spec 05.

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
- **The retrieval list is not gated on the club.** It was until 2026-09-04, by
  `isRetrievalListEnabled()` in `app/config/clubs.ts`; that function and all five of its
  call sites are gone. The reasoning it was built on — that only Talin stores discs
  somewhere the admin has to travel to — was wrong about what the list is for: a
  Puskasoturit disc is on the admin's shelf rather than in a shed, but it still has to be
  found, packed and posted, and the same four facts (what it looks like, when it arrived,
  who to call, what they asked for) are what the admin needs in front of them. What keeps
  one club's errands off the other's list is `queryPendingRetrievals`, not a feature flag.
- What an owner's answer does to the retrieval list is decided entirely by the answer's
  own fields, inside `submit_owner_response()` after the answer row is inserted:
  a row is created when `choice = 1` (wants it back) **and** `handover_method` is 0 (post)
  or 1 (collect from the admin). `handover_method = 2` (collect from the koppi) and
  `choice = 0` (gives it up) create nothing. This is the same narrowing
  `needsFetchingFromStorage` and the `disc_retrievals` CHECK already apply — a disc the
  owner collects from the koppi is not an errand for anybody.
- An answer for a disc that is **already** on the list updates the open row
  rather than failing — `ON CONFLICT (disc_id) WHERE retrieved_at IS NULL DO UPDATE`,
  using the partial unique index as the arbiter — setting `retrieval_method` to what the
  owner asked for and `owner_response_id` to the new answer, and leaving `requested_at`
  alone, because the errand is as old as the first request. Without this the whole
  `submit_owner_response()` call would raise and the owner would be told their link is
  unknown, which is both untrue and unfixable from their side. The owner is the authority
  on what they want, so their later word wins over an earlier transcription.
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
- ~~Two sources of truth for "this club stores discs offsite".~~ Closed on 2026-09-04
  with `isRetrievalListEnabled()`. `clubs.stores_discs_offsite` (set for club 2 in
  `20260903010000_owner_responses.sql`) is now the one place, and it decides one thing:
  whether "Nouto varastolta" is offered to an owner.
- An owner can put a disc on the list repeatedly by answering the link again
  with a different method, and nothing tells the admin the line changed under them. The
  list shows the current method and the original request date; a disc whose method flipped
  from "Postitus" to "Nouto (minulta)" after the admin already bought a stamp looks the
  same as one that always said so. The answers inbox is where the history is.
- `owner_response_id` is only as durable as the answer row. Nothing deletes answers
  today, but the shipping-address wipe (spec 05) empties the address fields of a handled
  answer in place, so a retrieval row can end up pointing at an answer that no longer says
  where to post the disc.
- **The SQL has no automated test.** The rule deciding which answers become errands lives
  in `submit_owner_response()`, and this repo's tests are Vitest unit tests over TypeScript
  modules with no database — nothing exercises the function, the `ON CONFLICT` branch or
  the club scoping inside it. `handoverMethod.test.ts` pins the two numbers the migration
  hardcodes (`FETCHING_HANDOVER_METHODS` equals `[0, 1]`), which is as close as the current
  setup gets; the rest was checked by reading.
- The delete is a hard delete; `disc_retrievals` cascades, message log rows do not go with it.

## Open questions
- Whether a return mark should close the open retrieval row rather than let it be
  filtered out.
- Whether the list should show that a line came from an owner's own answer rather than
  from the admin's transcription. `owner_response_id` makes it possible; nothing in the UI
  reads it, on the grounds that the errand is the same either way.
- Whether an owner asking for a disc that is already marked returned, released or archived
  should be able to reopen it. Today `submit_owner_response()` refuses such a token
  outright, so the question never reaches the retrieval list.
