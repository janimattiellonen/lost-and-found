# Getting a disc back to its owner

Status: **2026-09-03.** Written because the pieces — the retrieval list, the
owner-facing flag page, and the existing return and disposal marks — turned out
to overlap, and the overlap is where the mistakes would be.

Built in PR #79, behind four migrations, **all applied 2026-09-04**:

- the retrieval list ("Noutolista"), as `disc_retrievals`
- one shared handover method (section 5), replacing the retrieval list's own
  two-value enum
- `discs.owner_link_token`, `disc_owner_responses`, and the flag page at
  `/kiekko/<token>`
- `[link]` as a message-template token, beside `[disc]` and `[colour]`
- the admin's page of answers at `/vastaukset`
- `clubs.stores_discs_offsite`, which is what section 1's table now lives in

Also built, after the first review: `has_more_discs` (section 10b), and
`p_club_id` on both owner-facing functions, so a token only resolves against the
club whose deployment it was opened on.

Not built: the section 10 renaming of `disc_retrievals`, `discs.return_method`
gaining the third value, anything that turns an answer into a retrieval-list row
by itself, and any sign on the disc list that an owner has answered — which
section 8 asks for and nothing yet does. Open questions 1, 5, 6, 7, 8 and 9 are
open; 2, 3 and 4 are decided and say so below.

## 1. Where a disc physically is

Two clubs, two starting points:

| Club            | `APP_CLUB_ID` | A newly found disc sits   |
| --------------- | ------------- | ------------------------- |
| Puskasoturit    | 1             | at the admin's house      |
| Talin Tallaajat | 2             | in the club's own storage |

A Talin Tallaajat disc can move: the admin fetches it from the storage to his
house. That move is the only one the app records. Nothing ever moves the other
way.

**This is the fact everything else hangs off.** The club is not what decides
what an owner may choose — the disc's current location is. Puskasoturit needs no
special case anywhere; its discs are simply always already at the house.

## 2. The stakes, and what the page shows

Worth stating before any of the design, because it is what keeps the design
proportionate. This feature exists so an owner can tell the admin, in one tap,
whether they want their disc and how. That is all it does.

The flag page shows:

- the disc: colour, name, manufacturer
- the last four digits of the owner's phone number, so they recognise the disc
  as theirs

**Every one of those is already on the club's public disc list**, which needs no
link and no login and additionally shows the owner's name, the date and the
course. On the read side the flag page therefore leaks nothing — it shows
strictly less than the front page of the site.

What it deliberately does not show: the owner's name, the club-internal notes in
`additional_info`, the full phone number, and any address previously submitted
through it.

On the write side, an answer is acted on by hand. A forged answer costs the admin
a puzzled phone call, not a disc.

So the security story is short: an unguessable link, a write that requires
holding it, and an address that only ever travels inward. See section 12 for the
guard that was considered and left out, and why.

## 3. Vocabulary

- **Return request** — the owner has said they want the disc back, and how. It
  may arrive as an sms reply the admin transcribes, or from the flag page.
- **Handover method** — how the disc is to get back to its owner: by post, the
  owner collects it from the admin's house, or the owner collects it from the
  club's storage.
- **Fetch** — the admin bringing a disc from the club's storage to his house.
  Only ever needed for a Talin Tallaajat disc still in the storage, and only
  when the handover method is post or collect-from-house. This is what the
  "Noutolista" page is a list of.
- **Shipping details** — the address a posted disc goes to. Needed only for
  handover method 0, and only until the parcel is sent.
- **Return** — the handover itself: the disc is with its owner. Already recorded
  in `discs.is_returned_to_owner`, `returned_to_owner_date`, `return_method`.
- **Disposal** — the club releasing the disc for sale or donation. Already
  recorded in `discs.can_be_sold_or_donated` and its date and method. Happens
  when the owner gives the disc up, or after roughly three months of silence.

A return request, a fetch and a return are three separate events, days or weeks
apart. Conflating any two of them is the failure mode this document exists to
prevent.

## 4. What the owner may choose

When the owner wants the disc back, the options depend on **where the disc is**:

| Disc is                                                                    | Options                                                                 |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| At the admin's house (all Puskasoturit discs; Talin discs already fetched) | by post · collect from the admin's house                                |
| In Talin Tallaajat's storage                                               | by post · collect from the admin's house · **collect from the storage** |

The owner may also give the disc up, from either location.

Consequences:

- **Collect-from-the-storage needs no fetch.** The disc never comes to the
  house, so such a request must not put anything on the Noutolista. This is the
  case that rules out treating "the owner asked for it" and "I must fetch it" as
  one thing.
- **The options are computed, not configured per club.** One rule, from the
  disc's location.
