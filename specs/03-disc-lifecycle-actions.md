# Disc lifecycle actions

> Status: as-built (describes what exists today, not a wishlist)

## Purpose

Once a disc is in the club's inventory, an admin records what became of it: it went back
to its owner, it was released for sale or donation, it was filed under the wrong course,
or it was entered by mistake. The admin also keeps a _noutolista_ ("retrieval list")
of discs that have to be brought to hand — out of the club's koppi (its storage shed)
at Talin Tallaajat, off the admin's own shelf at Puskasoturit. Either way it is a trip
the admin has to remember to make, which is why it is worth writing down.

Two things put a disc on that list, and since 2026-09-10 both of them do it by
themselves. Its owner wants it back and it has to reach them; or the club is keeping it,
to sell or donate. The second used to be a list the admin held in his head — he marked
the disc sold and then had to remember which shelf it was on — while the app already
knew both facts.

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

| State                      | How it is stored                                                                                           | Public list shows it?                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Listed (default)           | `is_returned_to_owner = false`, `can_be_sold_or_donated = false`, `archived_at IS NULL`                    | yes                                                                                                         |
| Returned to owner          | `is_returned_to_owner = true` + `returned_to_owner_date` + `return_method`                                 | no                                                                                                          |
| Released for sale/donation | `can_be_sold_or_donated = true` + `can_be_sold_or_donated_date` + `can_be_sold_or_donated_method`          | no                                                                                                          |
| Archived                   | `archived_at` set                                                                                          | no                                                                                                          |
| Deleted                    | row gone (`disc_retrievals` cascades)                                                                      | no                                                                                                          |
| On the retrieval list      | orthogonal: an open `disc_retrievals` row (`retrieved_at IS NULL`) on a disc not returned and not archived | only if still listed: a listed disc shows with an extra icon, a released one shows nowhere but `/retrieval` |

Transitions:

