# SMS messaging & message templates

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
Tells a lost disc's owner that it has been found. The admin composes a message
from a reusable template, hands it to their own phone as an `sms:` link, and
records that it was sent so the disc's row shows a history. There is no SMS
gateway: the app never sends anything itself.

## Actors
- **Club admin** — signed in. The only actor; every route here is behind login.
- The **owner** only receives the text, from the admin's own phone.

## User-facing behaviour
1. Admin clicks the message icon on a disc row → `/message/send/<externalId>`,
   "Viestin luonti" (composing a message).
2. The page seeds the phone number from the disc and the message body from the
   club's default template; both stay editable.
3. Picking another template from "Viestipohja" replaces the body.
4. "Esikatselu" (preview) renders the body with tokens substituted and newlines
   as `<br/>`, live as it is typed.
5. "Lähetä tekstiviesti" (send sms) opens
   `sms:<number>&body=<substituted message>` — the OS's own messaging app takes
   over from there.
6. "Merkitse viesti lähetetyksi" (mark the message as sent) posts the rendered
   body to the route's action and writes a `message_log` row; the button then
   reads "Lähetetty" and is disabled.
7. Earlier messages for the same disc appear under "Lähetetyt viestit".
8. "Peru" (cancel) leaves for the disc list.
9. From a multi-disc selection, "Lähetä sms N henkilölle" opens
   `/message/send-batch?ids=<uuid,uuid,…>` and the same composer is worked
   through one owner at a time, with a "Kiekko 3 / 12" progress line. Recording
   a send *or* cancelling moves on; the last one returns to the list.
10. `/message-templates` ("Viestipohjat") lists this club's templates, the
    default one outlined. Per template: "Merkitse oletukseksi" (make default),
    "Muokkaa" (edit), "Poista" (delete, confirmed).
11. `/message-template/create` and `/message-template/:id/edit` are a textarea
    plus an "Oletusviestipohja" (default template) checkbox, with the token help
    line above.

## Data
**`message_templates`** — `id`, `created_at`, `updated_at`, `club_id`,
`content`, `is_default`. At most one default per club, kept by resetting every
`is_default` for the club before setting the new one (no unique index enforces
it). Mapped by `app/models/MessageTemplateMapper.ts` → `MessageTemplateDTO`.

**`message_log`** — one row per "marked as sent".

| Column | Notes |
|---|---|
| `id` | |
| `sent_at` | written as the string `'now()'` |
| `external_id` | uuid of the disc — the key since `20260902000000_message_log_external_id.sql`; nullable, indexed |
| `internal_disc_id` | legacy Google Sheet row number; NOT NULL dropped, nothing writes it any more |
| `club_id` | from `APP_CLUB_ID` |
| `content` | the substituted body, newlines already converted to `<br/>` |

Mapped by `app/models/MessageLogMapper.ts` → `MessageLogDTO`.

**Why uuid-keyed:** `internal_disc_id` is a Sheet row number, so a web-added disc
has none. Both the send page and its log were addressed by that id, which made
web-added discs unmessageable. The migration backfilled `external_id` by joining
on `(internal_disc_id, club_id)` — a Sheet row number is only unique within its
club — and left the old column for the history it already holds.

