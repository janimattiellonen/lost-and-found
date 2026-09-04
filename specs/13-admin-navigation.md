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
   it and cannot be scrolled or clicked.
9. When the panel is open, then keyboard focus is inside it: it moves to the
   close button, Tab and Shift+Tab cycle within the panel and never reach the
   page behind, and Escape closes it. On closing, focus returns to the hamburger
   button, so a keyboard user is not dropped at the top of the document.
10. When the admin follows a link, presses Escape, presses the close button, or
    taps the dimmed area, then the panel closes. It also closes by itself
    whenever the address changes — including the browser's back button — so it is
    never left open over a page the admin has already navigated away from.

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
  document, which is the bug this replaces.
- **Page scrolling is blocked** while the panel is open by setting
  `document.body.style.overflow = 'hidden'`, cleared when the panel closes and
  also when the component unmounts, so a sign-out mid-panel cannot leave the page
  permanently unscrollable.
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
- The link list is written twice, once for the bar and once for the panel, from
  the same `menuLinks()` data. The two could drift; there is no test that they
  hold the same labels.
- The end-to-end (E2E) test for the phone layout needs a real admin account and
  skips itself unless `E2E_EMAIL` and `E2E_PASSWORD` are set, like the other
  signed-in E2E tests. There is no unit test, because this repo has no test setup
  for rendering React components.
- Nested menu items are deliberately out of scope: no admin page has children.

## Open questions

None.
