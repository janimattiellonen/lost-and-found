# Statistics

> Status: as-built (describes what exists today, not a wishlist)

## Purpose

A single admin page, "Statistiikka" (statistics), showing how many discs the
club has taken in and given back, when it happened, and which disc models go
missing most often. It is a rough operational overview, not a reporting tool:
everything is computed in the browser from one fetch of the club's discs.

## Actors

- Club admin only. `app/routes/stats.tsx` redirects to `/sign-in` unless
  `isUserLoggedIn(request)`. Linked from `app/ui/AdminMenu.tsx` as
  `{ to: '/stats', label: 'Statistiikka' }`.

## User-facing behaviour

1. When an admin opens `/stats`, then two totals with their method breakdowns,
   and three charts, render from the loader's disc array.
2. "Myytyjen / lahjoitettujen kiekkojen määrä" (number of sold/donated discs) —
   a count of discs with `canBeSoldOrDonated`, and under it a breakdown of that
   same count by `canBeSoldOrDonatedMethod`: "Myydään" (to be sold),
   "Lahjoitetaan" (to be donated), and — when any disc's method was never
   filled in — "Ei kirjattu" (not recorded) for those.
3. "Omistajille palautettujen kiekkojen määrä" (number of discs returned to
   owners) — a count of discs with `isReturnedToOwner`, and under it a breakdown
   of that same count by `returnMethod`: "Postitettu" (posted), "Noudettu"
   (picked up), and "Ei kirjattu" on the same condition.
4. "Seuralle palautetut kiekot" (discs returned to the club) — a monthly bar
   chart of discs by `added_at`.
5. "Omistajille palautetut kiekot" — a monthly bar chart of discs by the date
   they went back to their owner.
6. When a bar in either monthly chart is clicked, then a second chart appears
   below it breaking that month down by day; the clicked bar turns blue.
7. "Top 10 kadotettua kiekkomallia" (top 10 most-lost disc models) — a
   horizontal bar chart of the ten most frequent `disc_name` values.
8. Under that title sits a checkbox, "Ryhmittele kiekon nimen mukaan" (group by
   disc name), off by default. When it is ticked, then the chart counts by disc
   model instead of by the exact stored string: "Destroyer, Star",
   "Destroyer, Halo" and "destroyer" become one bar, labelled with whichever
   spelling of the model occurs most often in the group. The choice is component
   state only — nothing is stored, and reloading the page returns to the
   unticked chart.

## Data source

`getDiscsForStats()` in `app/models/discs.server.ts`:

```
select internal_disc_id, disc_name, can_be_sold_or_donated,
       can_be_sold_or_donated_method, is_returned_to_owner, return_method,
       returned_to_owner_text, returned_to_owner_date, added_at
from discs where club_id = APP_CLUB_ID order by added_at asc
```

- One query, no aggregation in SQL, no filters — **archived, returned, disposed
  and deleted-flagged discs are all included** in every chart.
- Club scoping is by the `APP_CLUB_ID` env var, read server-side.
- Every count and grouping happens in JS, in the components, on each render.

### The two method breakdowns

Both methods are stored as smallints and both are nullable, so a breakdown has
two lines when every disc has a method and three when any does not. The numbers
are built by `getDisposalMethodCounts` and `getReturnMethodCounts` in
`statsUtils.ts`, which count only the discs already counted in the headline
above them — the lines therefore always add up to it.

| Column                          | 0                      | 1                      | Enum                 |
| ------------------------------- | ---------------------- | ---------------------- | -------------------- |
| `can_be_sold_or_donated_method` | "Myydään" (to be sold) | "Lahjoitetaan"         | `app/discMethods.ts` |
| `return_method`                 | "Postitettu" (posted)  | "Noudettu" (picked up) | `app/discMethods.ts` |

The labels are read from those two enums rather than retyped here, so the
statistics page and the disc table can never disagree about what a `1` means.
Both enums moved out of `features/discs/` and into `app/discMethods.ts` for
this: ESLint forbids one feature slice importing another, and they were already
shared vocabulary — `app/types.ts` has always depended on them. They sit at the
top level beside `types.ts` and `utils.ts` rather than in `app/lib/`, which is
documented as plumbing with no domain in it.

