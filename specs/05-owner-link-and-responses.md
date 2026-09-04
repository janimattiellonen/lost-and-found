# Owner link & owner responses

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
An owner who gets an sms about a lost disc answers in one tap, instead of the
admin reading a free-text reply and writing it down. The link in the message
opens a page for that one disc where the owner says whether they want it back
and how, and gives a postal address if it is to be posted. Answers land in the
admin's inbox at `/vastaukset`. Background: `docs/getting-a-disc-back-to-its-owner.md`.

## Actors
- **Anonymous owner** — holds the link from the sms. No account, no login.
- **Club admin** — signed in, reads and clears the inbox.

## User-facing behaviour
1. Owner opens `/kiekko/<token>` → sees colour, disc name, manufacturer and the
   last four digits of their phone number ("Puhelinnumero ****1234"), under
   "Löytynyt kiekkosi" (your found disc).
2. Owner picks "Kyllä, haluan kiekon takaisin" (yes, I want it back) or "Ei,
   seura saa pitää kiekon" (no, the club may keep it).
3. Choosing "yes" opens the handover options the disc's *location* allows —
   "Postita kiekko minulle", "Noudan kiekon – sovitaan noudosta erikseen",
   "Noudan kiekon seuran kopilta" (post it / I'll collect it / I'll collect it
   from the club's koppi).
4. Choosing post shows the postage fee, the MobilePay payee, the club's optional
   voluntary payment, and the five address fields; submitting stores them.
5. Ticking "Minulla on useampia kiekkoja" (I have several discs) unmounts the
   address fields — the answer is submitted with no address and the page says
   the club will be in touch.
6. Collecting from the admin names only the district ("Kiekon voi noutaa Espoon
   Lintuvaarasta") and promises a message; collecting from the koppi asks
   nothing further.
7. After a submit: "Kiitos vastauksesta!" plus a link back to the same page —
   answering again is how a choice or a typo is changed.
   - An answer of "I want it back" that asks for post or for collection from
     the admin also puts the disc straight onto the admin's retrieval list
     (spec 03), so the admin does not have to copy it across. The
     owner sees no sign of this; the page says the same thing either way.
     Collecting from the koppi puts nothing on the list — the disc stays where it
     is and the owner comes to it — and neither does giving the disc up.
8. A token that is unknown, malformed, belongs to another club, or names a disc
   already returned / released / archived → "Linkki ei ole enää käytössä" (this
   link is no longer in use), with the club's contact email. Same screen for all
   of them, so a guess learns nothing.
9. Admin opens `/vastaukset` ("Omistajien vastaukset") → unhandled answers,
   newest first: disc, choice, method, owner name, tappable phone number, the
   address if there is one. "Merkitse käsitellyksi" (mark as handled) asks for
   confirmation, removes the card and **wipes the address**.
10. The admin menu item reads "Vastaukset (3)" while answers are unhandled; the
    count disappears at zero and the item is absent when signed out.

## Data
**`discs.owner_link_token uuid`** — NOT NULL, unique, `default gen_random_uuid()`,
backfilled. Deliberately *not* `external_id`: this is a credential and can be
rotated with one UPDATE to kill every link already sent.

**`disc_owner_responses`** — one row per answer, append-only in practice; the
latest row wins.

| Column | Notes |
|---|---|
| `disc_id` | FK to `discs`, ON DELETE CASCADE |
| `responded_at` | default `now()` |
| `choice` | 0 = gives the disc up, 1 = wants it back (`app/features/discs/ownerResponse/ownerChoice.ts`) |
| `handover_method` | 0 post, 1 collect from admin, 2 collect from koppi; NULL iff `choice = 0` |
| `has_more_discs` | boolean, only ever true for post |
| `shipping_name / _street / _postal_code / _city / _country` | nullable; only for post. NULL country means Finland |
| `shipping_cleared_at` | when the address was wiped |
| `handled_at` | NULL = still in the inbox; drives the menu count |

**`clubs.stores_discs_offsite`** — boolean, true for club 2 (Talin Tallaajat).
What `disc_is_in_storage()` reads.

CHECK constraints: choice in (0,1); method in (0,1,2) or NULL; `(choice = 1) =
(handover_method IS NOT NULL)`; post ⇒ street **or** wiped **or**
`has_more_discs`; an address only ever with post; `has_more_discs` only with
post; and the address length limits below.

Not enforced by the schema: nothing stops two answers for one disc (deliberate).
An answer never becomes a `discs` update — the club's own decisions stay the
admin's to make. It does become a `disc_retrievals` row, which is a to-do item
for the admin rather than a fact about the disc: see "Rules & constraints" below
and spec 03 for the shape.

## Routes & entry points
| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/kiekko/:token` | GET, POST | none — the token is the permission | The owner's page and its submit |
| `/vastaukset` | GET, POST | signed in (redirect `/sign-in`) | The inbox; POST marks one answer handled |

`GET /kiekko/:token` sends `Referrer-Policy: no-referrer` and
`X-Robots-Tag: noindex, nofollow` so the token leaks into neither a `Referer`
header nor a search index.

Database entry points, both `SECURITY DEFINER`, `REVOKE ALL FROM PUBLIC` and
`GRANT EXECUTE ... TO anon, authenticated`:

- `owner_link_disc(p_token uuid, p_club_id bigint)` — returns name, colour,
  manufacturer, the last four **digits** of the phone number (separators
  stripped first), and `in_storage`. No row for a returned / released / archived
  disc, or one of another club.
- `submit_owner_response(p_token, p_club_id, p_choice, p_handover_method,
  five address params, p_has_more_discs)` — inserts one row; every failure
  raises the same `unknown token`.

`disc_is_in_storage(bigint)` is revoked from PUBLIC and granted to nobody; it is
only called from inside those two.

## Rules & constraints
- **The link is the whole permission.** No expiry — an owner may answer weeks
  later. Its power ends with the disc's state instead: returned, released or
  archived and the page stops working.
- **`anon` has no policy at all on `disc_owner_responses`** (`docs/rls.md`).
  `SUPABASE_KEY` is the anon key and is in every page's source, so an INSERT
  policy would let anyone spray answers at enumerable `disc_id`s. The one way in
  is the function, which resolves the token itself.
- **Club scoping.** Both clubs share one database; each deployment passes its
  own `APP_CLUB_ID` as `p_club_id`, so a Talin token opened on the Puskasoturit
  deployment is simply not found. Every admin query joins `discs!inner` and
  filters `club_id`.
- **The retrieval row is created inside `submit_owner_response()`, in the same
  transaction as the answer.** Not from the route, and not by giving
  `anon` any privilege on `disc_retrievals` — the table still has no `anon`
  policy. Doing it in the function keeps the two writes atomic: an answer that
  says "post it to me" and no matching errand would be exactly the failure the
  feature exists to prevent, and a half-written pair is worse than neither.
  Which answers create a row (`choice = 1` and `handover_method` 0 or 1), and
  what happens when the disc is already on the list, are specified in spec 03.
- **An answer still changes nothing about the disc itself.** The row
  it may create is the admin's errand, not a decision: `can_be_sold_or_donated`,
  `is_returned_to_owner` and `return_method` stay the admin's to set, with the
  answer as evidence beside them. A forwarded link can therefore add a trip to
  the admin's list, which is visible and reversible, but cannot take a disc off
  the public list or mark it returned.
- **The page never renders a stored address back.** A forwarded link must not
  read out someone's home address; a typo is fixed by answering again.
- **Handover options come from the disc's location, not its club.**
  `handoverMethodsFor(isInStorage)` adds method 2 only while
  `disc_is_in_storage()` is true. Enforced three times: the page renders only
  the allowed options, `parseOwnerResponse` refuses a method outside `allowed`,
  and `submit_owner_response` refuses method 2 for a disc not in storage.
- **Address length limits, in three places, and the DB one is the boundary.**

  | Field | Max | Client label |
  |---|---|---|
  | `shippingName` | 100 | Nimi |
  | `shippingStreet` | 150 | Katuosoite |
  | `shippingPostalCode` | 16 | Postinumero |
  | `shippingCity` | 60 | Postitoimipaikka |
  | `shippingCountry` | 60 | Maa |

  `ADDRESS_LIMITS` in `app/features/discs/ownerResponse/parseOwnerResponse.ts`
  supplies both the input `maxLength` (stops typing) and the server-side check
  (names the offending line: "Katuosoite on liian pitkä – enintään 150
  merkkiä."). Neither is the boundary: `submit_owner_response()` is granted to
  `anon`, so a token holder can call it directly with the public anon key and
  never pass through the parser. The `owner_response_address_lengths` CHECK from
  `20260904020000_owner_response_address_limits.sql` is what an anonymous caller
  cannot get around. Change all three together.
- Length is measured after trimming. A posting requires name, street, postal
  code and city; country is optional. A Finnish postal code (country empty,
  "suomi", "finland" or "fi") must be exactly five digits; anywhere else any
  non-empty value passes.
- The signed-in inbox is the only place that reads a full phone number or an
  address. The menu count is a `head: true` count — it reads neither.

## Edge cases & known gaps
- **The address wipe fires on "marked handled", not on "posted"** — the only
  event the app has. Marked too early and the label data is gone; never marked
  and the address is kept indefinitely (open question 7 of the doc).
- An answer changes nothing about the disc. Nothing on the public list shows
  that an owner has answered, and a "gives it up" answer does not release the
  disc — the admin still marks it. True of `discs` only; the answer may add a
  `disc_retrievals` row.
- The two tables can disagree and nothing reconciles them. An owner
  who answers "post it", then answers again "I'll collect it from the koppi",
  leaves two answers in the inbox and one open retrieval row that the second
  answer does not remove — a row is only ever created or updated, never
  withdrawn. The admin closes it with "Merkitse noudetuksi" (mark as fetched) or
  leaves it; there is no "this was a mistake" action anywhere in the feature.
- `disc_is_in_storage()` is false as soon as *any* retrieval row has a
  `retrieved_at`, and nothing records a disc going back. A disc fetched, not
  collected and returned to the koppi reads as out of it for good.
- The reverse race: an owner answers "I'll collect it from the koppi" and the
  disc is fetched home afterwards. Their answer names a place the disc has left;
  only the admin sees it.
- Marking handled with an id from another club is a silent no-op — the read is
  club-scoped and a missing row returns `not-found`, which the route ignores.
- The inbox has no history view: a handled answer is gone from the UI, and only
  unhandled rows are ever queried.
- A row whose `choice` is outside the enum is dropped from the list rather than
  rendered as a blank card.

## Open questions
Carried from `docs/getting-a-disc-back-to-its-owner.md`: when exactly a shipping
address is wiped (7); whether the page hands out the admin's full address for a
collection (6); whether the page lists an owner's other discs (8); whether an
answer should ever create a retrieval row by itself (2 — reopened and decided
"yes" on 2026-09-04, and implemented in
`20260904020000_owner_answer_creates_retrieval.sql`).

New with that decision: whether answering a second time should be able to take a
disc back **off** the retrieval list, and whether the answers inbox should show
that a card already has an open errand attached so the admin does not fetch the
same disc twice.
