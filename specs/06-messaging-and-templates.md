# SMS messaging & message templates

> Status: as-built (describes what exists today, not a wishlist)

## Purpose
Tells a lost disc's owner that it has been found. The admin composes a message
from a reusable template, hands it to their own phone as an `sms:` link, and
records that it was sent so the disc's row shows a history. There is no SMS
gateway: the app never sends anything itself.

Templates are sorted into admin-managed **categories**, so that a page which
messages an owner for one particular reason offers only the templates written
for that reason instead of every template the club has.

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
    default one outlined. Each card shows its category under the content —
    "Kategoria: Omistajan vastaus", or "Kategoria: ei mitään" (none) for a
    template in no category. Per template: "Merkitse oletukseksi" (make
    default), "Muokkaa" (edit), "Poista" (delete, confirmed).
11. `/message-template/create` and `/message-template/:id/edit` are a textarea,
    a "Kategoria" dropdown and an "Oletusviestipohja" (default template)
    checkbox, with the token help line above. The dropdown lists this club's
    categories plus "Ei kategoriaa" (no category), which is what a new template
    starts on. While a save is in flight the submit button is disabled and reads
    "Luodaan..." / "Tallennetaan...", so a slow post does not look like a dead
    button. Afterwards the edit page shows a green "Viestipohja luotu." (created,
    after the redirect from the create form) or "Viestipohja tallennettu."
    (saved) line, which disappears again as soon as the form is edited — what is
    on screen is then no longer what is stored.
12. "Hallitse kategorioita" (manage categories) on `/message-templates` opens
    `/message-template-categories` ("Viestipohjien kategoriat"): one page with a
    "Lisää kategoria" (add a category) field at the top and a row per existing
    category, each row a name field with "Tallenna" (save) and "Poista" (delete,
    confirmed — the confirmation says the templates in it are kept).
13. Deleting a category does not delete its templates. They stay, with no
    category, and the list on `/message-templates` shows them as
    "Kategoria: ei mitään".
14. On `/responses` (spec 05) each answer card carries "Lähetä viesti" (send a
    message), which opens the same composer for that answer's disc with the
    template dropdown narrowed to the owner-response category.

## Data
**`message_templates`** — `id`, `created_at`, `updated_at`, `club_id`,
`content`, `is_default`, `category_id`. At most one default per club, kept by
resetting every `is_default` for the club before setting the new one (no unique
index enforces it). Mapped by `app/models/MessageTemplateMapper.ts` →
`MessageTemplateDTO`.

`category_id` is a nullable foreign key to `message_template_categories` with
`ON DELETE SET NULL`. Nullable because a template in no category is the normal
starting state and has to stay allowed; `SET NULL` because deleting a category
is a decision about the category, not about the messages written under it.

**`message_template_categories`** — added by
`supabase/migrations/20260906000000_message_template_categories.sql`.

| Column | Notes |
|---|---|
| `id` | `BIGSERIAL`. This is what code refers to a category by — see below |
| `created_at` | default `now()` |
| `updated_at` | set on rename |
| `club_id` | `BIGINT NOT NULL`, from `APP_CLUB_ID` — the environment variable naming which club this deployment serves |
| `name` | `TEXT NOT NULL`, what the admin reads and may change at will; `CHECK (btrim(name) <> '')` |

Unique index on `(club_id, lower(name))`, so one club cannot end up with
"Vastaus" twice in a dropdown. Row level security (RLS) — the PostgreSQL feature
that decides row by row whether a database role may touch a row — allows select,
insert, update and delete to `authenticated` only, with nothing for `anon`. The
category list is admin-only in every direction.

**Why code refers to a category by its numeric id.** A page that messages an
owner for a specific reason has to name the category it wants, and the admin can
rename any category at any time. Matching on the name would break on the first
rename. Storing an extra immutable string key alongside the name would survive a
rename but drift away from it — after "Omistajan vastaus" is renamed to
"Noutopyyntö" the key still reads `owner-response`, and the admin now sees two
different names for one thing. The row id is the one identifier that is both
stable and never shown, so that is what
`app/config/messageTemplateCategories.ts` holds:

```ts
const OWNER_RESPONSE: Record<number, number> = {
  [PUSKASOTURIT]: 1,
  [TALIN_TALLAAJAT]: 2,
};
```

