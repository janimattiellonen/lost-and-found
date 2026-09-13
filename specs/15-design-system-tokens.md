# Design system tokens

> Status: as-built (describes what exists today, not a wishlist)
>
> Writing rules — reader who does not know this codebase, every abbreviation
> explained on first use, plain words over jargon, as long as the subject needs.
> See `.claude/skills/specs/SKILL.md`.

## Purpose

The app is styled by two systems that do not know about each other. The shared
components in `app/ui/` use StyleX (a compile-time CSS-in-JS library: you write
style objects in TypeScript, it emits atomic CSS classes at build time) with a
small set of tokens in `app/styles/tokens.stylex.ts`. Almost every page in
`app/features/` uses Tailwind utility classes instead — 37 of 42 components —
and picks its colours straight from Tailwind's stock palette.

The result is two palettes with near-miss values for the same idea. A muted grey
is `color.textMuted` (`#6b7280`) in a primitive and `text-gray-500` in the page
that renders it; those happen to agree. A primary blue is `color.accent`
(`#1976d2`, left over from Material UI, which this project no longer uses) in a
primitive and `blue-600` (`#2563eb`) in the page; those do not. Nobody can say
which is correct, because nothing decides it.

This work builds one token set that **is** the palette currently on screen. Every token's value is the Tailwind colour
that the running site already shows, so
converting a component from Tailwind classes to StyleX tokens is a visual no-op —
the pixels do not move. Once every colour has one agreed name, changing the look
of the app becomes an edit to the palette instead of a search across fifty files.

The same names are also given to Tailwind, as colour aliases in
`tailwind.config.ts`, so the pages that have not been converted yet can still say
`text-fg-muted` rather than `text-gray-500`. That is what turns each later
conversion into a rename instead of a guess about what the grey was for.

This spec covers the token set and those aliases. It does **not** convert any
page off Tailwind; that is separate work, done component by component afterwards,
and each step of it is a no-op precisely because the tokens were derived this
way.

## Actors

Developers only. This is internal plumbing with no route, no user interaction and
no database.

Users of the app are involved in exactly one way, and it is the point of the
whole exercise: they must not be able to tell the work happened. Any pixel that
moves is either listed as a deliberate exception below or is a bug.

## User-facing behaviour

1. When any page is loaded after this work, then it looks exactly as it did
   before — same colours, same spacing, same type sizes — with the seven
   exceptions in scenarios 2 to 8.
2. When a primary button, a focused text field, a checkbox or a radio is shown,
   then its blue changes from Material UI's `#1976d2` to Tailwind's `blue-600`
   (`#2563eb`), and its hover blue from `#1565c0` to `blue-700` (`#1d4ed8`).
   These are the two shades of blue already used for links and for the selected
   card on the owner link page; the app ends up with one blue instead of two.
   The change is small and slightly more saturated. It affects `Button`,
   `TextField`, `Select`, `Checkbox`, `RadioGroup`, `CircularProgress`,
   `AdminMenu`, `DiscSelector`, `AddDiscsPage` and `NotificationsPage`.
3. When a destructive action or an error is shown through a StyleX component,
   then its red changes from Material UI's `#d32f2f` to Tailwind's `red-500`
   (`#ef4444`) — the shade the Tailwind-styled form errors already use.
4. When the disc list shows the warning marker on a disc the club has held for
   more than three months, then its colour changes from the raw CSS keyword `red`
   (`#ff0000`) to `red-500`. Two components draw that marker — `DiscListIntro`,
   which explains it in the legend, and `DiscTable`, which puts it beside the
   date — and they now share one `OverdueMarker` component
   (`features/discs/list/OverdueMarker.tsx`), which owns both the colour and the
   Finnish tooltip text that had been copied into both files. The legend cannot
   describe a marker the table does not draw. Pure `#ff0000` is not a colour
   anything else in the app uses.

5. When a success or error box is shown — after saving on the disc-entry page,
   or in the `SuccessNote` that follows a form post — then its three colours move
   from Material UI's green and red to Tailwind's. Two of the six are
   imperceptible (a perceptual distance, ΔE, of 2.7 and 3.3, where roughly 2.3 is
   the threshold at which a difference can be seen at all) and three are mild
   (8.2 to 9.4). One is visible: the success box's border lightens from `#a5d6a7`
   to `green200` (ΔE 12.5). The triad has to move as a unit — taking the cheap
   two-thirds would leave a box whose border belonged to a different palette.

6. When the pointer is over the delete button on the disc-entry page's parsed
   rows, then its red darkens to `color.dangerHover` rather than to `#b71c1c`.
   At ΔE 12.9 this is the **largest** visible change in the work — slightly
   larger than the success border in scenario 5. It is here because `Button`
   already darkened to `dangerHover` on the same gesture and this button did not:
   one interaction was reaching for two different reds. The alternative was to
   keep the two apart for ever with nothing to say which was correct.
