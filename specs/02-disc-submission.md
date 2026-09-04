# Disc submission (adding discs)

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
Lets a club admin empty a bin of found discs into the database by typing one
free-text line per disc — "Star Destroyer punainen 050 123 4567 Steve D." — with
a parser splitting that line into mould, plastic, colour, manufacturer, phone
number and owner. Replaces typing seven fields per disc, and replaces the Google
Sheet as the entry point for discs found by the club itself.

## Actors
- **Club admin** (signed in). `/discs/add` redirects to `/sign-in` otherwise, and `/discs/create` refuses with 401.

## User-facing behaviour
1. When the admin types a line into "Kiekon tiedot" (disc details) and presses Enter, `parseDiscText` runs and a row is appended to the draft table; the field clears for the next disc.
2. When the club records courses, a "Rata" radio row offers each course plus "Ei radan tietoa" (no course info); the choice applies to rows added **from then on**, never to what was typed. A "Aseta rata ... kaikille riveille" / "Poista rata kaikilta riveiltä" button retro-fits the whole draft.
3. When some rows lack a course, a quiet `role="status"` reminder counts them. It never blocks saving.
4. When the parser had to choose between two makers (`confidence.manufacturer === 'low'`), the Valmistaja cell is flagged with "?" and "Valmistaja on epävarma – tarkista.".
5. When a word could not be placed, it appears in the "Ohitettu" (skipped) column, so a typo is visible rather than silently lost.
6. When any cell is clicked, it becomes an input: Enter or blur commits, Esc cancels. Editing Valmistaja by hand raises its confidence to `high` and clears the flag.
7. When a row's delete icon is pressed, an inline "Poistetaanko?" yes/no replaces it. "Tyhjennä välimuisti" (clear cache) drops the whole draft, also behind a confirm.
8. When "Tallenna kiekot" (save discs) is pressed, the batch is POSTed to `/discs/create`; on success the page shows "Tallennettu. N kiekkoa lisättiin." and the draft — memory and localStorage — is cleared.
9. When the page is reloaded before saving, the draft comes back from localStorage.

## What the parser recognises, in order
`app/features/discs/submission/parser/parseDiscText.ts`:

1. **Note** — everything after the **first** `|` is `additionalInfo`, kept verbatim and never tokenized. A later `|` belongs to the note; a blank note is `null`.
2. **Phone number** — regex `(?:\+|\b0)[\d\s-]{5,}\d`, 7–15 digits, spaces/hyphens removed, leading `+` kept. Requiring a leading `0`/`+` keeps "Mako3" and a weight like "175" out. The match is blanked from the text before tokenizing.
3. **Segmentation** — longest-first n-gram lookup against the dictionary, so "Active Premium" beats "Active" and "Keltainen, musta halo" beats "Keltainen". `normalize` lowercases and drops `,`, `.` and `°`; hyphens and digits are kept ("S-Line", "DD3").
4. **Finnish genitive makers** — a span that does not match directly is retried through `resolveManufacturer`: suffixes `:n`, `in`, `n` stripped, then a first-word match ("Innovan", "Latitude 64:n", "Westsiden"). Irregulars ("Prodiscuksen", "Thought Spacen") live in `aliases.ts`.
5. **Unknown-disc phrase** — a "Tuntematon" marker grows outwards over adjacent manufacturer and disc-type words ("kiekko", "draiveri", "väylädraiveri", "midari", "putteri"); the whole phrase becomes the disc name verbatim and the maker inside it is still reported.
6. **Slot assignment** — unambiguous spans claim their slot first (`discName`, `plastic`, `colour`, `manufacturer`), then ambiguous ones take the first free slot in that order. This is what makes "Eclipse Wave" a plastic followed by a disc name.
7. **Manufacturer inference** — stated outright ⇒ `high` (and it wins even against a disagreeing disc name); disc name and plastic agreeing ⇒ `high`; several agreeing ⇒ `medium`; disagreeing ⇒ disc name wins at `low`; one signal only ⇒ `medium`, or `low` if that word names several makers; nothing ⇒ `none`.
8. **Leftovers** — remaining tokens starting with an uppercase letter become `ownerName` (joined by spaces); the rest go to `unmatched`. A lower-case name is missed rather than guessed at. This relies on the established convention that the owner name is never interleaved between disc-property words.

The dictionary (`dictionary.ts`) is built eagerly from `parser/data/*.json` (23
vendored manufacturer files: disc names + plastics), plus `discColors.ts`,
`vocabulary.ts` (the unknown marker and disc types) and `aliases.ts`. A term that
is both a disc name and a plastic keeps every candidate so ambiguity is reported,
not guessed. Data files stay a straight copy of upstream; additions go in
`aliases.ts`.