```
                    +-- mark returned ---> Returned  (terminal in the UI)
                    |
   Listed ----------+-- mark disposal ---> Released  (terminal in the UI)
                    |                        and onto the retrieval list
     |  ^           |
     |  |           +-- delete ----------> gone
     |  |
     |  +-- (manual SQL) archived_at cleared
     +----- (archive:discs script) archived_at set -----> Archived

   Listed --- request retrieval ---> on retrieval list (open row, with a method)
     |            ^        |
     +-- owner answers "I want it back, post it / I'll collect it from you"
     |   on the sms link --> the same open row, owner_response_id set
     |            |
                  |        +-- change method (updates the same open row)
                  |        |
                  |        +-- "Merkitse noudetuksi" --> retrieved_at set, row closes
                  |
                  +-- a later request inserts a NEW row (history keeps both)

   Listed/Released --- mark disposal, or the owner answers "keep it"
                       ---> an open row with no method

   Marking a listed disc returned or archived silently drops any open retrieval
   row off the list (it is filtered out, never closed). Releasing it for sale or
   donation does the opposite: it puts one there.
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
   current method — except for a disc on the list because the club is keeping it, which
   has no method to preselect; picking one there is how the admin says it goes back to
   its owner after all. Offered on both clubs.
6. When an admin opens `/retrieval`, "Noutolista" lists the pending errands newest first
   as phone-sized cards: colour + name, what is to be done with it, an `sms:` link (tapping the number
   opens a message to the owner, not a call) followed by the owner's name in brackets, and both dates together on the bottom row —
   "Pyydetty" (requested) then "Kirjattu" (entered), as on the answers page.
   "Merkitse noudetuksi" (mark as fetched), behind a confirm, closes the row. Both kinds
   of errand are one list in one order: the second line reads "Postitus" / "Nouto
   (minulta)" for a disc going back to its owner and "Myyntiin tai lahjoitukseen" for one
   the club is keeping, which is all that separates them. The card is the same otherwise,
   phone number included — the owner of a disc being sold is still who to ask about it.
7. When the retrieval list has pending rows, the admin menu item shows the count
   (`loadRetrievalCount.server.ts`); it is absent only when nobody is signed in.
8. When a disc's owner answers on the sms link, the disc appears on the retrieval list by
   itself, with no admin step in between: "haluan kiekkoni takaisin" (I want my disc back)
   with either post or collection from the admin makes an errand with that method, and
   giving the disc up makes one with none — the club is keeping it, and it still has to
   come off the shelf. An owner who says they will collect it from the koppi themselves
   creates no row: the disc never comes to the admin, so there is no errand. The answer
   still lands in the "Vastaukset" (answers) inbox either way; the retrieval row is in
   addition to it, not instead of it.
9. When an admin marks a disc "myytäväksi tai lahjoitettavaksi", the disc leaves the disc
   list and appears on the retrieval list, whether it was marked one at a time or as part
   of a batch selection. Nothing is asked of the admin at the point of marking; the errand
   is written straight after the mark by `queryRequestDisposalRetrievals.server.ts`, which
   makes the same update-or-insert an admin's "Lisää noutolistalle" makes, over a set of
   discs instead of one. Only discs marked from 2026-09-10 onwards: the migration backfills
   nothing, on the grounds that a list opening with every disc ever released is one nobody
   reads.
10. The intro paragraph on `/retrieval` names no place: "Kiekot, joita ei ole vielä haettu:
    omistajien pyytämät sekä myyntiin tai lahjoitukseen menevät. Merkitse kiekko
    noudetuksi, kun se on sinulla…" (discs not yet fetched — the ones owners have asked
    for and the ones going to sale or donation; mark one as fetched when you have it). On
    Puskasoturit the disc is on the admin's own shelf, and a wording per club would be a
    second place recording where a club keeps its discs.

## Data

`discs` columns this feature owns:

| Column                          | Type                  | Notes                                                           |
| ------------------------------- | --------------------- | --------------------------------------------------------------- |
| `is_returned_to_owner`          | bool                  | set by the return mark                                          |
| `returned_to_owner_date`        | date                  |                                                                 |
| `return_method`                 | smallint, nullable    | CHECK in (0,1); nullable = "unanswered"                         |
| `can_be_sold_or_donated`        | bool                  | set by the disposal mark                                        |
| `can_be_sold_or_donated_date`   | date                  |                                                                 |
| `can_be_sold_or_donated_method` | smallint, nullable    | CHECK in (0,1)                                                  |
| `can_be_sold_or_donated_text`   | text                  | legacy free text from the Sheet; never written by these actions |
| `archived_at`                   | timestamptz, nullable | "club stopped listing it", indexed; stats ignore it             |
| `course`                        | text, nullable        |                                                                 |

`disc_retrievals` (`20260903000000_disc_retrievals.sql`) — one row per errand, deliberately
not columns on `discs`:

- `disc_id BIGINT` FK to `discs.id` `ON DELETE CASCADE` (numeric id, not `external_id`)
- `requested_at`, `retrieved_at` (nullable — NULL is what puts the row on the list)
- `retrieval_method SMALLINT NULL` — what the owner asked for; NULL for an errand that is
  not going to an owner at all
- CHECK `retrieval_method IS NULL OR retrieval_method IN (0,1)`
  (`20260910000000_retrieval_for_disposal.sql`, replacing the `NOT NULL` and the
  values-only CHECK). **NULL is the whole of how the two kinds of errand are told apart**:
  a disc the club is keeping is not going to an owner, so it has no handover method. No
  other writer produces NULL, and every row written before that date has a method.
- CHECK `retrieved_at >= requested_at`; partial UNIQUE index on `disc_id WHERE retrieved_at IS NULL`
- RLS (row level security — the PostgreSQL feature that decides, row by row, whether a
  database role may read or write it): `authenticated` only, all four verbs; nothing for
  `anon`. Still true now that an owner's answer can create a row: it reaches this table
  only from inside `submit_owner_response()`, which runs as its creator.
- `owner_response_id BIGINT NULL REFERENCES disc_owner_responses(id) ON DELETE SET NULL`
  (`20260904030000_owner_answer_creates_retrieval.sql`) — which answer put the disc on
  the list. NULL means the admin did, by hand. `SET NULL` rather than `CASCADE`: losing
  the answer must not silently lose the errand, since the disc still has to be fetched.
- `requested_by SMALLINT` (0 = the club, 1 = the owner) existed in the original migration
  and was dropped again in `20260904010000_owner_link_club_scope.sql`, because nothing
  ever wrote anything but 0 and a column with one value reads like a fact that is being
  kept. That migration's own comment says provenance should come back as
  `owner_response_id` if an answer ever creates a retrieval; this is that case, and
  follows it. A foreign key to the answer beats an enum: it says _which_ answer,
  so the admin can read the address and the phone number the request came with.

### Three distinct method enums

| Enum                                               | Where stored                          | Values | Labels                                                |
| -------------------------------------------------- | ------------------------------------- | ------ | ----------------------------------------------------- |
| `ReturnMethod` (`return/returnMethod.ts`)          | `discs.return_method`                 | 0, 1   | "Postitettu", "Noudettu" (past tense — what happened) |
| `DisposalMethod` (`disposal/disposalMethod.ts`)    | `discs.can_be_sold_or_donated_method` | 0, 1   | "Myydään", "Lahjoitetaan"                             |
| `RetrievalMethod` (`retrieval/retrievalMethod.ts`) | `disc_retrievals.retrieval_method`    | 0, 1   | "Postitus", "Nouto (minulta)" (what was asked for)    |

There is no fourth enum for "sale or donation" as an errand. The nullable column is
decoded once on the way out of the database into `RetrievalErrand`
(`retrieval/retrievalErrand.ts`), a two-case union — `{ kind: 'to-owner'; method }` or
`{ kind: 'kept-by-club' }` — so nothing downstream carries a nullable method that could be
read as either fact. `toRetrievalErrand()` is the one place that decode happens, so the
two queries reading the table cannot disagree about it, and `retrievalErrandLabel()` — both
in the same file — is what puts the fixed "Myyntiin tai lahjoitukseen" on the card; `DisposalMethod` says which of the two the club
intends, on the disc itself, and the retrieval list does not show it.

`RetrievalMethod` is **not its own enum**: it is `HandoverMethod`
(`app/features/discs/handoverMethod.ts`, values 0 `ByMail` / 1 `PickedUpFromHome` /
2 `PickedUpFromStorage`) narrowed to `FETCHING_HANDOVER_METHODS` — the two that require a
trip to storage. `PickedUpFromStorage` (2) is rejected by `isRetrievalMethod` and by the DB
CHECK. All three enums are built by `app/lib/methodEnum.ts`; the numbers are persisted, so
add, never renumber, and extend the CHECK alongside.

## Routes & entry points

| Route              | Method(s) | Auth      | Purpose                                                                                                                           |
| ------------------ | --------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/discs/return`    | POST JSON | admin     | `{externalId, returnedToOwnerDate, returnMethod\|null}` → `{returned:true}`                                                       |
| `/discs/disposal`  | POST JSON | admin     | `{externalId, canBeSoldOrDonatedDate, canBeSoldOrDonatedMethod\|null}` → `{marked:true}`, and the disc goes on the retrieval list |
| `/discs/delete`    | POST JSON | admin     | `{externalId}` → `{deleted:true}`                                                                                                 |
| `/discs/course`    | POST JSON | admin     | `{externalId, course\|null}` → `{marked:true}`                                                                                    |
| `/discs/retrieval` | POST JSON | admin     | `{externalId, retrievalMethod}` → `{onRetrievalList:true}`                                                                        |
| `/retrieval`       | GET       | signed in | the "Noutolista" page                                                                                                             |
| `/retrieval`       | POST form | signed in | `externalId` → closes the open row, revalidates                                                                                   |

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
  `queryDiscIdByExternalId.server.ts` for one disc or `queryDiscIdsByExternalIds.server.ts`
  for a set, both of which carry the club filter.