7. When an unread notification card is shown, then its background is
   `color.accentSurface` rather than `#f5f9ff` (ΔE 2.2).
8. When any notification card is shown, then its border is `color.borderSubtle`
   rather than `#e0e0e0` (ΔE 3.3).

Scenarios 7 and 8 are below the roughly 2.3 ΔE at which a difference becomes
visible at all, so they are listed for completeness rather than because anyone
will see them. They are listed because rule 1 requires every changed value to be
listed, and an exception that is only recorded when it is large is not a rule.

Scenarios 2 to 8 are the price of having one palette rather than three, and were
accepted deliberately rather than overlooked. Each is a shade change of the same
hue, not a redesign. The alternative — keeping the Material UI values — was
considered and rejected, because it leaves the app with two blues and three reds
permanently and no rule saying which to reach for. See "Open questions" for the
decision as recorded.

## Data

No database tables. The "data" of this feature is three files: a palette, a set of
semantic tokens built on it, and the Tailwind config that mirrors the same names
for the pages not yet converted.

### Layer 1 — the palette: `app/styles/palette.stylex.ts` (new)

Raw colour values with no meaning attached, named after their Tailwind source.
Only the shades the app actually uses are listed; this is an inventory of what is
on screen, not a copy of Tailwind's whole palette. Values are Tailwind 3.3.3's
defaults, read from the installed package rather than typed from memory.

| Token        | Value     | Where it is on screen today                                                                 |
| ------------ | --------- | ------------------------------------------------------------------------------------------- |
| `gray100`    | `#f3f4f6` | `color.surfaceMuted`                                                                        |
| `gray200`    | `#e5e7eb` | notification card border — replaces `#e0e0e0`, see scenario 8                               |
| `gray300`    | `#d1d5db` | `border-gray-300`, and light text on the dark table                                         |
| `gray400`    | `#9ca3af` | `text-gray-400` (the "Lisätiedot" caption)                                                  |
| `gray500`    | `#6b7280` | `text-gray-500` (17 uses), `color.textMuted`                                                |
| `gray600`    | `#4b5563` | `text-gray-600` (12 uses)                                                                   |
| `gray700`    | `#374151` | `text-gray-700` (13 uses), `color.textSecondary`                                            |
| `gray900`    | `#111827` | `color.textPrimary`, `text-gray-900`                                                        |
| `white`      | `#ffffff` | `bg-white`, `text-white`                                                                    |
| `black`      | `#000000` | the charts' bar labels; also `text-black` on the notify forms, still Tailwind               |
| `red300`     | `#fca5a5` | delete icon, hover                                                                          |
| `red400`     | `#f87171` | delete icon                                                                                 |
| `red500`     | `#ef4444` | `text-red-500` — the standard form error (10 uses)                                          |
| `red50`      | `#fef2f2` | error box background                                                                        |
| `red200`     | `#fecaca` | error box border                                                                            |
| `red600`     | `#dc2626` | the owner link page's error line                                                            |
| `red800`     | `#991b1b` | error box text                                                                              |
| `amber300`   | `#fcd34d` | info icon, hover                                                                            |
| `amber400`   | `#fbbf24` | info icon                                                                                   |
| `amber700`   | `#b45309` | `text-amber-700` — the "owner gives up" notice                                              |
| `caution700` | `#8a6100` | a value the disc parser is unsure of — **not a Tailwind colour**                            |
| `green300`   | `#86efac` | "mark returned" icon, hover                                                                 |
| `green50`    | `#f0fdf4` | success box background                                                                      |
| `green200`   | `#bbf7d0` | success box border                                                                          |
| `green400`   | `#4ade80` | "mark returned" icon                                                                        |
| `green700`   | `#15803d` | `bg-green-700` — save buttons in the inline forms                                           |
| `green800`   | `#166534` | those buttons' hover                                                                        |
| `blue50`     | `#eff6ff` | unread notification card — and the owner link page's selected card, which is still Tailwind |
| `blue200`    | `#bfdbfe` | that card's inner divider                                                                   |
| `blue600`    | `#2563eb` | that card's border when selected                                                            |
| `blue700`    | `#1d4ed8` | `text-blue-700` — `sms:` links                                                              |
| `sky300`     | `#7dd3fc` | "mark sellable" icon, hover                                                                 |
| `sky400`     | `#38bdf8` | "mark sellable" icon                                                                        |
| `violet300`  | `#c4b5fd` | "set course" icon, hover                                                                    |
| `violet400`  | `#a78bfa` | "set course" icon                                                                           |
| `orange300`  | `#fdba74` | retrieval icon when the disc is on the list, hover                                          |
| `orange400`  | `#fb923c` | retrieval icon when the disc is on the list                                                 |

Five translucent entries, for a tint laid over whatever is behind it rather than
a colour of its own — a button's hover wash, a highlighted menu row, an outlined
button's border. Tailwind writes these as a `/nn` opacity suffix on a colour;
StyleX needs the whole value, so they are their own entries. The `rgb` triples
are `blue600` and `red500`, so they move when those move.

