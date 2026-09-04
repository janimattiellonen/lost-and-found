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
1. When an admin opens `/stats`, then two totals and three charts render from
   the loader's disc array.
2. "Myytyjen / lahjoitettujen kiekkojen määrä" (number of sold/donated discs) —
   a count of discs with `canBeSoldOrDonated`.
3. "Omistajille palautettujen kiekkojen määrä" (number of discs returned to
   owners) — a count of discs with `isReturnedToOwner`.
4. "Seuralle palautetut kiekot" (discs returned to the club) — a monthly bar
   chart of discs by `added_at`.
5. "Omistajille palautetut kiekot" — a monthly bar chart of discs by the date
   they went back to their owner.
6. When a bar in either monthly chart is clicked, then a second chart appears
   below it breaking that month down by day; the clicked bar turns blue.
7. "Top 10 kadotettua kiekkomallia" (top 10 most-lost disc models) — a
   horizontal bar chart of the ten most frequent `disc_name` values.

## Data source
`getDiscsForStats()` in `app/models/discs.server.ts`:

```
select internal_disc_id, disc_name, can_be_sold_or_donated,
       is_returned_to_owner, returned_to_owner_text, returned_to_owner_date,
       added_at
from discs where club_id = APP_CLUB_ID order by added_at asc
```

- One query, no aggregation in SQL, no filters — **archived, returned, disposed
  and deleted-flagged discs are all included** in every chart.
- Club scoping is by the `APP_CLUB_ID` env var, read server-side.
- Every count and grouping happens in JS, in the components, on each render.

## The charts
| Chart | Component | Measures | Grouped by | Bucket |
|---|---|---|---|---|
| Seuralle palautetut kiekot | `DiscsReturnedToClub.tsx` | Discs taken into the club's inventory | `addedAt` | `"<month0>.<year>"` key, i.e. month within a year; drill-down by day of month |
| Omistajille palautetut kiekot | `DiscsReturnedToOwner.tsx` | Discs with `isReturnedToOwner` **and** a resolvable return date | `returnedToOwnerDate`, falling back to a leading `d.M.yyyy` in `returnedToOwnerText` | `date-fns` month number **only — no year** (see gaps); drill-down by day of month |
| Top 10 kadotettua kiekkomallia | `MostLostByDiscName.tsx` | Row count per `discName` | exact `discName` string | none — all time |

Shared helpers are in `app/features/stats/statsUtils.ts`
(`mapBySeparator` → `sortMappedData` → `getAddedDiscCountByMonth` /
`getAddedDiscCountByDaysInMonth`, plus `getDonatedOrSoldDiscCount` and
`getReturnedDiscCount`). Bars are sorted by date ascending; legends use
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
- Neither chart has an axis, a scale, or a value shown other than the number
  printed above/beside the bar; there is no charting library.

## Routes & entry points
| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/stats` | GET | signed-in; otherwise redirect to `/sign-in` | Loads all discs for the club and renders `StatsPage`. |

## Rules & constraints
- Admin-only; the loader is the only authorization check.
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
- `DiscsReturnedToOwner`'s day drill-down is fed the *unfiltered* `data`, not
  the filtered set, so a disc with a parsable return note but
  `isReturnedToOwner = false` appears in the day chart though not in the month
  chart.
- `MostLostByDiscName` groups on the raw `discName`, so casing and spelling
  variants ("Destroyer" vs "destroyer") count as different models, and ties at
  the tenth place are broken arbitrarily.
- The two headline counts include archived and long-resolved discs, so they are
  all-time totals with no date range control.
- No tests cover `statsUtils.ts` or any stats component.
- Charts are unlabelled beyond the title; no empty state — a club with no data
  renders an empty chart frame.

## Open questions
- Whether the monthly charts should exclude archived discs, and whether
  "seuralle palautetut" (measured by `added_at`) is the intended meaning of
  "returned to the club" as opposed to "found and logged".