**Most rows have no method.** Neither column existed while the club ran on the
Google Sheet, and the sheet import leaves both null. On 2026-09-11 the live
table held 495 discs marked sold-or-donated — 107 "Myydään", 109
"Lahjoitetaan" and 279 with nothing recorded — and 448 returned to owners, of
which 39 "Postitettu", 105 "Noudettu" and 304 nothing. A breakdown that showed
only the known methods would therefore have hidden more than half of each total
and would not have summed to the headline printed directly above it, so the
unrecorded discs are shown as their own "Ei kirjattu" line. That line is left
out only when it would read zero, so a club that has always recorded the method
never sees it.

## The charts

| Chart                          | Component                  | Measures                                                        | Grouped by                                                                           | Bucket                                                                            |
| ------------------------------ | -------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Seuralle palautetut kiekot     | `DiscsReturnedToClub.tsx`  | Discs taken into the club's inventory                           | `addedAt`                                                                            | `"<month0>.<year>"` key, i.e. month within a year; drill-down by day of month     |
| Omistajille palautetut kiekot  | `DiscsReturnedToOwner.tsx` | Discs with `isReturnedToOwner` **and** a resolvable return date | `returnedToOwnerDate`, falling back to a leading `d.M.yyyy` in `returnedToOwnerText` | `date-fns` month number **only — no year** (see gaps); drill-down by day of month |
| Top 10 kadotettua kiekkomallia | `MostLostByDiscName.tsx`   | Row count per `discName`                                        | exact `discName` string, or the model name alone when grouping is on                 | none — all time                                                                   |

### Grouping by disc name

Admins type a disc as mould first, plastic after a comma — "Destroyer, Star".
On 2026-09-11, `select disc_name from discs where club_id = 1` returned 1770
rows, 1483 of which contain a comma; the grouping is built on that shape.
`getTopLostDiscsByDiscName` in `statsUtils.ts` therefore:

- takes everything before the first comma as the model name, accepting a full
  stop in the comma's place because a few rows read "Essence. NEO";
- collapses runs of whitespace, so a name typed with a stray double space is
  the same model as one without;
- compares the result in lower case, which is what merges "Destroyer",
  "destroyer" and "DEstroyer";
- labels the bar with whichever spelling occurs most often in the group — 40
  "Destroyer" and one "DEstroyer" read "Destroyer" — falling back to the
  first-seen spelling when two are equally common.

A name that is nothing but a separator ("`, Star`") keeps its original text
rather than collapsing into an empty bar. On the live data the checkbox takes
the chart from 764 distinct entries to 430, and the top bar from
"Destroyer, Star" at 75 to "Destroyer" at 110.

The dictionary of real mould and plastic names in
`app/features/discs/submission/parser/` is deliberately **not** used here.
Grouping on the comma needs no vocabulary to maintain and no cross-feature
import, and it covers the stored data; what it does not cover is listed under
known gaps.

Shared helpers are in `app/features/stats/statsUtils.ts`
(`mapBySeparator` → `sortMappedData` → `getAddedDiscCountByMonth` /
`getAddedDiscCountByDaysInMonth`, plus `getDonatedOrSoldDiscCount`,
`getReturnedDiscCount` and the two method breakdowns). Bars are sorted by date
ascending; legends use
`getMonthName(date, 'short')` in `fi-FI` for the monthly charts and `dd` for the
daily ones.

## Rendering

- `app/ui/BarChart.tsx` — vertical bars as `<button>`s, so a bar is clickable
  and keyboard-reachable; bar height is `value / (max + 30)`, so charts with
  small numbers look flat and no bar is ever full height. Hard-coded red bars,
  blue on hover/selection, a red debug-looking `border: solid 1px red` around
  each chart via the `className` passed by the stats components.
- `app/ui/HorizontalBarChart.tsx` — same `max + 30` width formula, fixed 10rem
  label column, no click handling.
- `app/features/stats/MethodBreakdown.tsx` — the method lines under each total,
  as a `<dl>` of label and count. It lives in the feature rather than `app/ui/`
  because both its uses are on this one page.
- Neither chart has an axis, a scale, or a value shown other than the number
  printed above/beside the bar; there is no charting library.

## Routes & entry points