| Token        | Value                     | Where it is on screen today           |
| ------------ | ------------------------- | ------------------------------------- |
| `blue600A04` | `rgba(37, 99, 235, 0.04)` | outlined and text button hover        |
| `blue600A08` | `rgba(37, 99, 235, 0.08)` | highlighted row in the disc-name menu |
| `blue600A50` | `rgba(37, 99, 235, 0.5)`  | outlined button border                |
| `red500A04`  | `rgba(239, 68, 68, 0.04)` | outlined and text error button hover  |
| `red500A50`  | `rgba(239, 68, 68, 0.5)`  | outlined error button border          |

These were not in the original plan. They had to be added because `Button.tsx`
and `DiscSelector.tsx` carried Material UI's blue and red as hardcoded
`rgba(25,118,210,...)` and `rgba(211,47,47,...)` — a spelling the first survey of
the code missed, because it searched for hex. Left alone, a contained button
would have turned Tailwind blue while the outlined button beside it kept MUI blue
at 50% opacity. `Button.tsx` also had `#c62828` (MUI dark red) as its contained
error hover, and `AddDiscsPage.tsx` had `#b71c1c` on the same gesture. Both are
now `color.dangerHover`; the second of them is scenario 6, because unlike the
first it is a visible change.

Plus the values the disc table uses for its dark surface. These are not Tailwind
colours and never were — they were hardcoded in
`app/features/discs/list/DiscTable.tsx`. They move into the palette, and the
table now reads them back out of the `dark` tokens, so there is one copy rather
than a component quietly holding its own. Higher number is darker.

| Token     | Value     | Role                             |
| --------- | --------- | -------------------------------- |
| `dark200` | `#dddddd` | the table's body text            |
| `dark500` | `#3f3c3c` | every second body row            |
| `dark600` | `#383838` | header cell of the sorted column |
| `dark700` | `#333333` | header cell, hovered             |
| `dark800` | `#292929` | header cell                      |
| `dark900` | `#212121` | table header background          |

`dark200` is the table's body text and is **not** Tailwind's `gray300`
(`#d1d5db`), which the row icons and the inline forms use. The two are three
points apart and both sit on this one table. They are kept separate because
merging them would change what is on screen, which this work does not do outside
the seven listed exceptions; the inconsistency is recorded as a gap instead.

`dark500` was written `rgb(63, 60, 60)` in the component. It is spelled as hex
here so every palette entry reads alike; StyleX compiles both spellings to the
same value.

### Layer 2 — semantic tokens: `app/styles/tokens.stylex.ts` (extended)

What a colour is _for_. This is the layer components import; a component should
never reach into `palette` directly. StyleX supports one `defineVars` group
referencing another — it compiles to `--textMuted: var(--gray500)` — so the two
layers are a real indirection at run time, not a copy.

The existing `color` group keeps its names. Seven of its ten values already match
Tailwind exactly and are untouched; the three Material UI leftovers — `accent`,
`accentHover` and `danger` — change, and new tokens are added for roles that only
Tailwind expressed until now.

| Token                     | Palette      | Change                                                |
| ------------------------- | ------------ | ----------------------------------------------------- |
| `textPrimary`             | `gray900`    | unchanged                                             |
| `textSecondary`           | `gray700`    | unchanged                                             |
| `textBody`                | `gray600`    | **new** — `text-gray-600`                             |
| `textMuted`               | `gray500`    | unchanged                                             |
| `textSubtle`              | `gray400`    | **new** — `text-gray-400`                             |
| `textStrong`              | `black`      | **new** — the two charts' bar labels                  |
| `surface`                 | `white`      | unchanged                                             |
| `surfaceMuted`            | `gray100`    | unchanged                                             |
| `border`                  | `gray300`    | unchanged                                             |
| `borderSubtle`            | `gray200`    | **new** — notification card border, was `#e0e0e0`     |
| `accent`                  | `blue600`    | **changed** from `#1976d2` (see scenario 2)           |
| `accentHover`             | `blue700`    | **changed** from `#1565c0`                            |
| `accentSurface`           | `blue50`     | **new** — unread notification card, was `#f5f9ff`     |
| `accentSurfaceHover`      | `blue600A04` | **new** — outlined/text button hover                  |
| `accentSurfaceSelected`   | `blue600A08` | **new** — highlighted menu row                        |
| `accentBorderSubtle`      | `blue200`    | **new** — selected card divider                       |
| `accentBorderTranslucent` | `blue600A50` | **new** — outlined button border                      |
| `onAccent`                | `white`      | unchanged                                             |
| `link`                    | `blue700`    | **new** — `sms:` and `tel:` links                     |
| `danger`                  | `red500`     | **changed** from `#d32f2f` (see scenarios 3 and 4)    |
| `dangerHover`             | `red600`     | **new** — contained error button hover, was `#c62828` |
| `dangerStrong`            | `red600`     | **new** — the owner link page's error line            |
| `dangerSurfaceHover`      | `red500A04`  | **new** — outlined/text error button hover            |
| `dangerBorderTranslucent` | `red500A50`  | **new** — outlined error button border                |
| `dangerSurface`           | `red50`      | **new** — error box background                        |
| `dangerBorder`            | `red200`     | **new** — error box border                            |
| `dangerText`              | `red800`     | **new** — error box text                              |
| `warning`                 | `amber700`   | **new** — the "owner gives up" notice                 |
| `success`                 | `green700`   | **new** — save buttons                                |
| `successHover`            | `green800`   | **new**                                               |
| `successSurface`          | `green50`    | **new** — success box background                      |
| `successBorder`           | `green200`   | **new** — success box border                          |
| `successText`             | `green800`   | **new** — success box text                            |
| `caution`                 | `caution700` | **new** — a value the parser guessed at               |

