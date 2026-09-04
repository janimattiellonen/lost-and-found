---
name: specs
description: How to write and maintain the feature specifications in specs/ — write or update a spec before implementing a feature, verify it against the code once lint, typecheck and tests are green, and keep it readable for a human who does not already know the code. Use whenever adding a feature, changing behaviour, or reading specs/ to understand how something works.
user-invocable: true
---

# Specs

Every major feature has a specification in `specs/`, indexed by `specs/README.md`
and structured by `specs/_TEMPLATE.md`. A spec describes what the system **does
today**, not what it should eventually do.

The specs exist to answer two questions that the code answers badly: *why is it
like this*, and *what will I break if I change it*. Optimise for those.

## Who you are writing for

Write for a competent developer who has never seen this codebase, reading the
spec a year from now, without the code open beside them.

That person is not stupid, but they do not share your context. They do not know
what "the composite state" means here, they have not read the migration you just
read, and they will not recognise an abbreviation you invented this afternoon.

## Writing rules

### Introduce an abbreviation once, then use it

Abbreviations and established technical terms are welcome. They are often the
precise name for a thing, and a reader in this field expects them. The problem is
never that a spec says "RLS" — it is that the spec says "RLS" without ever having
said what it stands for.

The rule is about repetition, not about avoidance:

- **Used more than once in the file** — introduce it at the first mention, with
  the expansion and a short plain-language explanation in parentheses or after a
  dash. Then use the short form freely for the rest of the file. Do not re-explain
  it, and do not alternate between the long and short forms.
- **Used exactly once** — just write the plain phrase. Do not introduce an
  abbreviation you will never use again; "(DTO)" after a single mention of "data
  transfer object" is noise.

```
Row level security (RLS) — the PostgreSQL feature that decides, row by row,
whether a database role may read or write it — is the second line of defence
here. The RLS policies are listed below, and RLS is what stops an anonymous
visitor writing to `discs` even if the route forgets to check.
```

How much explanation an abbreviation needs depends on how far it sits from
everyday knowledge. "URL" needs nothing. "DTO (data transfer object)" needs the
expansion but not a definition. "RLS" needs the expansion *and* a sentence,
because the reader's decisions depend on understanding what it actually enforces.
When in doubt, give the sentence — it costs one line.

Each spec stands alone, so this restarts in every file. A term explained in
`05-owner-link-and-responses.md` is still unexplained in `06-messaging-and-templates.md`.

This applies to project-local shorthand too, not only industry acronyms.
`APP_CLUB_ID`, `external_id` and "the anon key" all deserve one plain sentence at
their first mention in a file — the reader cannot look these up anywhere.

Finnish user-visible strings follow the same shape: quoted exactly as they appear
in the code, with a short English gloss in parentheses at first use — "Merkitse
käsitellyksi" (mark as handled) — and the bare Finnish quote thereafter. The
gloss is for the reader; the quoted Finnish is the contract with the UI.

### Prefer plain words to impressive ones

Jargon that sounds sophisticated but adds nothing is the main thing that makes a
spec unreadable. Pick the ordinary word.

| Instead of | Write |
|---|---|
| leverage, utilise | use |
| orchestrate | run, coordinate |
| surface (verb) | show, report |
| hydrate the DTO | fill in the object |
| idempotent | running it twice changes nothing |
| the happy path | when everything works |
| performant | fast |
| single source of truth | the one place this is decided |

Keep a technical term when it is genuinely the precise name for a thing —
`SECURITY DEFINER`, `WITH CHECK`, foreign key, transaction. Then explain it once.
The test is whether the word carries information the plain phrasing would lose.

### Be as long as the subject needs

Brevity is not the goal; clarity is. A one-line summary that leaves the reader
guessing has saved nobody anything.

- Simple mechanism, few rules → short section. Do not pad it.
- Subtle rule, non-obvious reason, or something that has already caused a bug →
  spend the paragraph. Explain the mechanism, then why it is that way.
