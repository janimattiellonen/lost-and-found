# Admin disc search

> Status: as-built (describes what exists today, not a wishlist)

## Purpose

The front page (spec 01) lists only the discs the club still holds: a disc that
has been returned to its owner, released for sale or donation, or archived drops
off it for good. Now and then an admin needs one of those closed cases back — an
owner calls about a disc that was posted to them months ago, or a disc was marked
returned by mistake. Until now the only way to find it was the database itself.

"Kaikki kiekot" (all discs) is an admin-only search page over **every** disc of
the club, whatever its status. It shows nothing until the admin searches, so it
is a lookup tool rather than a second list.

## Actors

Club admin — a signed-in user. An anonymous visitor never reaches the page: the
loader sends them to `/sign-in` before anything is read, and the menu link is not
shown to them.

## User-facing behaviour

1. When a signed-in admin opens "Kaikki kiekot" from the menu, the page shows a
   heading and two search fields — and no results, and no "nothing found"
   message either, because nothing has been searched yet.
2. The fields are "Puhelinnumero" (phone number) and "Kiekko" (disc). Either may
   be left empty. There is no search button: the page searches as the admin
   types.
3. When the admin stops typing for 300 ms, the page searches with what the
   fields hold, and lists every disc of the club that matches, whether it is
   still held, returned, released or archived. A keypress inside those 300 ms
   restarts the wait, so typing a whole number costs one request, not one per
   digit. Pressing Enter searches at once without waiting.
4. A field takes part in the search only once it holds enough to search with:
   - "Kiekko" — at least **2 characters**, after trimming spaces from both ends;
   - "Puhelinnumero" — at least **3 digits**. Only digits count, so "05-" is
     two and not enough.

   A field below its minimum is left out, as if it were empty.

5. When both fields are left out — empty, or below their minimums — the
   address loses its search, nothing is read from the database, and the page is
   as in scenario 1. Results from an earlier search are cleared rather than left
   standing under fields that no longer describe them. An empty search never
   means "show everything".
6. When both fields take part, a disc must match both.
7. The page searches only when the search would differ from the one already on
   screen. Typing a space or a dash into the phone field, or a first character
   into an empty disc field while a phone search is showing, changes nothing
   the search uses, so nothing is fetched.
8. **Phone matching** finds a number by its **end**, the same way the front
   page's phone search does (spec 01). Typed "050-111 2222", "0501112222",
   "+358 50 111 2222", "1112222" and "2222" all find a disc whose number is
   "+358501112222". Digits from the middle of a number, such as "50111", find
   nothing. A "?" in a stored number stands for a digit nobody could read off the
   disc, so it matches any typed digit: "0501112222" also finds "+35850111?222".