## Routes & entry points
| Route | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/message/send/:externalId` | GET, POST | signed in | Compose for one disc; POST records the send |
| `/message/send-batch?ids=…` | GET, POST | signed in | Compose for a selection; POST records one send |
| `/message-templates` | GET, POST | signed in | List; POST is `action=delete` or `action=default` |
| `/message-template/create` | GET, POST | **none in the route** — see gaps | Create a template |
| `/message-template/:id/edit` | GET, POST | signed in on GET only | Edit a template |

## Token grammar
`replaceTokensWithValues(message, disc, baseUrl)` in
`app/features/messaging/messageContent.ts`. Five tokens, literal square
brackets, `replaceAll` so every occurrence is filled — not just the first.

| Token | Substituted with | Empty case |
|---|---|---|
| `[colour]` | `disc.discColour` | empty string, not the literal token |
| `[disc]` | `disc.discName` | empty string |
| `[course]` | `disc.course`, as recorded — "Äijänpelto" | empty string when the disc has no course |
| `[courses]` | the same name in the genitive — "Äijänpellon" | empty string when the disc has no course |
| `[link]` | `<baseUrl>/disc/<owner_link_token>` | empty string when the disc has no token, rather than a url ending in "undefined" |

**Why a course has two tokens.** Finnish inflects place names, and a message
names the course mid-sentence: "Sinun musta Mako3 on löytynyt Äijänpellon
radalta." The nominative "Äijänpelto" cannot be used there. `[courses]` is that
genitive form — the mnemonic being the English possessive _-'s_ for the Finnish
genitive _-n_ — and the template supplies the "radalta" itself, so the token is
the inflected course name and nothing more. `[course]` stays available for a
message that names the course on its own, as in "Rata: Äijänpelto".

**The genitive is configured, not derived.** `discCourseGenitive` in
`app/config/courses.ts` holds it per course, because Finnish genitive is not a
suffix rule: "Oittaa" simply gains an _-n_, but "Äijänpelto" also gradates its
consonants (_lt_ → _ll_). A new course needs the form written out beside its
name or `[courses]` falls back to the nominative for it.

Both tokens read `discs.course`, the short name the Google Sheet has always used.
The long display name in the same config (`name`, "Oittaan frisbeegolfrata") is
deliberately **not** used: the admin writing the template wants the short form so
the text message stays short.

A stored value matching no configured course is substituted **as it is** by both
tokens — uninflected in the case of `[courses]`. Imported Sheet data can hold any
course name an admin once typed, and an uninflected name reads slightly wrong
where losing the course entirely reads worse.

The two course tokens look like they should collide and do not: `[course]` never
matches inside `[courses]`, because the character after "course" is an "s" and
not the closing bracket. Order of substitution is therefore irrelevant, and a
test pins that — the day a token is added that genuinely is a prefix of another,
it will fail rather than silently mangle a message.

The lookup is by course name alone and is **not scoped to a club**, unlike every
query in this feature. That is safe only because exactly one club
(`clubId: 1`, Puskasoturit) records a course per disc at all; Talin tallaajat
records none, so both course tokens are always empty for them. Two clubs using
the same short name for different courses would collide — see "Edge cases &
known gaps".

`getCourseGenitive` lives in `app/config/courses.ts` beside the course data
rather than in the messaging feature, because substitution happens in the
browser as the admin types: `MessageComposer` calls `replaceTokensWithValues`
for the preview, the `sms:` href and the hidden field alike, so nothing on that
path may read `process.env` or the database.

There is no escaping and no other syntax; anything else is left alone.
`baseUrl` is `new URL(request.url).origin` from the loader — read from the
request, not `window.location`, so the server render and the browser's agree.
The tokens are documented to the admin by
`app/features/messaging/TemplateTokenHelp.tsx`, shown on both template forms.

## Transport & configuration
- **No SMS provider, no API key, no outbound HTTP.** The "send" button is an
  `sms:` URI; the admin's phone or desktop OS sends the actual message.
  The body is percent-encoded whole by `toSmsBody`
  (`app/features/messaging/messageContent.ts`) and grouping spaces are stripped
  from the number (`toDiallable`).

  **The body must be escaped entirely, not just its newlines.** It used to go
  through a `convertLineBreaks` that replaced `\n` with `%0a` and left every
  other character alone. A template ending "Milloin pääsisit noutamaan kiekon?"
  therefore put a literal `?` in the url, which is where a query string starts:
  the messaging app took the text before it as the body and dropped everything
  after, with no error and nothing in the preview to suggest it. `&` and `#`
  would each have cut a message the same way. `encodeURIComponent` handles all
  of them and writes a newline as `%0A`, which is what the old function
  produced for the one case it did cover — so nothing about an already-working
  message changes.
- Postage details the message may refer to live in `app/config/shipping.ts`;
  per-club payment and contact details in `app/config/clubs.ts`.
- The only env vars this feature touches: `APP_CLUB_ID` (club scoping on every
  template and log query) and the Supabase pair used by
  `createSupabaseServerClient`.

## Rules & constraints
- Every template and log query filters `club_id = APP_CLUB_ID`; a template of
  another club cannot be read, edited or deleted.