- Security and data-retention rules always get the full explanation, including
  which layer actually enforces them and what happens if someone bypasses the UI.

When a section is longer than a screen, it usually wants a small table.

### Say why, not only what

The code already states what happens. A spec earns its place by recording the
reasoning that is invisible in the diff:

> `owner_link_token` is a separate column rather than reusing `external_id`,
> so that a leaked link can be revoked with a single UPDATE without changing the
> identity the SMS history refers to.

If you cannot reconstruct the reason, write that plainly — "reason not recorded"
is more useful than an invented rationale.

### Concrete over abstract

Name the actual file, column, route, limit and Finnish label. "Validation is
applied" tells the reader nothing; "`parseBatch` rejects more than 100 rows and
returns a 422 naming the offending row number" tells them what to expect and
where to look.

## Structure

Follow `specs/_TEMPLATE.md` section for section, keeping every heading even when
a section is thin — consistency is what makes twelve specs skimmable. Sections:
Purpose, Actors, User-facing behaviour, Data, Routes & entry points, Rules &
constraints, Edge cases & known gaps, Open questions.

"Open questions" may be empty. Say "None" rather than deleting the heading.

Numbering: `specs/NN-<kebab-name>.md`, matching the row in `specs/README.md`.

## Before implementing

Do not start a feature or a behaviour change without its spec.

1. Find the affected spec(s) in `specs/README.md`. A change usually touches more
   than one — a new disc action touches `03-disc-lifecycle-actions.md` and often
   `01-public-disc-list.md` too.
2. **Changing existing behaviour:** update the spec first, so the diff shows the
   intended change in plain language before any code exists.
3. **A genuinely new feature:** create the file from `_TEMPLATE.md` and add a row
   to the table in `specs/README.md`.
4. If writing it down raises a question the spec cannot answer, ask it before
   writing code. That is the point of doing this first.

A spec written ahead of the code is a plan, so it may use future tense while the
work is in flight. Rewrite it in the as-built present tense before the work is
done.

Small changes still count: a validation limit, a new enum value or a changed
Finnish label all live in "Rules & constraints" or "Data". The exception is work
that changes no behaviour at all — a pure refactor, a rename, a formatting pass.

## After implementing

When the code is written and the basic checks pass, verify the spec against what
was actually built. The checks gate the start of that review; they are not the
end of the task:

```
npm run lint
npm run typecheck
npm test
npm run format:check
```

With those green, re-read every spec you touched and confirm, section by section:

- **User-facing behaviour** — every scenario matches the shipped flow, including
  the Finnish labels, quoted exactly as they appear in the code.
- **Data** — columns, types, nullability and enum values match the migration that
  shipped. Numeric enum values matter; they are stored in the database.
- **Routes & entry points** — every route, its methods, and its real
  authentication requirement. Check the `action`, not only the `loader`.
- **Rules & constraints** — limits and permissions match the code, and the spec
  names the layer that actually enforces them. Where an anonymous visitor is
  involved, that layer is the database, not the browser.
- **Edge cases & known gaps** — add anything you found but deliberately did not
  fix; remove entries this work fixed.
- **Open questions** — resolve the ones this work answered, add any it raised.

Then strip any remaining future tense.

If the implementation diverged from the spec, the spec changes — it records
reality. Say so in the pull request description, because a divergence usually
means the original plan was wrong somewhere worth mentioning.

## Recording gaps honestly

"Edge cases & known gaps" is the most valuable section in a spec, and only stays
valuable if it is candid. Write down the thing that is broken, unfinished or
merely sharp, in plain words, without softening it:

> Marking a disc returned does not close its open row in `disc_retrievals`. The
> row keeps `retrieved_at` empty for ever; it merely stops appearing as pending
> because the disc is no longer listed. Any later "how long did a fetch take"
> query would count these as still open.

Do not quietly fix a gap you noticed while writing — note it, finish the task at
hand, and raise it. Do not delete an entry because it is embarrassing.