A new `dark` group, for the disc table and the inline forms that open inside it.
These exist because the table is a dark island in an otherwise light app, and the
same Tailwind class means two different things depending on which side of that
line it is on: `text-gray-300` is a faint grey on white in most of the app, but
it is the _normal_ text colour inside the dark table.

| Token              | Palette   | Role                             |
| ------------------ | --------- | -------------------------------- |
| `dark.surface`     | `dark900` | table header background          |
| `dark.cell`        | `dark800` | header cell                      |
| `dark.cellHover`   | `dark700` | header cell, hovered             |
| `dark.cellSorted`  | `dark600` | header cell of the sorted column |
| `dark.rowAlt`      | `dark500` | every second body row            |
| `dark.headingText` | `white`   | column heading text              |
| `dark.bodyText`    | `dark200` | table body text                  |
| `dark.text`        | `gray300` | normal text on the dark surface  |
| `dark.textHover`   | `white`   | that text, hovered               |
| `dark.border`      | `gray300` | the cancel button's outline      |

A new `icon` group. The disc table's row actions are colour-coded so an admin can
hit the right one at a glance on a phone; the hue is the label, which makes these
semantic tokens rather than decoration. Each is a pair — resting and hovered.

| Token                      | Palette                   | Action ("title" attribute)                                              |
| -------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| `icon.delete` / `Hover`    | `red400` / `red300`       | "Poista kiekko" (delete disc)                                           |
| `icon.edit` / `Hover`      | `gray300` / `white`       | "Muokkaa tietoja" (edit details)                                        |
| `icon.returned` / `Hover`  | `green400` / `green300`   | "Merkitse palautetuksi" (mark returned)                                 |
| `icon.sellable` / `Hover`  | `sky400` / `sky300`       | "Merkitse myytäväksi tai lahjoitettavaksi" (mark sellable or donatable) |
| `icon.retrieval` / `Hover` | `orange400` / `orange300` | the retrieval marker, when the disc is on the retrieval list            |
| `icon.course` / `Hover`    | `violet400` / `violet300` | "Aseta rata" (set course)                                               |
| `icon.info` / `Hover`      | `amber400` / `amber300`   | "Näytä lisätiedot" (show extra details)                                 |
| `icon.disabled`            | `gray500`                 | an action the disc cannot take                                          |

The `icon.retrieval` pair falls back to `icon.edit` when the disc is _not_ on the
retrieval list, which is how `DiscTable` already behaves.

### Status boxes, and the colour that stayed

A success or error box is three colours that only make sense together — a tinted
background, a border and a darker text. The app had two such triads, written as
Material UI literals, and the success one was copied character for character into
both `ui/SuccessNote.tsx` and `features/discs/submission/AddDiscsPage.tsx`. They
are now `color.successSurface` / `successBorder` / `successText` and
`color.dangerSurface` / `dangerBorder` / `dangerText`, so the two copies of the
_colours_ became one name. The two copies of the _box_ did not — see the gap
below.

They were measured before being moved, rather than swapped on the assumption that
"close enough" is close enough. Perceptual distance (ΔE) against the nearest
Tailwind shade:

| Was                          | Now        | ΔE       |
| ---------------------------- | ---------- | -------- |
| `#fdecea` error background   | `red50`    | 2.7      |
| `#f5c2c0` error border       | `red200`   | 3.2      |
| `#e8f5e9` success background | `green50`  | 3.3      |
| `#8e0000` error text         | `red800`   | 9.4      |
| `#1b5e20` success text       | `green800` | 8.2      |
| `#a5d6a7` success border     | `green200` | **12.5** |

Roughly 2.3 is where a difference becomes visible at all, so the first three are
the same colour spelled differently and only the success border really changes.

**`#8a6100` deliberately did not move.** The disc parser marks a value it guessed
at in a dark olive, and the nearest Tailwind shade — `amber700`, which the app
already uses as `color.warning` — is 26.8 ΔE away: a different colour, not a
different spelling. Converting it would have been a design change smuggled in
under a rename. It keeps its own palette entry, `caution700`, marked as
non-Tailwind in the same way the disc table's greys are, and its own token,
`color.caution`, held apart from `color.warning` on purpose.