- Batch selection (`sendBatchSelection.ts`): ids come from the `ids` query
  parameter, split on commas, trimmed, uuid-validated, deduplicated, and kept
  **in the order the admin saw them**. `MAX_BATCH_SIZE = 100`, because the
  selection travels in a URL; a larger selection is reported ("Valitsit N
  kiekkoa…") rather than quietly truncated. An empty selection redirects to `/`.
- Discs without a phone number are dropped from the batch by
  `SelectedDiscsActions`, not by the loader.
- `/message/send/:externalId` validates the uuid before querying and 404s
  ("Kiekkoa ei löytynyt.") on a malformed id or a disc this club does not have.
- The composer is remounted with `key={disc.externalId}` in a batch — that is
  what re-seeds the number, template and body for the next owner. The advance
  callback is guarded by a ref so a re-render cannot skip an owner.
- `recordMessageSent` re-validates the external id and posts the one from the
  *loaded* disc, not from the URL.
- Template content is required (`'Sisältö on pakollinen'`, 422); nothing else is
  validated — length, tokens and markup are all free.
- The batch loader fetches sent history only for the discs actually found, in
  one `in()` query rather than one per disc.
- `MESSAGING_DISC_COLUMNS` (`app/models/discs.server.ts`) names the columns the
  single and batch message queries both select, `course` among them. A token can
  only substitute a field on that list; adding one to the grammar means adding
  its column here too, or it arrives undefined and substitutes as empty.
- `ComposerDisc` (`composerData.ts`) is the matching list on the browser's side —
  the disc fields the composer shows or substitutes. `replaceTokensWithValues`
  runs client-side as the admin types, so a token's field has to be in both.

## Edge cases & known gaps
- **`/message-template/create` has no auth check at all** — no loader, and the
  action does not call `isUserLoggedIn`. Only the RLS policies on
  `message_templates` stand between an anonymous POST and a new template. Every
  sibling route guards.
- `/message-template/:id/edit` guards its loader but not its action.
- `markAsSent` ignores the Supabase error and unconditionally
  `console.log`s `Error: undefined` on success. A failed insert is reported to
  the admin as "Lähetetty".
- The phone field in `MessageComposer` is `type="email" name="email"
  placeholder="Sähköpostiosoite"` — leftover markup; the value is used as a
  phone number and the name is never read.
- The `sms:` href uses `&body=` rather than the `?body=` of RFC 5724; it works
  on iOS, not uniformly elsewhere. Left alone deliberately when the body
  encoding was fixed: that fix is safe everywhere, whereas changing the
  separator can only be judged on the admin's own handset, and the `&` form is
  what has been sending messages until now. Note that the two are independent —
  with the body encoded there is no longer a stray `?` in the url either way.
- Message content is rendered with `dangerouslySetInnerHTML` in the preview, the
  sent-message history and the template list. The content is admin-authored, but
  nothing sanitises it.
- Nothing verifies a message was actually sent — "marked as sent" is the
  admin's assertion. Equally, an admin who sends and forgets to mark leaves no
  log row.
- `getMessageTemplates` orders by `created_at DESC` only; the commented-out
  `is_default` ordering means the default template is not first in the dropdown.
- The batch position is component state, not a URL — deliberate, so the back
  button cannot re-send.
- A `message_log` row for a since-deleted disc keeps only its legacy
  `internal_disc_id`; it had no `external_id` to backfill from.
- `getCourseGenitive` matches on the course name alone, with no club scope.
  Today only one club records a course per disc, so nothing can collide; the day
  a second club adds a `discCourseName` already in use, `[courses]` would
  substitute the other club's genitive. The fix would be to pass the club id
  through to the lookup, which means getting it to the browser first.
- A course added to `app/config/courses.ts` without a `discCourseGenitive`
  degrades silently: `[courses]` substitutes the nominative, so a message reads
  "on löytynyt Äijänpelto radalta". Nothing warns, and no type requires the
  field, because the clubs that record no course per disc have neither.
- A template written around either course token reads badly for a disc that has
  none: the token becomes an empty string, so "[courses] radalta." sends as
  " radalta." with the space and full stop intact. Nothing warns the admin,
  though the preview shows it. This matches how `[colour]` and `[disc]` behave.
- Only the genitive is configured. A template needing another of Finnish's
  fifteen cases — "Äijänpeltoon", "Äijänpellolla" — has no token for it and must
  name the course literally, which then applies to every disc in a batch.

## Open questions
None recorded.
