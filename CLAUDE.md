# Working in this repo

## Read the conventions before writing code

Load the `project-conventions` skill before implementing anything under `app/`,
`supabase/` or `scripts/`. It carries the rules a linter cannot: what belongs in a
slice, what `app/ui/` and `app/lib/` are for, how database query files are named,
and that Finnish is for what a person reads and English for everything else.

Feature work also needs a spec — read the `specs` skill before touching `specs/`,
and the `changelog` skill before touching `CHANGELOG.md`.

## Review before committing

**Run `/code-review master` when a piece of work is finished, before committing
it.** It is the `mattpocock-skills:code-review` skill: two parallel sub-agents,
one asking whether the code follows this repo's documented standards, the other
whether it does what the spec asked. It reads the diff against the merge-base and
reports on both.

This is not optional politeness. The conventions in `project-conventions` are the
half a linter cannot check, and the review is the only thing that looks at them —
plus design questions no tool can see: a rule quietly overwritten, an abstraction
that should exist, a spec edited to match the code rather than the other way
round.

Then, having acted on the findings — or having said out loud which are being left
and why:

```bash
.claude/hooks/review-gate.sh record
```

`git commit` is **blocked** until that marker matches the current diff
(`.claude/hooks/review-gate.sh`, wired as a `PreToolUse` hook in
`.claude/settings.json`). Edit a file afterwards and the marker goes stale, because
a review of the previous version is not a review of this one.

The marker records only that a review happened, not that it was any good — it can
be written without running anything. It exists to turn "forgot" into "chose to
skip", which is as far as a file can go.

## Before you say it is done

- `npm test`
- `npx tsc --noEmit`
- `npm run lint`
- `npx prettier --check` on what you touched (`.sql` has no parser configured —
  migrations are formatted by hand)
- The spec: re-read the **whole** document you edited, not only the paragraphs you
  changed. A spec that contradicts itself two sections later is worse than one
  that was never updated.
