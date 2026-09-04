# Batch operations

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
An admin clearing out the club's disc bin marks a dozen discs the same way at once
instead of opening a form per row. Discs are ticked in the disc list, one action is
picked from a dropdown above the table, and it is applied to the whole selection in a
single request.

## Actors
- **Club admin** (signed in). The select column and the external ids the selection is
  keyed on are only sent to a signed-in visitor.

## User-facing behaviour
1. When an admin is signed in, the disc table grows a leading checkbox column
   (`app/features/discs/list/DiscTable.tsx`); ticking rows reveals the action bar
   `SelectedDiscsActions.tsx`, which reads "N kiekkoa valittu" (N discs selected).
2. When rows are ticked, the header cell becomes a single checked box,
   "Poista kaikkien kiekkojen valinta" (clear all selection). There is deliberately **no
   select-all**.
3. When the admin picks an action and presses "Suorita" (run), `window.confirm` states
   what will happen and to how many — e.g. "Poistetaanko 12 kiekkoa? Poistoa ei voi
   peruuttaa."
4. When the write returns, the bar reports it — "Poistettiin 12 kiekkoa." — the ticks
   clear and the list reloads. The report survives one more render with an empty
   selection so it does not vanish with the ticks.
5. When fewer discs were reached than asked for, the report names the shortfall:
   "Poistettiin 10 kiekkoa. 2 kiekkoa jäi käsittelemättä – kiekkoja ei löytynyt tai niitä
   ei voitu muuttaa."
6. When more than 20 discs are ticked, the write actions leave the dropdown and a note
   explains why: "Merkintä ja poisto koskevat enintään 20 kiekkoa kerralla – valitse
   pienempi joukko." The selection itself is not capped.
7. When some ticked discs have no phone number, "Lähetä sms N henkilölle" (send SMS to N
   people) counts only those that do, and a note says how many fall outside the message.

## The five batch actions
`app/features/discs/batch/batchAction.ts` holds one row per action — label, confirm
wording, past-tense wording, and what it writes — so the three tenses cannot drift apart
and the smallint mapping is declared once.

| Action | Dropdown label | Writes |
|---|---|---|
| `returnByMail` | "Merkitse palautetuiksi (postitettu)" | return columns, `ReturnMethod.ByMail` |
| `returnPickedUp` | "Merkitse palautetuiksi (noudettu)" | return columns, `ReturnMethod.PickedUp` |
| `sell` | "Merkitse myytäviksi" | disposal columns, `DisposalMethod.Sold` |
| `donate` | "Merkitse lahjoitettaviksi" | disposal columns, `DisposalMethod.Donated` |
| `delete` | "Poista" | nothing — hard delete, and the only action needing no date |

Dropdown order is `['message', returnByMail, returnPickedUp, sell, donate, delete]`.

**`message` is not a batch action.** It is a sixth dropdown entry that navigates to
`/message/send-batch?ids=…` — a walk through the owners one at a time. `isBatchAction`
rejects it, along with the pre-method names `'return'` and `'disposal'`.

Neither batch mark asks for a method in a second step: the action name already carries it.
The single-disc forms still ask, because there the method may be left unanswered.

## Data
No tables of its own. It writes exactly the columns the single-disc marks write, through
the shared `returnPatch` / `disposalPatch` helpers in `app/models/discs.server.ts`:
`is_returned_to_owner` + date + `return_method`, or `can_be_sold_or_donated` + date +
`can_be_sold_or_donated_method`. `deleteDiscs` is a hard delete.

## Routes & entry points

| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/discs/batch` | POST JSON | admin | `{action, externalIds[], date?}` → `{affected: number}` |

Client: `runBatchAction.ts` posts it; `useBatchAction.ts` owns the confirm → request →
report state machine; `SelectedDiscsActions.tsx` renders the bar.

## Rules & constraints
- `requireAdminJson` first: POST only (405), signed in (401), parseable JSON (400).
- `action` must be one of the five (`isBatchAction`) else 422 "Tuntematon toimenpide."
- `externalIds` must be a non-empty array of valid uuids (`isExternalId` on every element)
  else 422 "Virheellinen kiekkojen tunnistelista."
- The array is **deduplicated** (`new Set`) before the size check and before the write, so
  the reported count stands for discs, not for repeated ids.
- `MAX_DISCS_PER_WRITE = 20`, checked *after* dedup: 422 "Yhdellä kertaa voi käsitellä
  enintään 20 kiekkoa." Enforced twice — the dropdown withholds the actions, and the route
  refuses regardless, since the list is not the only thing that can post.
- The cap is on the write, not on the selection or on messaging, which writes nothing.
- `date` is required for the four marks (`isIsoDate`, so `2026-02-30` is rejected), and is
  omitted for `delete`. It is today's date taken from the **browser**, because the server
  runs in UTC.
- Messaging has its own separate bound: the ids ride in the query string, and
  `MAX_HREF_LENGTH = 6000` guards against a 431 before app code runs. With the 20-disc cap
  this is a backstop.
- Every model call is scoped to `APP_CLUB_ID` (`.eq('club_id', clubId)`), so an id from
  another club is simply not among the rows affected.
- `runBatchAction` treats a 200 without a numeric `affected` as an error: the route reports
  a count on every success path.
- `handleRun` re-checks that the chosen action is still in the dropdown — one more tick can
  push the selection past the cap between choosing and pressing.

## Partial failure
There is none in the transactional sense. Each action is a single Supabase statement
(`.update(...).in('external_id', ids)` or `.delete().in(...)`), so it either raises — 500,
nothing reported as done — or succeeds and returns the rows it touched.

`updateDiscs` / `deleteDiscs` return `data?.length ?? 0`. A shortfall means some ids did
not resolve (unknown, another club's, already deleted) **or** RLS filtered the update out;
the batch path deliberately does not tell those apart, unlike the single-disc `updateDisc`
which re-selects to distinguish `not-found` from `not-permitted`. `batchActionOutcome`
reports the shortfall without calling it an error.

## Edge cases & known gaps
- A shortfall is unattributed: the admin is told two discs were missed, never which two.
- No batch course change and no batch retrieval-list action — those are single-disc only.
- Rows without an `externalId` (anonymous loader payload) cannot be selected
  (`enableRowSelection`), and `getRowId` falls back to `row-<id>` for them.
- The dedup means posting the same id 25 times is accepted, not rejected as oversized.
- `batchAction.test.ts` pins the smallint mapping against the *labels* rather than the
  numbers, because nothing in the UI shows the stored number — an inverted sell/donate or
  posted/collected mapping would otherwise be invisible. It also asserts that `delete` is
  the only action with no mark.
- Nothing tests `handleBatchRequest.server.ts` itself; the validation branches (dedup, cap,
  missing date) are covered only by reading.
- The confirmation names no discs — the selection is behind the dialog on screen.

## Open questions
None.