### Non-colour tokens

The existing `space`, `font`, `size` and `radius` groups are corrected to match
Tailwind's scale, which is what the pages are actually laid out on. Tailwind's
spacing step is `0.25rem`, so `mb-4` is 16px.

`space` — three steps are added, because the pages use them and the token set had
no name for them. Existing names keep their values, so nothing that already uses
`space.md` moves.

| Token | Value  | Tailwind step | Status    |
| ----- | ------ | ------------- | --------- |
| `xs`  | `4px`  | `1` (27 uses) | unchanged |
| `sm`  | `8px`  | `2` (54 uses) | unchanged |
| `smd` | `12px` | `3` (13 uses) | **new**   |
| `md`  | `16px` | `4` (87 uses) | unchanged |
| `lg`  | `24px` | `6` (24 uses) | unchanged |
| `xl`  | `32px` | `8` (37 uses) | unchanged |
| `xxl` | `48px` | `12` (1 use)  | **new**   |

`font` — `sizeXs` is added (`text-xs` is used 23 times and had no token), and
`sizeLg` is corrected. It is currently `1.25rem`, which is Tailwind's `text-xl`,
not its `text-lg`; the name has been lying. Correcting it changes the two places
that use it, so the callers move to the token that preserves their current size:

| Token     | Value      | Tailwind    | Status                                |
| --------- | ---------- | ----------- | ------------------------------------- |
| `sizeXs`  | `0.75rem`  | `text-xs`   | **new**                               |
| `sizeSm`  | `0.875rem` | `text-sm`   | unchanged                             |
| `sizeMd`  | `1rem`     | `text-base` | unchanged                             |
| `sizeLg`  | `1.125rem` | `text-lg`   | **changed** from `1.25rem`            |
| `sizeXl`  | `1.25rem`  | `text-xl`   | **changed** from `1.75rem`            |
| `sizeXxl` | `1.75rem`  | —           | **new**, holds the old `sizeXl` value |

Four call sites move so that their rendered size does not change. The original
survey counted two; it had read `InfoBox`'s `sizeLg` as the heading that also
carries Tailwind's `text-lg`, but those are two different elements — the token is
on the "Ohjeet" (instructions) `<h2>`, which has no Tailwind size class to
override it, so shifting `sizeLg` would have shrunk that heading.

| File                                         | Was      | Now       | Rendered size      |
| -------------------------------------------- | -------- | --------- | ------------------ |
| `ui/H2.tsx` (default)                        | `sizeLg` | `sizeXl`  | 1.25rem, unchanged |
| `ui/H2.tsx` (≥600px)                         | `sizeXl` | `sizeXxl` | 1.75rem, unchanged |
| `ui/InfoBox.tsx` (≥600px)                    | `sizeLg` | `sizeXl`  | 1.25rem, unchanged |
| `features/discs/submission/AddDiscsPage.tsx` | `sizeXl` | `sizeXxl` | 1.75rem, unchanged |

After the move nothing uses `sizeLg`. It stays defined, because `text-lg` is used
in the pages and will need the token when they convert.

`radius` and `size` are unchanged. `radius.sm` (`4px`) already equals Tailwind's
`rounded`, which is the only radius the pages use. `radius.lg` is used by nothing
and is left in place rather than removed, since removing it is not this work.

### Layer 3 — the same names in Tailwind: `tailwind.config.ts`

`theme.extend.colors` gains one alias per semantic token, so the 37 components
still on Tailwind can write `text-fg-muted` instead of `text-gray-500`. This is
the half of the work that pays off during the migration rather than after it: a
page written in semantic classes converts to StyleX by renaming `text-fg-muted`
to `color.textMuted`, with no judgement call about what the grey was for.
Without it, every one of those conversions has to re-derive the meaning from
context — which is the step that is ambiguous, because `text-gray-300` means two
different things depending on which surface it sits on.

Only colours get aliases. Spacing, type sizes and radii do not need them,
because those tokens were derived from Tailwind's own scale in the first place —
`space.md` and `mb-4` are both 16px by construction, so `mb-4` is already the
right thing for a Tailwind page to write and renames to `space.md` just as
mechanically.

`extend` is used rather than replacing `theme.colors`, so Tailwind's stock
palette stays available. Replacing it would force every page onto the aliases in
one change, breaking all 37 at once. The aliases are the intended path; nothing
mechanically blocks the old one, and review is what keeps new code on it.

The alias names are chosen so each Tailwind class maps to exactly one token:

| Tailwind class                                         | Token                                 |
| ------------------------------------------------------ | ------------------------------------- |
| `text-fg-primary`                                      | `color.textPrimary`                   |
| `text-fg-secondary`                                    | `color.textSecondary`                 |
| `text-fg-body`                                         | `color.textBody`                      |
| `text-fg-muted`                                        | `color.textMuted`                     |
| `text-fg-subtle`                                       | `color.textSubtle`                    |
| `text-fg-strong`                                       | `color.textStrong`                    |
| `text-fg-on-accent`                                    | `color.onAccent`                      |
| `text-fg-link`                                         | `color.link`                          |
| `bg-surface`                                           | `color.surface`                       |
| `bg-surface-muted`                                     | `color.surfaceMuted`                  |
| `bg-surface-accent`                                    | `color.accentSurface`                 |
| `border-line`                                          | `color.border`                        |
| `border-line-accent`                                   | `color.accent`                        |
| `border-line-accent-subtle`                            | `color.accentBorderSubtle`            |
| `bg-accent`, `bg-accent-hover`                         | `color.accent`, `color.accentHover`   |
| `text-danger`, `text-danger-strong`                    | `color.danger`, `color.dangerStrong`  |
| `text-warning`                                         | `color.warning`                       |
| `bg-success`, `bg-success-hover`                       | `color.success`, `color.successHover` |
| `bg-dark-surface`, `bg-dark-cell`, `text-dark-text`, … | the `dark` group                      |
| `text-icon-delete`, `text-icon-delete-hover`, …        | the `icon` group                      |

**The hex values are written twice.** `tailwind.config.ts` repeats the literal
values from `palette.stylex.ts` rather than importing them. This is not
laziness — both ways out of it were tried against StyleX 0.19 and neither works:

- **Tailwind cannot reference the StyleX variables.** StyleX hashes the custom
  property names it emits: `palette.gray500` becomes `--x1jb24h0`. The hash is
  stable and identical in development and production, but it is derived from the
  file path and export name, so a Tailwind config cannot write
  `var(--gray500)` — no such variable exists.
- **StyleX cannot read a shared constants file.** Giving both tools one plain
  `.ts` module of hex values fails the build with _"Only static values are
  allowed inside of a `defineVars()` call"_. StyleX resolves `defineVars` at
  compile time and will not follow a cross-file import to do it.

So the duplication is guarded rather than avoided: a unit test reads both files
as text, pulls every hex value out with the name it is bound to, and fails if the
two sets disagree. It compares source text instead of importing the modules,
because importing `palette.stylex.ts` from a test yields `var(--x1jb24h0)`, not
`#6b7280`.

## Routes & entry points

None. No route, loader or action is touched.

