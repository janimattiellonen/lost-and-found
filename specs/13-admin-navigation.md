# Admin navigation menu

> Status: as-built (describes what exists today, not a wishlist)
>
> Writing rules — reader who does not know this codebase, every abbreviation
> explained on first use, plain words over jargon, as long as the subject needs.
> See `.claude/skills/specs/SKILL.md`.

## Purpose

Every admin page of the app is reached from one bar of links at the top of the
window: the disc list, adding discs, the message templates, the statistics and
so on, plus signing out. Two of those links also carry a count, because they are
the only place an admin learns that something is waiting for them — an owner has
answered about their disc, or a disc has to be fetched from storage.

The bar has to work on a phone, which is where the club's admins actually use
this app: standing at a course with one hand free. On a narrow screen the flat
row of eight links wrapped onto three or four lines and pushed the page content
below the fold, so below 768 pixels the links move into a panel behind a
hamburger button (the three-line icon that opens a menu).

## Actors

Club admin — a signed-in user. Nobody else ever sees this menu: `AdminMenu`
returns nothing at all when there is no signed-in user, and `app/root.tsx`
additionally leaves it out on the `/notify*` paths for anonymous visitors.

## User-facing behaviour

Shared by both screen widths:

1. When a signed-in admin loads any page, then the menu shows one link per admin
   page — "Kiekot" (discs), "Lisää kiekkoja" (add discs), "Vastaukset" (owners'
   answers), "Tyhjennysloki" (emptying log), "Viestipohjat" (message templates),
   "Statistiikka" (statistics), "Ilmoitukset" (notifications), "Noutolista"
   (retrieval list) — and a "Kirjaudu ulos" (sign out) button.
2. When a counted item has something waiting, then its label carries the number
   in parentheses — "Vastaukset (3)". At zero the number is left off entirely,
   because "(0)" reads as something to act on. "Vastaukset" is absent when nobody
   is signed in and "Noutolista" when the club keeps no retrieval list; both
   counts arrive from the loader in `app/root.tsx` as `null` in that case.
3. When the admin is on the page a link points to, then that link is marked as
   the current page for a screen reader (`aria-current="page"`) as well as
   visually.
4. When the admin presses "Kirjaudu ulos", then the browser asks for confirmation
   ("Haluatko varmasti kirjautua ulos?" — do you really want to sign out?) and
   only then signs out.

From 768 pixels wide upwards (the desktop layout):

5. The links sit in one horizontal row with the sign-out button pushed to the
   right edge. There is no hamburger button.

Below 768 pixels (the phone layout):

6. The bar holds a single hamburger button on the right. The links are not in the
   page at all until it is pressed — not merely off-screen, so a screen reader or
   the Tab key cannot reach them either.
7. When something is waiting on a counted page, then the hamburger button carries
   a small round badge with the total of the two counts, and its accessible name
   says so: "Avaa valikko, 3 odottaa käsittelyä" (open menu, 3 awaiting
   handling). Without the badge the counts would be invisible while the menu is
   shut, which is the whole reason those two links carry numbers.
8. When the admin presses the hamburger, then a panel slides in from the right
   over the page, holding the title "Valikko" (menu), a close button, the same
   links one per row, and the sign-out button. The rest of the page dims behind
   it and, for as long as the panel is open, cannot be scrolled, clicked, tabbed
   into or reached by a screen reader's cursor.
9. When the panel is open, then keyboard focus is inside it: it moves to the
   close button, Tab and Shift+Tab cycle within the panel, and focus that is
   somehow outside it is pulled back in on the next Tab. Escape closes it.
10. When the admin follows a link, presses Escape, presses the close button, taps
    the dimmed area, or navigates with the browser's back button, then the panel
    closes — and focus goes back to the hamburger button from every one of those,
    so a keyboard user is never dropped at the top of the document. Focus that
    has meanwhile moved somewhere deliberate is left alone; only focus dropped on
    the document itself is rescued. The panel is never left open over a page the
    admin has already navigated away from.

## Data

None of its own. It renders what `app/root.tsx` gives it:

| Prop             | Type                         | Meaning                                                                                                                     |
| ---------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `user`           | Supabase user or `undefined` | Renders nothing unless this has an `email`.                                                                                 |
| `supabase`       | browser Supabase client      | Used only for `auth.signOut()`.                                                                                             |
| `responseCount`  | `number \| null`             | Owners' answers not yet dealt with; `null` when nobody is signed in, and the "Vastaukset" link is then left out.            |
| `retrievalCount` | `number \| null`             | Discs waiting to be fetched from storage; `null` when this club keeps no retrieval list, and "Noutolista" is then left out. |

The counts come from `loadResponseCount` and `loadRetrievalCount`, both called in
the root loader on every navigation, so they are as fresh as the current page.

## Routes & entry points

