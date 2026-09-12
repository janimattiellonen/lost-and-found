# Disc detail editing

> Status: as-built (describes what exists today, not a wishlist)

## Purpose

Every other disc action writes one thing: a return, a disposal, a course. Nothing
lets an admin fix what was written down wrong in the first place — a mistyped
phone number, "Destoryer" for "Destroyer", a colour read off the wrong disc.
Until now the only repair was a `psql` session or the Supabase SQL editor against
the live database, which is a high-risk tool for a two-character typo.

This feature is one form holding every editable column of one disc, reached from
the disc list, so a correction costs a click rather than a hand-written `UPDATE`.

## Actors

- **Club admin** (signed in) — the only actor. Both the loader and the action
  check the session; there is no anonymous path in or out.
- No cron or import path uses this route. The Google Sheets sync writes the same
  columns independently (spec 09), which matters — see "Edge cases".

## User-facing behaviour

1. When an admin is signed in, every row of the disc list carries a pencil icon
   linking to that disc's edit page.
2. When the page opens, every field is filled in with what is stored, the owner's
   phone number in full (unlike the public list, which shows four digits).
3. When the admin changes a field and presses "Tallenna muutokset" (save
   changes), the disc is updated and the page says "Kiekon tiedot tallennettu."
   (the disc's details were saved) above the form.
4. When a required field is empty or a value is impossible, nothing is written
   and the page comes back with a Finnish message under the offending field.
5. When the admin ticks "Palautettu omistajalle" (returned to its owner) and
   gives a date, the disc leaves the public list exactly as the list's own
   row action would have left it.
6. When the admin ticks "Myytävissä tai lahjoitettavissa" (available to be sold
   or donated) and gives a date, the disc leaves the public list and goes onto
   the retrieval list as a "kept by the club" errand — the same pair of writes
   the list's own disposal action makes.
7. When the admin unticks either box, the disc comes back to the public list and
   that box's date and method are cleared. This is the only way back: the list's
   row actions are one-way.
8. When the admin presses "Peru" (cancel), they return to the disc list with
   nothing written.
9. When the disc does not exist, or belongs to another club, the page answers
   404 rather than an empty form.

## Data

Every column below lives on `discs` and is written by this one form. Nothing here
is new: the feature adds no migration.

| Column                          | Type             | Null? | Edited as                                         |
| ------------------------------- | ---------------- | ----- | ------------------------------------------------- |
| `disc_name`                     | text             | no    | one text field, required                          |
| `disc_colour`                   | text             | no    | one text field; empty is stored as `''`           |
| `disc_manufacturer`             | text             | yes   | text field; empty is stored as `NULL`             |
| `owner_name`                    | text             | yes   | text field; empty is stored as `NULL`             |
| `owner_phone_number`            | text             | yes   | text field; empty is stored as `NULL`             |
| `course`                        | text             | yes   | dropdown of this club's courses, plus "no course" |
| `additional_info`               | text             | yes   | textarea; club-internal, never publicly shown     |
| `is_returned_to_owner`          | boolean          | no    | checkbox                                          |
| `returned_to_owner_date`        | date (`y-MM-dd`) | yes   | date field, required while the checkbox is ticked |
| `return_method`                 | smallint         | yes   | dropdown: 0 `Postitettu`, 1 `Noudettu`, or none   |
| `can_be_sold_or_donated`        | boolean          | no    | checkbox                                          |
| `can_be_sold_or_donated_date`   | date (`y-MM-dd`) | yes   | date field, required while the checkbox is ticked |
| `can_be_sold_or_donated_method` | smallint         | yes   | dropdown: 0 `Myydään`, 1 `Lahjoitetaan`, or none  |

`disc_name` carries the plastic as well, joined the way the Google Sheet has
always written it — "Destroyer, Star". The form edits the joined string as one
field rather than splitting it, because the split is a convention of the text
parser (spec 02) and not something the column records.

The smallint values are stored in the database, so the numbers are part of the
contract; see `app/lib/methodEnum.ts`.

Columns deliberately **not** editable here: `external_id`, `internal_disc_id`,
`club_id`, `added_at`, `owner_link_token`, `archived_at`, `notified_at`, and the
two free-text `*_text` columns the Google Sheet filled in. The identity columns
are not an admin's to change; the `*_text` columns are imported history, left
untouched for the same reason the list's row actions leave them alone.

## Routes & entry points

| Route                     | Method(s) | Auth            | Purpose                                                       |
| ------------------------- | --------- | --------------- | ------------------------------------------------------------- |
| `/discs/:externalId/edit` | GET       | signed-in admin | The form, filled in from the disc                             |
| `/discs/:externalId/edit` | POST      | signed-in admin | Validates and saves; re-renders with errors or a success note |

`external_id` is the uuid every disc carries, including one added through the web
app, which has no Google Sheet row number to be addressed by. It is the same key
every other admin disc action uses.

The route is `/discs/…`, in the admin namespace beside `/discs/add` and
`/discs/batch`, and deliberately not `/disc/…`: `/disc/:token` is the public
owner link sent out in text messages (spec 05), and the two must not sit under
one prefix.

## Rules & constraints

- **Auth.** `loadEditDiscPage` and `editDiscFromForm` each call `isUserLoggedIn`
  and redirect to `/sign-in` when it is false. Row level security (RLS) — the
  PostgreSQL feature deciding, row by row, whether a role may read or write it —
  is the second line: `anon` has no UPDATE on `discs`, so a forged POST writes
  nothing even if the route check were removed. See `docs/rls.md`.
- **Club scoping.** Both the SELECT and the UPDATE are filtered by
  `club_id = APP_CLUB_ID` (the environment variable naming the one club this
  deployment serves) as well as by `external_id`. Guessing another club's uuid
  reaches nothing.
- **Required.** `disc_name` must be non-empty after trimming: the public list is
  built around it and a blank row cannot be recognised by its owner.
- **Lengths.** 200 characters for every field except `additional_info`, which
  gets 500 — the same limits the submission form enforces, imported from
  `toDiscDTO.ts` so the two cannot drift.
- **Course.** A course must be one of `getDiscCourseNames(APP_CLUB_ID)`, or none
  at all. A stray value would become an extra option in the list page's course
  filter, which is why the submission form checks it too.
- **A disc has one ending.** `is_returned_to_owner` and `can_be_sold_or_donated`
  may not both be ticked: a disc that went home was not also sold. The form
  refuses the pair with "Kiekko ei voi olla sekä palautettu että myytävissä tai
  lahjoitettavissa." Nothing in the schema enforces this and no earlier code
  did either — the rule is new with this form, on the grounds that the
  statistics page counts the two as separate endings and a disc in both columns
  is counted twice. The check lives only in `validateDiscEdit`.
- **A tick needs a date.** Ticking either box without a date is refused. Unticking
  clears that box's date and method in the same write, so a cleared disc carries
  no leftover "returned on" date.
- **A released disc goes on the retrieval list.** A save that leaves
  `can_be_sold_or_donated` ticked calls `queryRequestDisposalRetrievals`, which
  is what the list's disposal action does. It is called on every such save
  rather than only when the box has just been ticked, because a disc already on
  the list keeps its one open row — so the form needs no read of what the disc
  looked like before. The two writes are not one transaction: when the errand
  fails the disc is still saved, and the message says so rather than reporting
  a failed save.
- **The phone number is not format-checked.** Imported rows hold values like
  "050 123 4567 (äiti)" and "?040...", and a format rule would block an admin
  from saving the very row they came to fix. The field is trimmed and
  length-capped and nothing more.

## Edge cases & known gaps

- Unticking "Palautettu omistajalle" puts the disc back on the public list but
  does not reopen its row in `disc_retrievals`, nor create one. A disc returned
  by mistake and un-returned here is simply listed again, with no errand
  attached.
- Unticking "Myytävissä tai lahjoitettavissa" does not close the errand that
  ticking it opened. The disc comes back to the public list still on the
  retrieval list, where it now shows as an ordinary pending fetch. That is not
  obviously wrong — the disc is still on the shelf and somebody still has to go
  and get it — but nothing decided it deliberately, and the errand still reads
  "Myyntiin tai lahjoitukseen" for a disc that is no longer for sale.
- A row that already carries both `is_returned_to_owner` and
  `can_be_sold_or_donated` — which the schema permits, and which old sheet data
  or the sync could produce — cannot be saved here until the admin unticks one.
  The form is also the place to untick it, so the way out is at hand, but the
  message does not say so.
- The Google Sheets sync (spec 09) writes the same columns for a sheet-imported
  disc. A correction made here to a disc that still has an `internal_disc_id`
  can be overwritten by the next sync, which treats the sheet as the truth. The
  form does not warn about this, and there is no per-column "edited by hand"
  flag to make the sync skip it.
- There is no edit history: the previous value is gone. A save sets
  `updated_at`, which is the only trace — and this is the only disc write that
  maintains that column, so it means "last edited by hand here", not "last
  changed". A mis-edit is not recoverable from the app.
- Two admins editing one disc at the same time: the last save wins silently,
  with no version check.
- The page is reachable only from the public disc list, which shows listed discs
  only. A returned or released disc can be edited by typing its URL, but has no
  link pointing at it — so the un-return in scenario 6 needs a uuid in hand.

## Open questions

None.