A map keyed on the club, in the shape of `CONTACT_EMAILS` in
`app/config/clubs.ts`, because the categories are club-scoped like the templates
they group: each club has its own row for the same idea, and therefore its own
id. The migration seeds those two rows with **explicit** ids 1 and 2 and then
moves the sequence past them with `setval`, so the numbers in the file are true
in every environment rather than whatever the insert order happened to produce.
A club added later needs a row of its own here and in that map.

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
| `/message/send/:externalId?category=N` | GET, POST | signed in | Compose for one disc; POST records the send. `category` narrows the template dropdown |
| `/message/send-batch?ids=…` | GET, POST | signed in | Compose for a selection; POST records one send |
| `/message-templates` | GET, POST | signed in | List; POST is `action=delete` or `action=default` |
| `/message-template/create` | GET, POST | signed in on GET only | Create a template |
| `/message-template/:id/edit?created=1` | GET, POST | signed in on GET only | Edit a template. `created=1` is what the create form's redirect leaves behind, and only decides which success line is shown |
| `/message-template-categories` | GET, POST | signed in on GET only | The category admin tool; POST is `action=create`, `action=rename` or `action=delete`, and nothing else |

**The `category` search parameter is a row id, and it is put there by the
server.** `/responses` builds the link from
`app/config/messageTemplateCategories.ts`, so the number never has to be typed
or remembered by anyone. Nothing is trusted about it on the way back in:
`parseCategoryId` takes only a positive whole number and the loader then looks
the category up scoped to `APP_CLUB_ID`, so a hand-edited id belonging to
another club resolves to nothing and falls back like a deleted one. The
parameter only ever filters a dropdown — no message, disc or template is
reachable through it that was not reachable without it.

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
  (when could you come and collect the disc?) therefore put a literal `?` in the
  url, which is where a query string starts: the messaging app took the text
  before it as the body and dropped everything after, with no error and nothing
  in the preview to suggest it. `&` and `#` would each have cut a message the
  same way.

  **Every message's url changed, not only the broken ones.** `encodeURIComponent`
  escapes the lot: a space becomes `%20`, "ä" becomes `%C3%A4`, the `://` inside
  a `[link]` becomes `%3A%2F%2F`, and the newline becomes `%0A` where the old
  function wrote the lowercase `%0a`. The *decoded* message is identical; the
  url carrying it is not, for essentially every message the club sends.

  That is safe because the handset percent-decodes the body — and this is
  something the app already knew rather than something assumed here. The old
  function emitted `%0a` and the newline arrived as a newline; had the body been
  taken literally, every multi-line message ever sent would have contained a
  visible "%0a". Whatever handles these links decodes them.
- Postage details the message may refer to live in `app/config/shipping.ts`;
  per-club payment and contact details in `app/config/clubs.ts`.
- The only env vars this feature touches: `APP_CLUB_ID` (club scoping on every
  template and log query) and the Supabase pair used by
  `createSupabaseServerClient`.

## Rules & constraints
- Every template, category and log query filters `club_id = APP_CLUB_ID`; a
  template or category of another club cannot be read, edited or deleted.
- **Which templates the dropdown offers**, decided by
  `templatesForCategoryOrUncategorised` in
  `app/features/messaging/loadSendMessagePage.server.ts`:

  | Opened with | Dropdown shows |
  |---|---|
  | no `category` parameter | every template of the club — what the disc list has always done |
  | a `category` that resolves to a row of this club | the templates whose `category_id` is that row |
  | a `category` that resolves to nothing — deleted, another club's, or not a number | only templates with **no** category |

  The last line is the deliberate answer to "the admin deleted the category the
  code points at". Falling back to every template would silently undo the
  narrowing the page was opened for, and an empty dropdown would read as a
  broken page; the uncategorised templates are the set still meaningful once the
  grouping is gone, and they are also exactly where the deleted category's own
  templates have just landed, by `ON DELETE SET NULL`.
- The body is still seeded from the club's default template, but only when that
  template is in the dropdown. `MessageComposer` looks for `isDefault` in the
  list it was handed, so a default belonging to another category simply is not
  found and the composer opens on "Valitse..." with an empty body. No extra code
  makes this happen and none is wanted: a default written for the disc list is
  the wrong opening text for an owner who has already answered.
- A category name is trimmed, then required (`'Nimi on pakollinen'`, 422), and
  must be unique within the club, case-insensitively
  (`'Samanniminen kategoria on jo olemassa'`, 422). The unique index on
  `(club_id, lower(name))` is what actually decides the second one: the action
  attempts the write and turns the database's unique-violation code `23505` into
  that message, rather than reading the table first, so two admins saving the
  same name at the same moment cannot both pass.
