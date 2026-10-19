# Phone number format

> Status: as-built (describes what exists today, not a wishlist)
>
> Writing rules — reader who does not know this codebase, every abbreviation
> explained on first use, plain words over jargon, as long as the subject needs.
> See `.claude/skills/specs/SKILL.md`.

## Purpose

An owner's phone number is how a lost disc gets home: it is what the club texts,
and the last four digits are how an owner recognises their disc on the public
list. Until now `discs.owner_phone_number` held whatever was written down —
"050 123 4567", "0501234567", " 2222", "" — because most of it was copied
from the clubs' old Google Sheets, and every form deliberately accepted anything
so that a messy row could still be saved.

That makes the number hard to search: "0501234567" does not match
"050 123 4567" as text. This feature stores every number in one form, checks the
form wherever a number is written, and leaves the spacing to the screen. It is
also the groundwork for the admin disc search ("Kaikki kiekot"), which searches
by phone number.

## Actors

- **Club admin** — the app's only admin user, and so the only person who adds
  discs or edits phone numbers: through the submission form, the edit page and
  the message composer's phone editor.
- **Maintainer** — runs the one-off cleanup script from a shell and applies the
  migration by hand.
- **Owners and anonymous visitors** — never write this column. An owner's
  answer goes to its own table, `disc_owner_responses` (spec 05), and the owner
  link page reads only the last four digits, through the database function
  `owner_link_disc()`, which strips everything but digits before taking them —
  so it gives the same four digits for "040 123 4567", "+358401234567" and
  "4567". The public list, likewise, still shows the last four digits.

## User-facing behaviour

1. When an admin types a phone number into any form that writes one, they may
   write it the way they read it: with spaces or dashes, in Finnish form
   ("050 111 2222") or international form ("+358 50 111 2222", "+46 70 111 2222",
   "0046 70 111 2222").
2. When the admin types exactly four digits, they are saved as they are. This is
   the anonymised form: once a disc has been returned, sold or donated, the
   admin cuts its number down to the last four digits by hand, because the full
   number is no longer needed (see "The anonymised form" below).
3. When a digit cannot be read off the disc — worn or faded — the admin types a
   "?" in its place, and it is kept: "050 111 ?222" is stored as
   "+35850111?222" and shown as "050 111 ?222". The digits that could be read
   are worth keeping, both to recognise the disc by and to search with.
4. When the number cannot be read as a phone number — letters, brackets, a
   number with neither a leading 0 nor a +, one whose first digit is a "?", too
   few digits — nothing is saved and the field says "Anna puhelinnumero
   muodossa 050 123 4567 tai +46 70 123 4567." (give the phone number in the
   form …).
5. When a number is shown anywhere, a Finnish one is shown in Finnish form,
   grouped for reading: "050 111 2222". A foreign one keeps its country code:
   "+46 701 112 222", "+372 560 333". An anonymised one is shown as "\*\*\*\*1234",
   the way the public list shows every number, so it does not read as a whole
   number.
6. When the edit page or the composer's phone editor opens, the field holds the
   number in the shown form, not the stored one, so the admin edits what they
   read. An anonymised number opens as its four digits.
7. When an admin types a full Finnish number into the front page's phone search
   ("0501112222"), it finds the disc even though the number is stored as
   "+358501112222" — and also one stored as "+35850111?222", since a "?" could
   be any digit. Typing only the last digits works as before.
8. When the composer's "Lähetä tekstiviesti" (send text message) link is tapped,
   the phone receives the number in international form, which also works when
   the admin's phone is abroad or on a foreign SIM.
9. When a number cannot be texted — it has a "?" in it, or is only the
   anonymised four digits — it is shown without a link on the retrieval list
   and the answer inbox, and on the message page "Lähetä tekstiviesti" is
   disabled, with "Tähän numeroon ei voi lähettää viestiä, koska siitä puuttuu
   numeroita." (no message can be sent to this number, because digits are
   missing from it) under the number. "Muokkaa puhelinnumeroa" (edit phone
   number) beside it is still there to complete the number — a text field
   rather than a phone keypad, since a keypad has no "?".

## Data

### The stored form

`discs.owner_phone_number` (text, nullable) holds one of three things:

- `NULL` — no number;
- a number in E.164 form — the international standard for writing a phone
  number as one string: a `+`, the country code, then the rest of the number,
  with no spaces and no leading 0 on the national part. Any digit but the first
  may be a `?`, for one that could not be read off the disc;
- exactly four digits — the anonymised form, below.