- `updateDisc` distinguishes `not-found` (404) from `not-permitted` (403) by re-selecting
  the row: RLS refuses an UPDATE by filtering, not by raising. `markRefusal` maps both.
- `queryPendingRetrievals.server.ts` is the single filter chain behind the page, the menu
  count and the row icons: open row **and** disc not returned and not archived,
  club-scoped through the `discs!inner` join. It filtered out released discs too until
  2026-09-10; dropping that one condition is what lets a disposal errand be seen, and it
  also means a disc marked released while its owner's request was open stays on the list
  rather than vanishing off it.
- **Every write to the list is `queryRequestRetrievals.server.ts`**: resolve the external
  ids to this club's disc ids, set the method on whatever open rows exist, insert a row for
  the rest. One function rather than one per caller, since the update-or-insert and its
  ordering are the whole of what this feature has to get right. It takes a set of ids and a
  method that may be null — null being a disc the club is keeping — so the admin's "Lisää
  noutolistalle" passes one id and a method, and a disposal passes the selection and null.
  It returns how many discs this club actually had, which is how `handleRetrievalRequest`
  answers 404 for another club's id.
- **The disposal errand is written next to the mark**, through
  `queryRequestDisposalRetrievals.server.ts` — the write above plus the message for a
  half-done state — called from `handleDisposalRequest` with one external id and from
  `handleBatchRequest` with the whole selection. It runs **after** the mark and takes the
  ids the mark was asked for rather than the ones it changed; an id from another club drops
  out in the lookup either way.