- **A category id posted by a template form is re-checked against this club**
  (`queryOwnCategoryId`) before it is stored, and becomes "no category" if it
  names nothing here. Neither the foreign key nor the club scoping on the write
  would catch a foreign id: the key only proves the row exists *somewhere*, and
  the `club_id` filter scopes the template being written, not the category it
  points at. Without the check, a posted `category-id` of the other club's row
  is stored happily — and since neither template action checks for a signed-in
  user, an anonymous POST could do it. The template would then vanish from every
  filtered dropdown while its list card showed the other club's category name,
  because the `message_template_categories(name)` embed is not club-filtered
  either. A rejected id becomes null rather than a 422, so a prodder learns
  nothing about which ids are real.
- The category tool's `action` must be exactly `create`, `rename` or `delete`;
  anything else is refused with `'Tallennus epäonnistui'` (422). An earlier
  shape fell through to `create`, which turned a typo in a hidden field into a
  new category. Its `id` goes through the same `parseCategoryId` as the
  composer's `?category=`, so a NaN never reaches PostgREST.
- A rename or a delete that matches no row reports `'Kategoriaa ei löytynyt'`
  (422). PostgREST returns no error for that — filtering a row out is not a
  failure to it — so the writes ask for the affected rows back with `.select('id')`
  and treat an empty result as the failure it is. Without that, renaming a
  category of the other club looked like it had saved, and the page came back
  still showing the old name.
- Deleting a category never deletes a template. The foreign key does it — there
  is no application code that clears `category_id` first, so nothing can forget
  to.
- `getMessageTemplates(request, filter?)` in
  `app/models/messageTemplate.server.ts` is the single template read. Omitting
  the filter is every template of the club; `{ categoryId: n }` is one
  category's; `{ categoryId: null }` is the templates in **no** category, which
  is the fallback above and not "any category".
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
- `/message-template/create` had no auth check at all until this work: no
  loader, and an action that never called `isUserLoggedIn`. It needed a loader
  to fetch the category list for its dropdown, and shipping an unguarded loader
  beside a dozen guarded ones was not worth doing, so the loader now guards and
  redirects to `/sign-in` like its siblings. **The action is still unguarded**,
  exactly as before — only the RLS policies on `message_templates` stand between
  an anonymous POST and a new template.
- `/message-template/:id/edit` guards its loader but not its action. Same for
  `/message-template-categories`: its loader guards, its action does not, so an
  anonymous POST could add, rename or delete a category and is stopped only by
  RLS. This copies the sibling routes rather than improving on them.
- "Peru" on the composer always goes to `/`, including when the composer was
  opened from `/responses`. Cancelling a message to an owner who has answered
  therefore drops the admin on the disc list rather than back in the inbox they
  came from. Nothing carries the origin through; adding it would mean a
  `returnTo` parameter and an allowlist to stop it becoming an open redirect,
  and that was left out of this work.
- A category with no templates in it is not hidden anywhere. Pointing the
  `category` parameter at one gives an empty dropdown, which is correct and
  looks like a bug.
- Nothing warns the admin that a category is the one `/responses` uses before
  they delete it. The database has no idea which ids the code holds — that is
  the price of keeping the binding in `app/config/` — so the delete goes through
  and `/responses` quietly falls back to uncategorised templates.
- The category admin tool has no ordering control: categories come back ordered
  by name, and there is no way to pin one to the top of a dropdown.
- A template belongs to at most one category. A text that would serve two
  situations has to be written twice.
- `markAsSent` ignores the Supabase error and unconditionally
  `console.log`s `Error: undefined` on success. A failed insert is reported to
  the admin as "Lähetetty".
- The phone field in `MessageComposer` is `type="email" name="email"
  placeholder="Sähköpostiosoite"` — leftover markup; the value is used as a
  phone number and the name is never read.
- The `sms:` href uses `&body=` rather than the `?body=` of RFC 5724; it works
  on iOS, not uniformly elsewhere. Left alone when the body encoding was fixed,
  because the two are independent: with the body escaped there is no stray `?`
  in the url either way, and the `&` form is what has been sending messages
  until now.
- **Nobody has checked on a handset that the escaping introduced with
  `toSmsBody` round-trips.** The argument above — the old `%0a` arrived as a
  newline, so the body is decoded — is sound for `%0a`, and it is the whole of
  the evidence. It does not separately prove that `%3F` comes back as "?" or
  `%20` as a space, and a `sms:` url with no `?` in it has no query component at
  all under RFC 5724, so a strict parser is not obliged to decode the body. The
  fix is believed safe on the strength of one decoded escape and the fact that
  percent-decoding is not usually selective. The first message sent after it
  ships is the test, and it is worth actually looking at.
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