9. **A closed disc's four-digit tail is found by the whole number too.** Once a
   disc has been returned, sold or donated, the admin may have cut its number
   down to its last four digits ("2222", spec 16). When the admin types a whole
   number, "050 111 2222", the search also lists every disc stored as just
   "2222", because that may be the same owner's number. This is the case the page
   exists for: an owner calls about a disc returned months ago, and the admin
   has only the caller's number to go on. A whole number is one the app would
   store as a number (spec 16's `normalisePhoneNumber`): a leading "0" or "+"
   and at least seven digits. A number still being typed — "050111" — is not
   one, so a pause halfway through does not list every disc stored as "0111".
10. **Disc matching** is case-insensitive and finds the typed text anywhere in the
    disc name, so "destroyer" finds "Destroyer, Star".
11. When something is found, the results are a table, newest `added_at` first,
    with one row per disc: "Lisätty" (added), "Kiekko" (disc name), "Väri"
    (colour), "Omistaja" (owner), "Puhelin" (phone), "Rata" (course — only for
    a club that records courses), "Tila" (status) and an edit link. The phone
    number is shown in full, the way every admin page shows one (spec 16):
    "050 111 2222", a foreign one with its country code, and a four-digit tail
    as "\*\*\*\*2222" so it does not pass for a whole number.
12. "Tila" lists every mark the disc carries, one per line, each followed by its
    date when one is recorded — "Palautettu omistajalle (Postitettu) 2.10.2026":
    - "Palautettu omistajalle" (returned to its owner), with the return method
      label in parentheses ("Postitettu" — posted, or "Noudettu" — picked up)
      when one is recorded;
    - the disposal method label — "Myydään" (to be sold) or "Lahjoitetaan" (to
      be donated) — or "Myytävissä tai lahjoitettavissa" (available to be sold
      or donated) when no method is recorded;
    - "Arkistoitu" (archived).

    A disc with none of these marks shows "Listalla" (on the list): it is one
    the front page shows too.

13. "Muokkaa" (edit), the last cell of each row, opens the disc's edit page
    (`/discs/:externalId/edit`, spec 14), where a returned or released mark can
    be undone. The link carries the current search as `returnTo` (for example
    `/discs/…/edit?returnTo=%2Fadmin%2Fdiscs%3Fphone%3D0501234567`), so the
    edit page's "Peru" (cancel) comes back to these results.
14. When the search finds nothing, the page says "Hakuehdoilla ei löytynyt
    kiekkoja." (no discs matched the search).
15. When the search finds more than 100 discs, the page shows the newest 100 and
    says "Näytetään 100 uusinta. Tarkenna hakua." (showing the newest 100 —
    narrow the search).
16. While a search is loading, the previous results stay on screen at 50%
    opacity with `aria-busy` (as on the front page, spec 01), and the fields stay
    editable. A newer search replaces one still in flight, so the table never
    ends up showing the answer to an older query.
17. The search lives in the address bar (`/admin/discs?phone=…&disc=…`), with
    only the fields that take part in the search. The phone number is put there
    in the search's own form — its digits, with a "+" kept if one was typed — so
    "050 111 2222" and "050-1112222" are one address. Each search _replaces_ the
    current history entry instead of adding one, so the back button leaves the
    page rather than stepping back through every pause in typing. Coming back
    from the edit page, with "Peru" or the back button, returns to the last
    search; a reload repeats it; and the fields come back filled in with what was
    searched, the phone number as its digits ("0501112222").
18. When the address changes while the page is open without the page asking —
    the "Kaikki kiekot" menu link, or the browser's back and forward buttons —
    the fields follow the address, and a search still waiting for typing to
    pause is dropped.

## Data

Reads `public.discs`, scoped to `club_id = APP_CLUB_ID` (the environment variable
naming the one club this deployment serves, spec 12). Nothing on this page
writes.

| Column                                                                                   | Used for                                                      |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `external_id`                                                                            | The edit link. Every disc has one (uuid, NOT NULL, unique).   |
| `disc_name`                                                                              | Shown; the disc search matches against it.                    |
| `disc_colour`, `owner_name`, `owner_phone_number`, `added_at`, `course`                  | Shown. The phone search matches against `owner_phone_number`. |
| `is_returned_to_owner`, `returned_to_owner_date`, `return_method`                        | The "Palautettu omistajalle" status.                          |
| `can_be_sold_or_donated`, `can_be_sold_or_donated_date`, `can_be_sold_or_donated_method` | The sale/donation status.                                     |
| `archived_at`                                                                            | The "Arkistoitu" status.                                      |

No migration. Since spec 16, `owner_phone_number` holds one of three things,
held to them by a check constraint in the database: `NULL`, a number in E.164
form (the international standard: "+", the country code, then the digits —
"+358501112222", with a "?" for a digit that could not be read), or a four-digit
tail ("2222"). The stored value is therefore already the digits, so the search
matches against the column itself. A separate digits-only column would only be
needed if numbers could hold spaces or notes such as "(äiti)" (mother), which the
constraint no longer allows.

### How the phone search becomes a query

The typed number is read by `phoneSearchDigits` (`app/phoneNumber.ts`, spec 16),
the same function the front page's search uses: spaces, dashes and other
non-digits go, and from five digits up a leading "0" or "00" is dropped, so
"050 111 2222" becomes "501112222". Four digits or fewer are kept whole, as a
tail.

Those digits become one regular expression, matched in the database with
PostgreSQL's `~` operator — through supabase-js's `regexMatch`, which PostgREST
(the REST layer Supabase puts in front of PostgreSQL) passes on as its `match`
filter:

| Typed          | Digits      | Pattern                                          |
| -------------- | ----------- | ------------------------------------------------ |
| "2222"         | `2222`      | `([2?][2?][2?][2?])$`                            |
| "050 111 2222" | `501112222` | `([5?][0?][1?][1?][1?][2?][2?][2?][2?]\|^2222)$` |

- `[d?]$` for each digit, in order and anchored at the end, is "ends with these
  digits, a stored '?' standing for any one of them" — the rule
  `phoneNumberEndsWith` applies on the front page.
- `^dddd$`, the last four typed digits and nothing else, is the closed disc's
  tail (scenario 9). It is added only when the search is a whole number, one
  `normalisePhoneNumber` would store; with four digits or fewer, the first half
  already finds a stored tail.

Only digits ever reach the pattern, so nothing a user types can change its
meaning and nothing needs escaping. Building it is `phoneSearchPattern`, a pure
function in `app/phoneNumber.ts` beside `phoneNumberEndsWith` — the file every
reader and writer of the column takes its rules from (spec 16) — and the two
are tested with the same cases so the two pages cannot drift apart.

No index: a pattern anchored at the end cannot use an ordinary index, and a
club's table is a few thousand rows, which a sequential scan reads in well
under the time the page takes to render.

## Routes & entry points

| Route                                         | Method(s) | Auth                                 | Purpose                                                                         |
| --------------------------------------------- | --------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| `/admin/discs` (`app/routes/admin.discs.tsx`) | GET       | admin, checked in the feature module | The search form; with `phone` and/or `disc` query parameters, also the results. |

There is no action and no resource route, because nothing is written: a search
is a navigation to the same page with new query parameters
(`navigate({ search }, { replace: true })`), and React Router runs the loader
again and cancels the previous one if it has not finished. The fields sit in a
plain `<form method="get" role="search">`: the page handles Enter itself, and
without JavaScript the browser submits the two fields to the same address, which
the loader reads by the same rules. The form carries a visually hidden "Hae"
(search) submit button, kept out of the Tab order: a browser submits a form on
Enter only when it has a submit button or a single text field, and this one has
two fields, so without the button Enter would do nothing at all.

Code, in the discs slice:

| File                                                     | What it does                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/features/discs/search/discSearch.ts`                | Turns field values or query parameters into a search, or "no search" (`readDiscSearch`); the search into a query string (`toSearchParams`); and the disc name into its `ILIKE` (PostgreSQL's case-insensitive pattern match) pattern (`discNamePattern`). Pure; tested. Used by both the page and the loader. |
| `app/features/discs/search/discStatus.ts`                | Builds the "Tila" lines from a disc's marks. Pure; tested.                                                                                                                                                                                                                                                    |
| `app/features/discs/search/queryDiscSearch.server.ts`    | The one `SELECT`.                                                                                                                                                                                                                                                                                             |
| `app/features/discs/search/loadDiscSearchPage.server.ts` | The sign-in check, then the search read from the address, then the query, capped at 100.                                                                                                                                                                                                                      |
| `app/features/discs/search/DiscSearchPage.tsx`           | The form, the 300 ms wait, and the results table.                                                                                                                                                                                                                                                             |

The menu link is in `app/ui/AdminMenu.tsx` (spec 13). The edit links are built
by `editDiscPath`, and the edit page's `returnTo` is spec 14's.

## Rules & constraints

- **Signed in, checked in the loader.** `loadDiscSearchPage` calls
  `isUserLoggedIn(request)` first and throws `redirect('/sign-in')` before any
  query runs, because the results carry owners' full phone numbers. The hidden
  menu link is not the protection (spec 13).
- **Club scoping** is from `APP_CLUB_ID`, never from the request.
- **No status filter at all.** The query has no condition on
  `is_returned_to_owner`, `can_be_sold_or_donated` or `archived_at`; ignoring
  status is the point of the page.
- **Debounce: 300 ms**, the same wait as the front page's phone filter (spec 01).
  Enter skips the wait.
- **Minimums: 2 characters for the disc, 3 digits for the phone**, named as
  constants in `discSearch.ts`. They are enforced twice, by the same function:
  in the page, to decide whether to search at all, and in the loader, so a
  hand-typed `/admin/discs?phone=12` runs no query either. The page's check
  saves requests; the loader's is the rule.
- **An empty search runs no query.** `readDiscSearch` decides this before the
  database is touched; the loader returns `results: null` (not searched) as
  distinct from `results: []` (searched, nothing found), which is what lets the
  page tell scenario 1 from scenario 14.
- **Phone input** is counted in digits: below 3 the phone criterion is dropped,
  as if the field were empty. Otherwise it becomes the pattern described under
  "How the phone search becomes a query", matched with `regexMatch` on
  `owner_phone_number`.
- **Disc input** has every `*` removed, then is trimmed; below 2 characters
  what is left, the disc criterion is dropped. `*` goes because supabase-js
  sends the pattern through PostgREST, which treats `*` as another spelling of
  `%` and offers no way to escape it — and it goes before the count, or "a\*"
  would be a one-letter search. No disc name needs a literal asterisk to be
  found. In what remains, `%`, `_` and `\` are escaped before it goes into
  `disc_name ILIKE '%<text>%'`, so a typed "%" matches a percent sign rather
  than every disc.
- **Limits.** Each field accepts at most 200 characters (the column limit in
  `app/discFieldLimits.ts`); longer input is cut, not refused. Results are capped
  at 100 rows: the query asks for 101 and the loader reports `truncated: true`
  when the 101st comes back.
- **Explicit fields.** `queryDiscSearch` reads exactly the columns in the table
  above and maps them field by field; that projection is what the loader sends.
  `additional_info` and `owner_link_token` are never read.
- **Menu placement.** "Kaikki kiekot" is the last link: after "Noutolista" for a
  club that keeps a retrieval list, and after "Ilmoitukset" for one that does
  not (there "Noutolista" is absent, spec 13). It carries no count.
- **The route is English**, per the project conventions; only the menu label and
  page copy are Finnish. It is the first route under `/admin/` — the other admin
  pages sit at the top level — because that is the path asked for.

## Edge cases & known gaps

- **Phone numbers are already readable in full outside this page.** The
  `SELECT` policy on `discs` is granted to `public`, and the anon key (the
  public Supabase key every visitor's browser receives) ships in every page, so
  anyone can read `owner_phone_number` in full by calling the database's REST
  API directly; the four-digit truncation on the front page happens in the app,
  not in the database. This page adds no new exposure, because its loader checks
  the sign-in before reading, but it does not fix the existing one either.
  Spec 11 lists the policy and calls it safe because of that in-app narrowing,
  which only holds for visitors who use the app. Out of scope here.
- **Archiving cannot be undone from the edit page.** It shows and clears the
  returned and released marks, but has no field for `archived_at`. An archived
  disc found here can be edited, but unticking "Palautettu omistajalle" does not
  put it back on the front page while `archived_at` is set.
- **A whole-number search also lists unrelated closed discs with the same
  tail.** "050 111 2222" finds every disc stored as just "2222", whoever owned
  it. Each club has about 230 discs stored as a tail (measured for spec 16),
  out of ten thousand possible tails, so a search rarely finds more than one,
  and the disc name, colour and owner's name in the row tell them apart.
  Leaving tails out would make a closed disc impossible to find from the
  caller's number, which is the page's main use.
- Digits from the middle of a number find nothing: "50111" does not find
  "+358501112222". This is the front page's rule too (spec 01), and a number is
  read off a disc or given by a caller whole or by its end, not by its middle.
- A three-digit search, the minimum, matches every number ending in those
  digits — about one in a thousand. Narrowing a broad search is the 100-row
  cap's job.
- **Every search also reloads the menu's counts.** A search is a navigation,
  and the root loader (`app/root.tsx`) has no rule against running again, so
  each one re-reads the session and the "Vastaukset" and "Noutolista" counts
  besides the search itself. Harmless at one admin's typing speed, and it keeps
  those counts fresh; a `shouldRevalidate` on the root would stop it.
- A disc name of a single character — none is known to exist — cannot be
  searched for by name; search by phone instead.
- The front page lists only discs the club still holds, so a four-digit tail —
  which the admin gives a disc only once it is closed — does not show there,
  and the tail rule (scenario 9) exists on this page alone. Otherwise the two
  pages match a phone number the same way.

## Open questions

None.