- Once a disc has been fetched, collect-from-the-storage is no longer offered
  for it: it isn't there any more.
- **Post needs an address; collecting needs one from the admin.** Whichever way
  the disc goes, one side has to tell the other where to be — see section 6.

## 5. The enums, and their numbers

One handover method, used by the owner's answer, by the request, and by the
record of what happened:

| Value | Meaning                           | Finnish                                |
| ----- | --------------------------------- | -------------------------------------- |
| 0     | By post, sent by the admin        | Postitus / Postitettu                  |
| 1     | Collected from the admin's house  | Nouto (minulta) / Noudettu             |
| 2     | Collected from the club's storage | Nouto varastolta / Noudettu varastolta |

`discs.return_method` already stores 0 and 1 with exactly these meanings, so it
gains 2 and its CHECK constraint is widened. Existing rows keep their meaning; a
historical `1` says "collected", without saying from where, which is all the
Google Sheet ever recorded.

A **fetch** can only be needed for methods 0 and 1, which a CHECK constraint on
the request table can state outright.

The owner's other answer — giving the disc up — is a choice, not a method:
`0 = gives it up`, `1 = wants it back`.

## 6. The address either way round

**If the owner chooses post**, they should give the shipping details on the same
page, in the same visit — that is the whole reason the link is worth having.
Otherwise the answer arrives and the admin has to go back to sms to ask "where
do I send it", which is the round trip this feature exists to remove.

Fields, structured rather than one free-text block, because they end up copied
onto a parcel and a wrong postal code means it comes back:

| Field          | Notes                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| recipient name | Defaults to nothing; the disc's `owner_name` is often only a first name         |
| street address |                                                                                 |
| postal code    | Five digits for Finland; validated loosely, since an address abroad is possible |
| city           |                                                                                 |
| country        | Optional, assume Finland when empty                                             |

An address is the one thing here that is not already public — data the owner
gives the club, rather than data the club already prints on its front page. So
these three rules, all of which follow from the link being forwardable:

1. **The page must never render a previously submitted address back.** Anyone
   holding a forwarded link would otherwise be able to read the owner's home
   address off it. This is the whole reason the token needs no further guarding:
   there is nothing else behind it worth reading. A typo is corrected by answering again — answers are
   append-only and the latest wins — not by showing the old value in a form.
2. **The address is deleted once it has served its purpose.** It is needed to
   write a parcel label and for nothing else afterwards, and the database should
   not become a standing list of members' home addresses. **What is built wipes
   it when the answer is marked handled on `/vastaukset`** — the only event the
   app has. That is not quite the event this rule wants, and an answer never
   marked keeps its address indefinitely; open question 7 is where that gets
   settled, and until it does this rule is honoured by habit rather than by the
   code.
3. **It is never part of any public payload.** Only the admin pages see it,
   like the full phone number.

**If the owner chooses to collect**, the admin's own address has to reach them.
Whether the page shows it automatically is **deliberately undecided** (open
question 6). The thing to weigh: a page reachable by anyone holding the link
makes that address exactly as private as the link is, and the link travels by
sms and gets forwarded.

## 7. What is stored where

**`discs`** — what is true of the disc itself.