- The mark and the errand are **two writes, not one transaction**, so the admin is told
  which half happened: "Kiekko merkittiin, mutta noutolistalle lisääminen epäonnistui."
  (plural "Kiekot" for a batch). The sentence is composed in one place, by the query that
  failed, because it knows how many discs it was asked about. A plain failure would read as
  "nothing happened", and the disc is marked — and once it is, it is off the disc list, so the
  storage icon is no longer there to add the errand by hand. The recovery is SQL.
- A disc already on the list when it is released has its open row **converted** rather
  than duplicated: the method is cleared, `requested_at` and `owner_response_id` are left
  alone. The reverse conversion is the same function called with a method, which writes it
  onto whatever open row is there. Either way there is one open errand per
  disc, which is what the partial unique index already promised.
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
  a row with a method is created when `choice = 1` (wants it back) **and**
  `handover_method` is 0 (post) or 1 (collect from the admin), and a row with none when
  `choice = 0` (gives it up). `handover_method = 2` (collect from the koppi) is the one
  answer that creates nothing — the disc stays where it is and the owner comes to it, so
  it is an errand for nobody. That is the same narrowing `needsFetchingFromStorage`
  applies. A "gives it up" answer still changes nothing on `discs`: releasing the disc
  remains the admin's mark to make, and until he makes it the disc stays on the public
  list.
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
- The return mark does _not_ close an open retrieval row. The row stays in the table with
  `retrieved_at IS NULL` for ever; it merely stops being _pending_ because the disc is no
  longer listed. Retrieval-duration statistics computed later would see these as open.
- `queryCompleteRetrieval` reports `done` for a disc with no open request, so a double tap
  on "Merkitse noudetuksi" is not an error.
- `handleRetrievedRequest` returns `null` for a disc from another club: the club filter
  lives in `queryDiscIdByExternalId`, and a `not-found` outcome is discarded.
- `toRetrievalErrand` reads an out-of-range smallint as `kept-by-club`, the same as a null,
  so such a row reads as "Myyntiin tai lahjoitukseen" rather than as a method it might not
  be. Either way the disc is on the shelf and the line is on the list. The CHECK constraint
  should make it impossible; if it ever happens, a corrupt row claims the club is keeping a
  disc its owner asked for, and only the answers inbox would say otherwise.
- A disc on the list because its owner gave it up, but not yet marked released, is still
  on the disc list — and its storage icon is orange with no method preselected. That is
  the window between reading the answers inbox and making the mark; it closes as soon as
  the admin marks the disc, which takes it off the disc list altogether.
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
- Whether a disposal line should say which of sale or donation was chosen.
  `discs.can_be_sold_or_donated_method` knows, when the admin answered it at all, but the
  errand — fetch this one, it is not going back — is the same either way.
- Whether the list should show that a line came from an owner's own answer rather than
  from the admin's transcription. `owner_response_id` makes it possible; nothing in the UI
  reads it, on the grounds that the errand is the same either way.
- Whether an owner asking for a disc that is already marked returned, released or archived
  should be able to reopen it. Today `submit_owner_response()` refuses such a token
  outright, so the question never reaches the retrieval list.