| Route    | Method(s) | Auth                                        | Purpose                                               |
| -------- | --------- | ------------------------------------------- | ----------------------------------------------------- |
| `/stats` | GET       | signed-in; otherwise redirect to `/sign-in` | Loads all discs for the club and renders `StatsPage`. |

## Rules & constraints

- Admin-only; the loader is the only authorization check.
- Each method breakdown counts only the discs its headline counts — a disc is
  in the disposal breakdown only if `can_be_sold_or_donated` is true, whatever
  `can_be_sold_or_donated_method` holds. No live row has a method set while the
  flag is false, and nothing enforces that; such a disc would be left out of the
  breakdown entirely, exactly as it is already left out of the headline.
- Grouping never looks past the first comma or full stop, so a two-word mould
  such as "Night Trooper" or "Sea Serpent" survives whole — there is no attempt
  to tell a plastic from part of a name.
- Phone numbers are not selected at all here (the `owner_phone_number` masking
  in `getDiscsForStats` is dead code for the current select list).
- The whole club's disc table crosses the wire on every page load, and every
  recomputation runs on the full array — the drill-down charts recompute
  `getAddedDiscCountByDaysInMonth` twice per render (once for the data, once for
  the legend). With a few thousand discs this is fine; there is no pagination,
  memoization or caching, so it grows linearly and forever.

## Edge cases & known gaps

- `DiscsReturnedToOwner` groups by `getMonth(date)` alone, so **the same month
  in different years is merged into one bar**; `DiscsReturnedToClub` includes
  the year in its key. The two charts are not comparable.
- `mapBySeparator` skips a row when the separator is falsy. `date-fns`
  `getMonth` is 0-based, so **January is dropped from
  `DiscsReturnedToOwner`** entirely. `DiscsReturnedToClub` is unaffected because
  its separator is the string `"0.2026"`, which is truthy.
- `DiscsReturnedToOwner`'s day drill-down is fed the _unfiltered_ `data`, not
  the filtered set, so a disc with a parsable return note but
  `isReturnedToOwner = false` appears in the day chart though not in the month
  chart.
- With grouping off, `MostLostByDiscName` groups on the raw `discName`, so
  casing and spelling variants ("Destroyer" vs "destroyer") count as different
  models. Ties at the tenth place are broken arbitrarily either way — the sort
  is by count only, so which of two equal models is shown tenth depends on the
  order the rows came back from the database.
- Grouping by disc name only splits on a comma or a full stop. A plastic written
  with a space — "Destroyer Star", "Method NEO" — stays its own model, and so
  does a misspelt mould: case differences merge, but "Destroyer" and "Destoyer"
  do not. Only a handful of live rows are written that way, and they cannot be
  told apart from a genuine two-word mould without a vocabulary of real names.
- A full stop is treated as a mistyped comma, so any mould whose name contains
  one would be silently truncated at it. No such name is in the live data, and
  nothing checks for one.
- The two headline counts include archived and long-resolved discs, so they are
  all-time totals with no date range control. The method breakdowns inherit
  this.
- The method is unrecorded on 56% of sold-or-donated discs and 68% of returned
  ones, so the visible split between the two known methods is drawn from a
  minority of the data and should not be read as the club's real ratio. Nothing
  backfills the old rows and nothing will: the information was never captured.
- `statsUtils.test.ts` covers `getTopLostDiscsByDiscName` and the two method
  breakdowns; nothing covers the date-bucketing helpers or any stats component.
- Charts are unlabelled beyond the title; no empty state — a club with no data
  renders an empty chart frame. The method breakdowns are the same: with nothing
  sold, donated or returned they print "Myydään: 0" and "Lahjoitetaan: 0" under
  a zero, rather than saying there is nothing to show.
- The headline "Myytyjen / lahjoitettujen kiekkojen määrä" is past tense (discs
  that _were_ sold or donated) while the enum labels beneath it, "Myydään" and
  "Lahjoitetaan", are what is _to_ happen to a disc the club has released. The
  column records an intention, not a completed sale, so the labels are the
  accurate half; the heading predates them and was left alone rather than
  changed under an admin who knows it by sight.

## Open questions

- Whether the monthly charts should exclude archived discs, and whether
  "seuralle palautetut" (measured by `added_at`) is the intended meaning of
  "returned to the club" as opposed to "found and logged".