## Data
Rows are inserted into `public.discs` by `createDiscs` / `toInsertRows`
(`app/models/discs.server.ts`):

| Column | Value on a web-added disc |
|---|---|
| `external_id` | uuid generated in the app (not by the column default), so the caller learns the ids without a second round trip. |
| `internal_disc_id` | **NULL** — no Google Sheet row. `syncNewDiscs` uses `max(internal_disc_id)`, which ignores NULLs, so these cannot shadow the import. |
| `club_id` | `APP_CLUB_ID`, never from the request. |
| `disc_name` | `"<mould>, <plastic>"` (`toDiscName`) — the shape the sheet has always used, so the public list's name filter keeps working. |
| `disc_colour` | `''` when unparsed (not NULL). |
| `disc_manufacturer`, `owner_name`, `owner_phone_number`, `course`, `additional_info` | As parsed/edited; `undefined` keys are dropped before insert. |
| `added_at` | Today (`y-MM-dd`) unless the DTO carries one. |
| `is_returned_to_owner`, `can_be_sold_or_donated` | `false`. |
| `id`, `created_at`, `updated_at`, `owner_link_token` | Left to the database. |

Disc weight is deliberately not a field — it lands in the free-text note if
written at all.

Draft storage: `localStorage` key `lost-and-found:disc-draft:v1`, holding
`ParsedDisc & { id, input, course }` rows. A module-level array is the source of
truth, read through `useSyncExternalStore` (the server snapshot is always empty,
so a restore causes no hydration mismatch); localStorage is a best-effort mirror.

## Routes & entry points
| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/discs/add` (`app/routes/discs.add.tsx`) | GET | admin; redirects to `/sign-in` | Renders `AddDiscsPage`; loader supplies `getDiscCourseNames(APP_CLUB_ID)`. Linked from `AdminMenu` as "Lisää kiekkoja". |
| `/discs/create` (`app/routes/discs.create.tsx`) | POST JSON | admin (`requireAdminJson`) | Resource route (no default export) that validates and inserts the batch; answers `{ savedCount, externalIds }` or `{ error }`. |

`/discs/create` is a resource route rather than an action on `/discs/add`
because a plain `fetch` POST to a page route is a document request and would be
answered with rendered HTML.

## Rules & constraints
- Server-side validation in `parseBatch` (`toDiscDTO.ts`), which trusts nothing about the body:
  - body must be `{ discs: [...] }`, non-empty, at most `MAX_BATCH_SIZE = 100`.
  - each of the 8 known fields must be a string or nullish; blanks are trimmed to `null`.
  - length caps: 200 chars, except `additionalInfo` at 500.
  - `course` must be one of this club's `getDiscCourseNames`, or absent — a stray value would become a phantom option in the public list's course filter.
  - a row with neither disc name nor plastic is rejected ("kiekolla on oltava nimi tai muovi").
  - errors are Finnish, row-numbered, and returned as HTTP 422.
- `requireAdminJson` enforces POST-only (405), a live session (401) and a parseable JSON body (400).
- The client never sends a club id; `handleCreateRequest` reads `APP_CLUB_ID`.
- The course is never read out of the typed text — the radio selection is its only source, and the Rata cell is not editable.
- There is no autocomplete on the entry field; the dictionary is used for parsing only.
- `submitDiscs` never throws: a dropped connection or a non-JSON response comes back as an error result, and a 2xx without a numeric `savedCount` is treated as a failure.
- `draftStorage.toDraftRow` re-validates every restored field, because localStorage survives a deploy that changes the row shape and is writable by anything on the origin.

## Edge cases & known gaps
- A browser that blocks site data still works; it just loses the draft on refresh.
- A partially failed insert has no partial reporting — `createDiscs` inserts the batch in one statement and throws on error.
- `additionalInfo` is parsed as a note but there is no length check client-side; a >500-char note is only rejected by the server, after the admin has typed it.
- The parser has no confidence signal for anything but the manufacturer, and only `low` is surfaced (`medium` fires on about half of all entries, so showing it would be noise).
- An owner name written in lower case is dropped into `unmatched` rather than the owner field.
- A second disc name, plastic or colour in one line is discarded into `unmatched` (the slot is already taken).
- `disc_colour` is stored as `''` rather than NULL when no colour was recognised, unlike every other unparsed field.
- Nothing deduplicates: the same disc typed twice is inserted twice.

## Open questions
None recorded.