| Entry point                                 | Purpose                                                                                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/styles/palette.stylex.ts`              | Layer 1. Imported only by `tokens.stylex.ts`.                                                                                                  |
| `app/styles/tokens.stylex.ts`               | Layer 2. The file a component imports for a colour, size or space. Roughly a third of it has no caller yet — see "Edge cases & known gaps".    |
| `app.css`                                   | Unchanged. Still holds the three `@tailwind` directives and four element rules.                                                                |
| `tailwind.config.ts`                        | Layer 3. Semantic colour aliases in `theme.extend.colors`, so a page still on Tailwind can name a colour the same way a StyleX component does. |
| `app/features/discs/list/OverdueMarker.tsx` | The warning marker the table and its legend both draw. New; it exists so the two cannot drift.                                                 |
| `app/styles/palette.test.ts`                | Fails when the two copies of the palette stop agreeing. Reads both files as text.                                                              |

## Rules & constraints

1. **A token's value is whatever is on screen today.** Every value in the palette
   was read out of the running code or out of `tailwindcss/colors`, not chosen.
   Where a token's value differs from what the code shows today, it appears in
   "User-facing behaviour" as a numbered exception. There are seven of them.
2. **Components import `tokens`, never `palette`.** The palette exists so that
   `gray500` is written down once; a component asking for `palette.gray500`
   instead of `color.textMuted` has skipped the layer that carries the meaning,
   and the next person cannot tell whether it is muted text or a border. The
   same rule applies on the Tailwind side: a page writes `text-fg-muted`, not
   `text-gray-500`. Nothing enforces either — both are review points.
3. **No new hex in a component.** A colour that is not in the palette gets added
   to the palette and given a semantic name first. This is the rule the disc
   table's dark greys broke, and why nobody knew they existed; they are now in
   the palette and the table reads them from there. The rule binds new code. It
   is not yet true of the whole app: the chart palettes, the QR poster's grey and
   one branded cyan are still literals, listed under "Edge cases & known gaps"
   with the reason each was left.
4. **This work adds no dark mode and no theming.** The tokens are a single light
   theme plus one dark surface that happens to be inside it. StyleX's
   `createTheme` would let a second theme override the same variables later; that
   is deliberately out of scope, and the token names are chosen so it stays
   possible (`color.surface`, not `color.white`).
5. **Tailwind stays installed and stays working.** Nothing is converted off it in
   this work. Deleting Tailwind is only possible after the last of the 37 feature
   components has moved, which is a long tail of separate changes.
6. **`app.css`'s element rules stay.** The `p`, `a` and `body` rules are ambient
   styling that StyleX components cannot see and cannot override without
   specificity tricks. They are left alone here and recorded as a gap below.
7. **The two copies of the palette must agree.** `palette.stylex.ts` and
   `tailwind.config.ts` hold the same hex values, and the unit test described in
   "Data" is the only thing that notices when they stop agreeing. Adding a colour
   means adding it in both places; the test failing is the reminder, not a
   review comment.
8. **Verification is by eye, not by test.** There is no visual regression test in
   this project, so "nothing moved" is checked by loading the affected pages.
   The pages worth checking are the disc list (the dark table and its inline
   forms), the owner link page, sign-in, add discs, the notify forms and the
   admin menu on a phone width.

## Edge cases & known gaps

- **The font-size change cannot be verified by the type checker.** Every token
  whose value changed is correct by construction, but `sizeLg` and `sizeXl` kept
  their names and changed their values, so the four call sites listed under
  "Data" had to be found by hand. They were, and nothing else uses those tokens —
  but anyone adding a call site without reading this will silently get the new
  size.
- **`text-gray-300` means two different things.** On the light pages it is a faint
  grey; inside the dark table and the inline forms that open in it, it is the
  normal text colour. The `dark.text` token separates them, but until those
  components are converted off Tailwind the class itself still carries both
  meanings, and a careless find-and-replace across the repo would break one of
  them.
- **The disc table's dark surface is an island.** Five greys that match nothing
  else in the app, for one component. Naming them does not make them part of a
  system — it only makes them visible. Whether the table should be dark at all is
  a design question this work does not answer.
- **`app.css` still styles bare elements.** `p { margin-bottom: 1rem }` and
  `a { text-decoration: underline }` apply to everything, including the inside of
  StyleX components that did not ask for them. A component that wants a
  paragraph without that margin has to override it. Left as is.
- **Tailwind's stock palette is still reachable.** `theme.extend` adds the
  semantic aliases without removing `gray-500` and the rest, so a new page can
  still write `text-gray-500` and nothing will complain. Until the 37 components
  are converted most of them do exactly that. Replacing `theme.colors` outright
  would close the hole, at the cost of breaking all 37 in one change.
- **The palette is duplicated in two files.** `palette.stylex.ts` and
  `tailwind.config.ts` each hold the hex values, because StyleX's hashed variable
  names and its static-only `defineVars` rule leave no way to share one source
  (both attempts are recorded under "Data"). A text-comparing unit test is the
  guard. It catches a value that changed in one file and not the other; it does
  not catch a colour someone decided not to add to either.
- **The three changed values cannot be un-changed selectively later.** Once
  `color.accent` is `blue600`, the ten components using it have moved together;
  the same goes for `accentHover` and `danger`. Reverting one means reverting
  every caller of it, because the whole point is that they share the token.
- **The palette covers the app's brand colours, not every colour in it.**
  Thirteen opaque literals and forty translucent ones are still written in
  components, and they are there on purpose rather than by oversight:

  | Where                                                                      | What                                                                                                | Why it stayed                                                                                                                                                                                                                                             |
  | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `ui/SegmentedBarChart.tsx`                                                 | `segmentColours`, eight hexes                                                                       | A categorical chart palette, picked for contrast and colour-blind separation — the comment above it records the reasoning. It is a data-visualisation concern, not a brand one, and folding it into this palette would lose that. It wants its own group. |
  | `ui/BarChart.tsx`, `ui/SegmentedBarChart.tsx`                              | `'red'`, `'blue'` bar fills                                                                         | The same raw CSS keywords the overdue marker used before scenario 4. They are the most obviously convertible thing left, but converting them changes the statistics charts' colours, which nobody has asked for.                                          |
  | `features/notifications/QrPosterButtons.tsx`, `BinFullQrPosterButtons.tsx` | `#555555`                                                                                           | Poster text, rendered for print rather than for the screen.                                                                                                                                                                                               |
  | `features/messaging/MessageTemplatesPage.tsx`                              | `rgba(2, 208, 232, 0.85)`                                                                           | The cyan ring round the default message template. Translucent and branded — the one leftover that is neither neutral nor explained.                                                                                                                       |
  | `ui/Button.tsx`, `ui/DiscTable.tsx`, the inline forms                      | `rgba(0,0,0,…)` shadows and disabled greys, `rgba(255,255,255,…)` row dividers, `hover:bg-white/10` | Neutral translucency. Nothing about them drifts when the palette changes.                                                                                                                                                                                 |

  So the rule "no new hex in a component" binds new code, and every colour that
  carries the app's identity is now in the palette — but a reader should not
  read that as "there are no literals left".