The menu owns no route. It is rendered by `app/root.tsx` above every page, and
its links point at routes owned by other features:

| Link           | Route                | Spec                                 |
| -------------- | -------------------- | ------------------------------------ |
| Kiekot         | `/`                  | [01](01-public-disc-list.md)         |
| Lisää kiekkoja | `/discs/add`         | [02](02-disc-submission.md)          |
| Vastaukset     | `/vastaukset`        | [05](05-owner-link-and-responses.md) |
| Tyhjennysloki  | `/emptying-log`      | [08](08-emptying-log.md)             |
| Viestipohjat   | `/message-templates` | [06](06-messaging-and-templates.md)  |
| Statistiikka   | `/stats`             | [10](10-statistics.md)               |
| Ilmoitukset    | `/notifications`     | [07](07-notifications.md)            |
| Noutolista     | `/retrieval`         | [03](03-disc-lifecycle-actions.md)   |

## Rules & constraints

- **The menu is not authorization.** Hiding a link hides nothing: every route
  above checks the session itself, and the database's row level security (RLS —
  the PostgreSQL feature that decides row by row whether a role may read or write
  it) is what actually stops an anonymous request. See
  [11](11-auth-and-authorization.md).
- **One breakpoint, 768 pixels**, expressed as `@media (min-width: 768px)` in the
  StyleX styles. Below it the links exist only inside the panel; from it up only
  in the bar. There is no width at which both are present, so a link is never
  reachable twice by the Tab key.
- **The panel is a modal dialog** — `role="dialog"`, `aria-modal="true"`,
  `aria-label="Valikko"` — and is mounted only while open. Mounting rather than
  hiding with a transform is deliberate: a panel that is merely translated
  off-screen keeps its links in the tab order and in the screen reader's
  document, which is the bug this replaces. The hamburger's `aria-controls`
  points at the panel's id only while the panel is mounted, for the same reason:
  a reference to an id that is not in the page is worse than no reference.
- **The page behind the panel is made `inert`** — the HTML attribute that takes
  an element and everything inside it out of reach: no clicks, no Tab, and no
  screen-reader cursor either. Every child of `<body>` that does not contain the
  panel or its backdrop gets the attribute while the panel is open. `aria-modal`
  asks a screen reader to stay inside the dialog; `inert` is what actually
  enforces it, and it is also what stops a pointer reaching the bar behind.
- **Page scrolling is blocked** while the panel is open by setting
  `document.body.style.overflow = 'hidden'`. On closing, the value that was there
  before is put back rather than blanked, so the lock cannot quietly discard an
  `overflow` some other component had set. The undoing also runs when the
  component unmounts, so signing out from inside the panel cannot leave the next
  page permanently unscrollable.
- **Everything the panel does to the rest of the page is undone in one place**,
  in a fixed order: the background stops being inert, the scroll lock is
  released, and only then does focus go back to the hamburger — focusing a button
  that is still inert would silently do nothing. Nothing is done about the scroll
  _position_; it is never moved, so it needs no restoring.
- **Touch targets in the phone layout are at least 44 by 44 pixels** (the
  hamburger, the close button, each link row), the smallest size that is reliably
  hittable with a thumb.
- The panel slides in with a CSS animation on mount. Closing is immediate: an
  exit animation would mean keeping the panel mounted after it is logically shut,
  which is exactly what the tab-order rule above forbids.

## Edge cases & known gaps

- Closing has no animation, for the reason given above. It looks slightly abrupt
  next to the slide-in.
- The scroll lock is `overflow: hidden` on `<body>`. Older iOS Safari can still
  rubber-band the page behind the panel; the sturdier fix (fixing the body and
  restoring `scrollY` on close) was not worth its complexity here.
- `inert` is supported by every current browser but was only widely available
  from 2023. On something older the fallbacks are what remain: `aria-modal`, the
  backdrop over the page, and the links behind the panel being `display: none`.
- The end-to-end (E2E) test for the phone layout needs a real admin account and
  skips itself unless `E2E_EMAIL` and `E2E_PASSWORD` are set, like the other
  signed-in E2E tests. There is no unit test, because this repo has no test setup
  for rendering React components.
- **Widening the window past 768 pixels is the one close path that returns focus
  nowhere.** The panel closes as it should, but at that width the hamburger is
  `display: none`, so focusing it does nothing and focus stays on the document —
  the outcome the rule above otherwise avoids. Nobody resizing a window with a
  mouse is likely to notice; nothing was added for it.
- **The `inert` background is decided once, when the panel opens.** The children
  of `<body>` are read at that moment, so an element added to `<body>` while the
  panel is open is never made inert, and closing only clears the ones that were.
  In practice nothing does that here — navigating closes the panel — but the rule
  above is stated as if it held for the whole time the panel is open, and it does
  not.
- Nested menu items are deliberately out of scope: no admin page has children.

## Open questions

None.