- Existing: the return mark, the disposal mark, `archived_at`.
- `return_method` widened to allow 2.
- **New, proposed:** `location` (0 = club storage, 1 = admin's house), defaulted
  per club when the disc is created, set to the house when a fetch is recorded.
  This is a property of the object, not a workflow stage, which is why it
  belongs here. See open question 3.
- **New, proposed:** `owner_link_token uuid`, unique, `default gen_random_uuid()`
  and backfilled the way `external_id` was — what the flag-page link is built on:
  `/kiekko/<token>`.

  Deliberately not `external_id`. That one is an identifier: it is in admin URLs,
  every disc resource route accepts it, and `message_log` rows reference it, so
  it cannot be rotated without orphaning a disc's message history. A link is a
  credential, and a credential that can never be rotated is not one. A separate
  column costs a column and makes killing a leaked link a one-line UPDATE.

  Holding the token permits exactly two things: reading what section 2 lists, and
  writing one row in `disc_owner_responses` for that disc. No expiry — an owner
  may answer three weeks later, and a dead link means a phone call, which is the
  thing this feature removes. Its power ends with the disc's own state instead:
  the page stops accepting answers once the disc is returned, released or
  archived, and says so.

**`disc_return_requests`** — one row per "the owner wants this disc back".
(Built in PR #79 as `disc_retrievals`; see section 10.)

- `disc_id`, `requested_at`, `handover_method`
- `fetched_at` — when the admin brought it home from the storage. NULL when not
  fetched, and NULL for ever on a request that needs no fetch.
- `owner_response_id` — the answer this came from, NULL when the admin
  transcribed an sms.
- At most one open request per disc, enforced by a partial unique index.

**`disc_owner_responses`** — one row per answer from the flag page. Append-only,
anonymous INSERT, authenticated SELECT — the shape `disc_found_notifications`
already uses.

- `disc_id`, `responded_at`, `choice`, `handover_method` (only when the choice
  is "wants it back")
- the shipping fields from section 5, only when the handover method is post — a
  CHECK can state that much: no address without post, and no post without an
  address
- An owner may answer twice; both rows stay, the latest wins.
- **An answer never writes to `discs`.** `discs` holds every owner's phone
  number, and one forwarded link must not be able to take a disc off the public
  list. A "gives it up" answer is evidence for the admin's own disposal mark,
  not the mark itself.

## 8. The pages

- **Noutolista** — what needs fetching from the storage: open requests, disc
  still in the storage, handover method 0 or 1, not yet fetched. Talin
  Tallaajat only; the query is empty by construction for a club whose discs are
  all at the house.
- **A to-do list of open requests** — every open request, whichever club and
  whichever method, so the admin can see what he owes people. Useful to both
  clubs. See open question 1.
- **The flag page** — no login, reached from the sms link, for both clubs. Shows
  the disc and the last four digits of the owner's phone number, and offers the
  options from section 3. Each option carries what it asks of the owner, inside
  the option itself: posting shows the fee, how to pay it and the address
  fields; collecting from the admin names the district and promises a message.
  A contact address closes the page, and the dead-link screen too.
- **The disc list** — where an answer is acted on: mark returned, or mark for
  sale or donation. Should show that an owner has answered, and what they said.

## 9. Rules

1. An owner's answer is untrusted input. It is recorded, and the club acts on it.
2. `anon` never writes to `discs`, never reads a full phone number, and never
   reads back an address it once wrote.
3. A request needing no fetch never appears on the Noutolista.
4. A fetch is not a return. A return is not a disposal.
5. Marking a disc returned, released or archived closes its open request by
   making it irrelevant — every list filters on the disc's own state, so nothing
   has to be ticked off twice.
6. The options offered come from the disc's location, never from its club.
7. **Whether a club keeps a retrieval list is a hardcode, and stays one.**
   `isRetrievalListEnabled()` in `~/config/clubs` answers `club === TALIN`,
   while `clubs.stores_discs_offsite` says the same thing in the database, where
   `disc_is_in_storage()` reads it. Two facts, one truth, kept deliberately: the
   gate decides whether to render a page and a menu item on every request, and
   reading a column for that costs a query on every page load. What it can drift
   into is a menu item, never a wrong option offered to an owner — rule 6 holds
   regardless, because the options come from `disc_is_in_storage()`.

## 10. What this costs PR #79

The retrieval list is built and passing, with `disc_retrievals`. The migration
is **not applied**, so this is all still free to change:

- `disc_retrievals` → `disc_return_requests`: the row means "the owner asked for
  this disc", and a fetch is one optional step in it.
- `retrieval_method` → `handover_method`, with the third value.
- `retrieved_at` → `fetched_at`, and a CHECK that only methods 0 and 1 may have
  one.
- `requested_by` is **gone as of 20260904010000**, which is what this document
  claimed before it was true: the column survived the reshape and every row held
  0 (the club). An owner's answer is a row in `disc_owner_responses`, not a
  retrieval anyone asked for, so provenance would be `owner_response_id` — still
  not built, and nothing needs it while an answer is acted on by hand.
- The row action in the disc list offers three options rather than two, and
  offers the third only for a disc still in the storage.

## 10b. An owner with several discs waiting

The prompt asked for the discs to be listed and the postage to grow with the
count. **The first version does neither, on purpose.** The posting option opens
with one checkbox — "minulla on useampia kiekkoja" — and ticking it submits the
answer without an address, saying only that the club will be in touch.

Why: listing the owner's other discs means matching owners by a free-text phone
number (`050-123 45 67`, `+358 50 …`), widening what one leaked link exposes
from a disc to a person's whole set, and a submit that must re-derive the owner
server-side and refuse ids that are not theirs. The tiered postage is the easy
half; the basket is not. Against that, the admin sends one message and settles
it — which is what happened before this page existed.

What that leaves for later, if the messages get tiresome: the sibling lookup
(question 8), and `postageFeeCents(count)` in `~/config/shipping`, whose
`formatPostageFee` already takes an amount for exactly that reason.

## 11. Open questions

1. **Is there one list or two?** The Noutolista as specified is "what to fetch
   from the storage". Do you also want a list of every open request — including
   the ones you only have to post from home, which is all of Puskasoturit's —
   or is the disc list enough for those?
2. ~~**Does an owner's "I want it back" create the request row by itself**, or
   land as an answer you confirm first?~~ **Decided for the first version:** it
   lands as an answer, on `/vastaukset`, and the admin acts. A stray click then
   cannot send anyone to the storage for nothing, and nothing an owner submits
   changes what the public list shows. Revisit once there is a feel for how many
   answers arrive and how many are acted on unchanged.
3. ~~**Is `discs.location` a stored column or derived?**~~ **Decided for the
   first version: derived**, by `disc_is_in_storage(disc_id)` — the club keeps a
   storage (`clubs.stores_discs_offsite`) and no fetch of this disc has been
   recorded. No `discs.location` column, so nothing can drift; the known gap
   stays, that a disc taken home straight from the bin without a request still
   reads as being in the storage. The cost of that gap is one owner offered a
   collection from a storage the disc has left, which the admin sees on the
   answer and can sort out by message.
4. ~~**Should "collected from the storage" (2) be offered when the disc has an
   open request already fetched?**~~ **Answered by section 5's derivation: no,
   and in two places.** `disc_is_in_storage(disc_id)` is false as soon as a
   retrieval row has a `retrieved_at`, so the option is absent from the owner's
   page; `submit_owner_response` refuses method 2 for a disc that is not in the
   storage, so a page left open before the fetch cannot submit it either. The
   owner is left with post and collecting from the admin, which is what the disc
   being at the admin's house actually allows.

   What stays open is the same case running the other way in time: the owner
   answers "I will collect it from the storage" and the disc is fetched home
   _afterwards_. Their answer now names a place the disc has left, and nothing
   tells them. It shows on `/vastaukset` and the admin sorts it out by message.
   Whether that deserves more — a flag on the answer, or a message to the owner
   — is the live part of this question.

5. **Does the shipping address live on the response row or in a table of its
   own?** On the row is simpler and matches "the answer is one event". A table
   would only earn its place if an address outlives the request it came with,
   which rule 2 of section 5 says it should not.
6. **Does the page hand out your home address for a collection?** **Partly
   settled by what shipped:** the page names the district ("Espoon
   Lintuvaarasta") and says a message with the details follows. So a forwarded
   link gives away a district, not a street, and the exact address and time are
   still agreed by message. Whether the page should go further — the full
   address, once an owner has chosen collection — is still deferred, and nothing
   else in this document depends on it.
7. **When exactly is a shipping address wiped?** Rule 2 of section 6 says "once
   the disc has been posted". What is built wipes it when the answer is marked
   handled on `/vastaukset`, which is the only event the app has — and it is not
   the same event. Marked handled too early and the label data is gone before
   the parcel is made up; never marked, and the address is kept for ever. Either
   the admin's habit makes them the same event, or the wipe belongs on "marked
   returned" instead.
8. **Does the page list an owner's other discs?** See section 10b: not in the
   first version. Turning it on means matching owners by phone number.
9. **What closes a request that nobody ever acts on?** Today: nothing, and the
   lists stop showing it once the disc is returned, released or archived. Good
   enough, or do you want to see stale requests?

## 12. Considered and left out: a 4-digit code

The idea: the owner must also type a four-digit code, so a leaked link alone
opens nothing.

It closes a real class of leak — a URL that travels without its context, in a
pasted message, a shared browser's history, an access log, a `Referer` header.
It was left out anyway, for four reasons, in the order they matter:

1. **There is nothing behind the link worth protecting.** Section 2: the page
   shows less than the public disc list already does. A code would guard
   information anyone can read without it.
2. **The most likely leak is not covered.** A code delivered in the same sms as
   the link is forwarded and screenshotted along with it. A second secret in the
   same envelope is not a second factor.
3. **Four digits is 10,000 guesses**, so it means nothing without attempt
   counting and a lockout — state to keep, and a support path where five
   fat-fingered tries in a car park end in a phone call to the admin.
4. **Every step costs answers.** The feature's whole purpose is to make replying
   effortless; friction spent here is paid for in owners who do not reply at all.

If it is ever wanted, the variant to build is the code being **the last four
digits of the owner's own phone number**, with the page showing nothing until
they are entered: nothing extra to send, nothing to remember, and a bare token
becomes unlinkable to a disc. Note that it directly replaces the display in
section 2 — a page cannot both show those digits and use them as a code. Note
also that the club's stored numbers are not all tidy, and the existing
truncation takes the last four _characters_, separators included
(`'050-123 45 67'` → `'5 67'`), so a code check would have to compare the last
four **digits** after stripping everything else.