| Typed                         | Stored          |
| ----------------------------- | --------------- |
| `050 111 2222`, `050-1112222` | `+358501112222` |
| `+358 50 111 2222`            | `+358501112222` |
| `+358 050 111 2222`           | `+358501112222` |
| `0046 70 111 2222`            | `+46701112222`  |
| `+372 560 333`                | `+372560333`    |
| `050 111 ?222`                | `+35850111?222` |
| `1234`, ` 1234`               | `1234`          |
| empty, or only spaces         | `NULL`          |

### The anonymised form

When a disc has been returned to its owner, or released for sale or donation,
the admin has no further use for the owner's number, and has been cutting it
down to its last four digits by hand in the Google Sheets. 459 of the 462
four-digit values found (below) belong to such discs; the other three are on
discs still listed. The last four digits are
kept rather than the whole number deleted, because they are what an owner
matches their disc by.

The form is allowed, not enforced: nothing checks that a four-digit number
belongs to a closed disc, and nothing cuts a number down automatically. With a
single admin, that discipline is theirs to keep. Automatic anonymisation on
closing a disc is out of scope for now.

### The constraint

After the cleanup (below), a database check constraint holds every row to the
three forms:

```sql
ALTER TABLE public.discs
  ADD CONSTRAINT discs_owner_phone_number_format
  CHECK (owner_phone_number ~ '^(\+[1-9][0-9?]{6,14}|[0-9]{4})$');
```

A check constraint is a rule PostgreSQL applies to every insert and update,
refusing the write if the rule fails. It is what makes "every stored number is
in this form" true rather than hoped for: a writer that forgets to normalise —
including the disabled Sheets sync, should it ever be switched back on — gets an
error instead of quietly storing a messy value. `NULL` passes, because a check
on `NULL` is not false.

Migration file: `supabase/migrations/20261019000000_discs_owner_phone_number_format.sql`.
It is applied by hand, and only **after** the cleanup script reports nothing
left to fix; applied earlier, it fails on the first messy row.

No other table changes. `owner_phone_number` is the only column this feature
owns; phone numbers elsewhere (a finder's number on a found-disc notification,
spec 07) are not touched.

### What the data held before the cleanup

Measured on 2026-10-19 across both clubs' 3,443 discs, read-only:

| Group                                      | Puskasoturit (club 1) | Talin Tallaajat (club 2) | Total |
| ------------------------------------------ | --------------------- | ------------------------ | ----- |
| Converts cleanly under the rule below      | 1,155                 | 1,036                    | 2,191 |
| Four digits only (80 with a leading space) | 229                   | 233                      | 462   |
| Empty string                               | 312                   | 275                      | 587   |
| `NULL`                                     | 167                   | 27                       | 194   |
| Cannot convert                             | 7                     | 2                        | 9     |

- The two clubs' clean numbers differ only in spacing, because the admin wrote
  Puskasoturit's without spaces ("0401234567", 1,122 rows) and Talin
  Tallaajat's grouped ("040 123 4567", 886 rows).
- Every anomaly came from the sheets. All 304 web-added discs held a clean
  number or `NULL`: the submission parser already writes good values.
- 22 numbers had a "?" in place of a digit that could not be read off the
  disc. 20 of them convert with the "?" kept; the other two begin with "?", so
  their country cannot be known.
- The 9 that cannot convert: those two, two written US-style
  ("(999)999-9999"), two Estonian mobile numbers without their +372 (eight
  digits starting with 5), and three fragments.
- No number started with 07, so the Swedish-prefix check below had nothing to
  catch in the existing data.
- No number carried a note in words, such as a relation or a name.
- 26 domestic numbers have 11 digits; 19 of them start 0457, a real 11-digit
  Finnish prefix. The old `formatPhoneNumber` comment calling an eleventh digit
  "one too many written down" was wrong; the grouping it gave them was right
  and is kept.
- Five domestic numbers have 9 digits, the length of some older Finnish numbers.
- 11 numbers were already international: Estonia 5, Sweden 3, Latvia, Germany
  and Spain one each.

### Why `+358`, not `0`

Storing the Finnish domestic form would be shorter, but a domestic number only
means something once you know which country it is domestic to. Storing the
country code means a Swedish number entered as "+46 70 111 2222" and a Finnish
"050 111 2222" can sit in the same column without either being ambiguous, and an
`sms:` link works from any phone. The domestic form comes back on screen, where
it is easier to read.

## Routes & entry points

No new routes. The rule lives in one file, and every writer calls it:

| File                                                                     | Role                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/phoneNumber.ts`                                                     | `normalisePhoneNumber` (typed text → stored form, or a refusal), `formatPhoneNumber` (stored form → shown form), `toEditablePhoneNumber` (what a phone field opens with), `phoneSearchDigits` and `phoneNumberEndsWith` (the search). Tested in `app/phoneNumber.test.ts`. |
| `app/features/discs/submission/toDiscDTO.ts` (`parseBatch`)              | Disc submission (spec 02): normalises each row's number on the server.                                                                                                                                                                                                     |
| `app/features/discs/edit/discEdit.ts`                                    | Edit page (spec 14).                                                                                                                                                                                                                                                       |
| `app/features/messaging/ownerPhoneNumber.ts`                             | The composer's phone editor (spec 06).                                                                                                                                                                                                                                     |
| `app/import/puskasoturitDiscFields.ts`                                   | The Puskasoturit import script (spec 09): `toDiscRow` normalises, `hasStorablePhoneNumber` is what the script skips on.                                                                                                                                                    |
| `app/features/discs/list/DiscListPage.tsx`                               | The front page's phone search (spec 01), through `phoneNumberEndsWith`.                                                                                                                                                                                                    |
| `app/features/discs/submission/parser/phoneNumber.ts`                    | The disc-entry parser's number pattern, which allows `?` (spec 02).                                                                                                                                                                                                        |
| `app/ui/ContactLine.tsx`, `app/features/messaging/MessageComposer.tsx`   | No `sms:` link, or a disabled send button, for a number `isTextable` turns down.                                                                                                                                                                                           |
| `scripts/normalisePhoneNumbers.ts` (`npm run normalise:phones`)          | The one-off cleanup of existing rows.                                                                                                                                                                                                                                      |
| `supabase/migrations/20261019000000_discs_owner_phone_number_format.sql` | The check constraint.                                                                                                                                                                                                                                                      |

`formatPhoneNumber` lives here too, beside the rule it shows the result of; its
three callers are `app/ui/ContactLine.tsx`, `DiscTable.tsx` and
`MessageComposer.tsx`. `toDiallablePhoneNumber`, which strips spaces for an
`sms:` link, stays in `app/utils.ts`; on a stored number it changes nothing.

`app/phoneNumber.ts` sits at the top level of `app/`, beside `discFieldLimits.ts`,
because two slices (discs and messaging), the shared `ContactLine`, the sheet
import and two maintenance scripts read it, and no one of them owns it. It has
**no imports at all**: the maintenance scripts run on plain Node, which cannot
resolve the `~/` path alias, so anything a script imports must not depend on it.
For the same reason `puskasoturitDiscFields.ts` imports it as
`'../phoneNumber.ts'`, relative and with its extension.

## Rules & constraints

### Reading a typed number — `normalisePhoneNumber`

In order:

1. Trim. If nothing is left, the result is `NULL` (where the field may be empty
   — see the writers below).
2. Exactly four digits are the anonymised form, kept as they are. This comes
   before the rules below, so "0123" is a four-digit tail and not a Finnish
   number missing its digits.
3. Remove spaces and dashes.
4. If anything other than digits, `?` and one leading `+` remains, refuse. A
   `?` counts as a digit from here on, in every rule and every length.
5. A leading `00` is the international dialling prefix: replace it with `+`.
6. A leading `0` is a Finnish domestic number: replace it with `+358`.
7. A number starting with any other digit is refused: it is either a fragment or
   is missing its country code, and guessing which is how wrong numbers get
   texted.
8. `+3580…` drops that 0 — "+358 050 …" is a common slip, and a Finnish national
   number never starts with 0 after the country code.
9. The digits after the `+` must not start with 0 or `?` and must number 7 to 15. 15 is
   the E.164 maximum; 7 is the lower bound the submission parser already uses.
   A Finnish number must also have at least 6 digits after `+358` — the same 7
   as typed domestically, its 0 included — otherwise the fragment "050 111"
   would pass as the eight digits of "+35850111", and so would "+358 050 111".

Every refusal carries the same Finnish message, "Anna puhelinnumero muodossa
050 123 4567 tai +46 70 123 4567.", because the admin needs the shape, not a
reason code.

**A number starting with 0 is always taken as Finnish.** Nearly every owner is,
but not all: "070 111 2222" is far more likely a Swedish mobile number written
in Swedish domestic form — 070, 072, 073, 076 and 079 are Swedish mobile
prefixes, and 07 is not a Finnish mobile prefix — and it is stored as
"+358701112222", which is wrong. The form cannot tell; the admin has to type
"+46 70 111 2222". The cleanup report lists every such number for review
(below); on 2026-10-19 there were none.

### The writers

| Writer                         | Empty allowed?                            | On refusal                                                                         |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| Disc submission (`parseBatch`) | yes → `NULL`                              | 422 with the row number, like the batch's other row errors                         |
| Edit page                      | yes → `NULL`                              | the message under the phone field; nothing saved                                   |
| Composer's phone editor        | no — "Puhelinnumero on pakollinen." stays | 422 with the message                                                               |
| Puskasoturit import script     | yes → `NULL`                              | the row is reported and skipped, as the script already does for an unreadable date |

The 200-character cap in `app/discFieldLimits.ts` still applies to the raw input,
before normalising, so an absurd paste is refused before any parsing runs.

The submission parser (spec 02) still finds the number in the free-text line as
it always has; `parseBatch` normalises what it found, on the server, because the
client is not trusted. The preview table shows the number as the parser found
it ("0501112222"), like every other cell, not in the shown form.

The composer's phone editor decides whether the number changed by normalising
what is in the field and comparing it with the stored number: reopening
"+358501112222" as "050 111 2222" and saving it unchanged must not post,
because a post bumps `updated_at` — "edited by hand" (spec 14). A stored value
in no stored form never matches, so saving one unchanged does post, and stores
it normalised. The edit page always saves the whole form.

### Showing a number — `formatPhoneNumber`

- `+358…` is shown in Finnish form: `0` and the national part. A 10- or
  11-digit result is grouped as the 0 and two digits, then the middle, then the
  last four ("050 111 2222", "050 1111 2222"). Other lengths are shown
  ungrouped, because every grouping of those would be invented.
- Any other `+…` is shown as `+<country code> ` followed by the rest in groups
  of three from the left, a final lone digit joining the group before it:
  "+46 701 112 222", "+372 560 333". The country code's length comes from the
  E.164 assignment, which is prefix-free (no code is the start of another):
  codes starting with 1 or 7 are one digit, a fixed list of codes are two digits
  (among them 46 Sweden, 47 Norway, 45 Denmark, 49 Germany), and all others are
  three (358 Finland, 372 Estonia).
- A `?` is grouped like any digit: "+35850111?222" is "050 111 ?222".
- Four digits are shown as "\*\*\*\*1234".
- A value in none of the stored forms — only possible before the cleanup has
  run — is shown exactly as stored.

### Texting a number — `isTextable`

True for a number in E.164 form with no `?` in it, false for anything else: a
number with a digit missing, the anonymised tail, no number. `ContactLine`
(`app/ui/ContactLine.tsx` — the retrieval list and the answer inbox) shows an
untextable number as plain text instead of an `sms:` link, and
`MessageComposer.tsx` disables "Lähetä tekstiviesti" for one, with the note
above. A disc with no number at all keeps the button: it opens the phone's own
message window without a recipient, as it always has. A value in none of the
stored forms — only possible before the cleanup has run — is untextable too, so
the cleanup has to run before this code is deployed (see the order below) or
those numbers lose their links.

### Searching — `phoneSearchDigits`

The typed text reduced to digits, with the same leading-0 and leading-00 rules
as above minus the country code: "050 111 2222" → "501112222",
"+358 50 111 2222" → "358501112222", "0046 70…" → "4670…". Four digits or
fewer are a tail and kept whole, so "0123" still finds a number ending 0123.
The front page keeps rows whose stored number, without its `+`, **ends with**
those digits (`phoneNumberEndsWith`), a `?` in the stored number matching any
digit. A `?` typed into the search is ignored like any other non-digit. For an
anonymous visitor, who receives only the last four digits, this is the same as
before. An anonymised number is
found by its four digits, not by the whole number it was cut from.

### The cleanup — `scripts/normalisePhoneNumbers.ts`

A one-off command-line script in the style of `scripts/archiveStaleDiscs.ts`,
over **every** club's discs (the check constraint covers the whole table).

```
npm run normalise:phones -- --dry-run
npm run normalise:phones -- --dry-run --verbose
npm run normalise:phones
npm run normalise:phones -- --restore=backups/phone-numbers-<time>.json
```

It runs `normalisePhoneNumber` over each stored value and sorts the rows into:

| Group            | Meaning                                                | What happens                                                   |
| ---------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| already stored   | Already in a stored form, or `NULL`.                   | Nothing.                                                       |
| blank            | Empty or only spaces.                                  | Set to `NULL`.                                                 |
| converted        | Read cleanly, including a four-digit tail to trim.     | Set to the stored form. `--verbose` prints each: old → new.    |
| converted, check | Read cleanly, but as a Finnish number starting `07`.   | Converted as above, and listed again separately for review.    |
| cannot convert   | Refused by the rule: fragments, brackets, a "?" first. | **Left untouched.** Listed with club, disc name and edit link. |

The dry run on 2026-10-19 gave 583 already stored (194 `NULL`, 7 international,
382 four-digit), 587 blank, 2,264 converted (2,184 numbers, 20 of them with a
"?", and 80 four-digit tails with a leading space), none to check and 9 that
cannot convert.

`--dry-run` prints the report and writes nothing. A real run first writes a
backup file — each changed row's `external_id` (the uuid every disc carries,
and the one the edit page is addressed by), old value and new value, as
JSON, to a path it prints, in the git-ignored `backups/` directory — then
updates the rows one by one, ten at a time, since every row gets its own value.
It stops after the batch of ten in which a write is first refused, reporting
how many writes landed, the rest of that batch included; a write that reaches
no row (row level security filters rather than raises) counts as refused. `--restore=<file>`
writes the old values back. The backup is the undo: local
development runs against the production database, so there is no copy to fall
back on otherwise. The script sets only `owner_phone_number`; `updated_at` is
left alone, because it means "last edited by hand".

The "cannot convert" rows are listed with their club and edit path, and are
fixed by hand on the edit page — in the deployment for that disc's club, since
the edit page only reaches discs of `APP_CLUB_ID`, the environment variable
naming the one club a deployment serves. The page refuses the messy
value: the admin types the number in full where they can read it, cuts it to
its last four digits where those are legible and the disc is closed, or clears
it. The script is rerun until that group is empty, and only
then is the constraint migration applied.

### Order of the cleanup

The constraint can only go on once no messy value is left, and the code that
writes the stored form has to be in place for the fixes to stick. So, before
the code is deployed:

1. Run `normalise:phones -- --dry-run` and read the report.
2. Fix the "cannot convert" rows and any wrongly-Finnish `07` rows by hand,
   using the branch's edit page locally (it writes to the production database),
   once with `APP_CLUB_ID=1` and once with `APP_CLUB_ID=2`.
3. Run `normalise:phones` for real. Rerun the dry run: only "already stored"
   should remain.
4. Apply the constraint migration by hand.
5. Deploy. Between steps 4 and 5 the deployed code still writes numbers as
   typed, so a number saved in production in that window is refused by the
   database. With one admin, the window is as long as the admin makes it.

## Edge cases & known gaps

- A Swedish (or other) number written in its own domestic form with a leading 0
  is stored as Finnish, and is then shown back exactly as it was typed, so
  nothing on screen gives the mistake away. Only the cleanup report checks for
  it, and only for existing rows starting `07`.
- The submission parser (spec 02) finds numbers starting with 0 or + only, now
  with `?` allowed among the digits. A number it misses lands in the skipped
  words, as before; a sentence-ending "?" right after a number would be read
  as part of it.
- The owner link page (spec 05) shows the owner the last four _digits_ of the
  number, worked out in the database by `owner_link_disc()`, which strips
  everything but digits. A `?` among the last four is stripped too, so the page
  shows the wrong four: "050 111 22?2" appears as "1222". It did the same
  before this change for the sheet rows that already held a "?"; fixing it is a
  change to that function, not made here. The public list, which cuts the
  stored value itself, shows "\*\*\*\*22?2" correctly.
- "Valitse uusimmat" and a batch selection still include a disc whose number
  cannot be texted; each one's message page then shows the disabled button,
  rather than the disc being left out of the batch.
- A number of nothing but "?" after its first digit ("0??????") is accepted. It
  is shape, not sense; it cannot be texted, and the admin is the only writer.
- The disabled Sheets sync (`app/models/syncDiscs.server.ts`, spec 09) is not
  changed. If it were switched back on, the constraint would refuse its messy
  inserts — loudly, which is the intent — but it would not import them.
- Grouping a foreign number in threes is a readable default, not that country's
  own convention (Sweden writes "070-111 22 22").
- The 7-digit minimum lets through some numbers too short to be real in their
  country. The rule checks shape, not existence.
- Nothing stops a four-digit number on a disc still listed (three exist), or a
  full number on a closed one. Anonymising is the admin's own rule, not the
  app's.

## Open questions

- Should closing a disc (returning, selling, donating) cut its number down to
  four digits automatically? Deferred: the admin does it by hand for now.