- **Thirty-two of the seventy-nine tokens are not used by anything yet, and the
  Tailwind aliases are used by nothing at all.** That is the shape of the job —
  the vocabulary has to exist before a page can be converted to it — but it
  should be stated plainly rather than left to be discovered:

  | Group                | Used                  | Unused                                                                                                       |
  | -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ |
  | `color` (34)         | 26                    | `textBody`, `textSubtle`, `accentBorderSubtle`, `link`, `dangerStrong`, `warning`, `success`, `successHover` |
  | `dark` (10)          | 7, all by `DiscTable` | `text`, `textHover`, `border` — they belong to the inline forms, which are still Tailwind                    |
  | `icon` (15)          | 0                     | all of them: `DiscTable`'s row actions are still `text-orange-400 hover:text-orange-300` and the rest        |
  | `space` (7)          | 5                     | `smd`, `xxl`                                                                                                 |
  | `font` (9)           | 6                     | `sizeXs`, `sizeLg`, `weightRegular`                                                                          |
  | `size` (1)           | 1                     | —                                                                                                            |
  | `radius` (3)         | 2                     | `lg`                                                                                                         |
  | every Tailwind alias | 0                     | all of them                                                                                                  |

  `color.success` and `color.successHover` are unused because the save buttons
  they were named for are still `bg-green-700 hover:bg-green-800`; only the
  status box's `success*` tokens found a caller.

  Each unused token exists because a page that is still on Tailwind will need it
  when it converts. Until then they are a promise rather than a fact, and the
  size of this change is not the size of the improvement.

- **The success box is still built twice.** `ui/SuccessNote.tsx` and
  `features/discs/submission/AddDiscsPage.tsx` now draw it from the same three
  tokens, but they still restate the same padding, radius, border width and font
  size around them, and `AddDiscsPage`'s error box has no `ui/` equivalent at
  all. The colours were the part this work could fix; the missing abstraction is
  a `StatusNote` taking a success/error variant, which `SuccessNote`'s two
  existing callers (`EditDiscPage`, `EditMessageTemplatePage`) would also use.
  That is a component refactor, not a token change, and belongs in its own piece
  of work.
- **Three light greys sit on the dark table and are deliberately not unified.**
  The column headings are `#ffffff`, the body text `#dddddd`, and the row icons
  and inline forms Tailwind's `gray300` (`#d1d5db`). The last two are three
  points apart and almost certainly should be one colour. Merging them would
  change what is on screen, which is outside what this work is allowed to do, so
  they keep three token names — `dark.headingText`, `dark.bodyText`, `dark.text`
  — and the decision is left to whoever next touches the table's design.
- **Four components gained a StyleX block for one rule.** `root.tsx`,
  `DiscListPage`, `NotifyForm` and `DiscListIntro` were pure Tailwind and now
  carry a `stylex.create` holding a single style, because their inline
  `style={{…}}` had to go somewhere. That is the right direction but it is not yet a conversion —
  the rest of each file is still Tailwind.

## Open questions

All three questions this spec was written to ask have been answered. They are
kept here as a record of what was decided and why, because the reasoning is not
visible in the code that results.

1. **Should `color.accent` move from Material UI's `#1976d2` to Tailwind's
   `blue600`, and `color.danger` from `#d32f2f` to `red500`?** **Yes, decided.**
   The app ends up with one blue and one red rather than two and three. The cost
   is the visible shade change described in scenarios 2 to 4 of "User-facing
   behaviour"; it was accepted deliberately, so a reviewer seeing the primary
   button change colour is seeing the intended result, not a mistake.
2. **Should the tokens also be mapped into `tailwind.config.ts`'s
   `theme.extend`?** **Yes, decided** — as semantic colour aliases, not as shared
   variables. Sharing the actual values turned out to be impossible in StyleX
   0.19 for the two reasons recorded under "Data", so what is left is a shared
   vocabulary over duplicated values. That is still worth having: it is what
   makes each later page conversion a rename rather than a re-derivation, and the
   `text-gray-300` ambiguity is the proof that re-derivation is the expensive
   part.
3. **Is `dark500` (`rgb(63, 60, 60)`) intentional?** **Unknown, and left exactly
   as it is.** The original reason is not recorded and nobody now remembers it,
   so the token keeps the value character for character rather than being tidied
   into a neutral grey — changing it would be a design decision taken by
   accident. Worth revisiting if the dark table is ever redesigned.
4. **Should the Material UI status triads — the green "it worked" and red "it
   failed" boxes — move to Tailwind too?** **Yes, decided**, after measuring
   each of the six values against its nearest Tailwind shade rather than
   assuming they were close. Five of the six are between 2.7 and 9.4 ΔE; only
   the success border, at 12.5, is a change a person would notice. The triad has
   to move as a unit, so that one border was the price of the other five and of
   deduplicating a triad that had been copied into two files.

   The same measurement is why `#8a6100` did **not** move: at 26.8 ΔE from
   `amber700` it is a different colour, and swapping it would have been a design
   change disguised as a rename. Measuring first is what separated the two
   cases; by eye they look like the same kind of problem.
