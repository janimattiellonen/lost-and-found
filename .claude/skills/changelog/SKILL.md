---
name: changelog
description: 'Add the CHANGELOG.md entry for the work on the current branch, under **Unreleased**, in the curated prose style the file uses. Use before opening a pull request, when a branch is otherwise ready to merge, when the user says "/changelog", and whenever a merged or about-to-merge change is user-visible but missing from the changelog.'
user-invocable: true
allowed-tools: Bash, Read, Edit
---

# Changelog

`CHANGELOG.md` records what the app does differently, for a reader who does not
follow the commits. It is written by hand, per pull request, on the branch — so the
entry is part of the PR diff and gets reviewed with the code. Nothing writes to it
after a merge, and no entry is ever generated from commit subjects.

Every entry goes under `## [Unreleased]`. Month sections are closed by a human
(see [Closing a month](#closing-a-month)) — never move entries out of Unreleased on
your own.

## Workflow

### 1. Read the branch

```bash
git fetch origin master --quiet
BASE=$(git merge-base HEAD origin/master)
git diff --stat "$BASE"..HEAD
git log --oneline "$BASE"..HEAD
git diff "$BASE"..HEAD -- CHANGELOG.md
```

Read the actual diff, not just the log. The commit messages say what was
edited; the entry has to say what changed for a person using the app.

If the branch already has an Unreleased entry, extend or correct it rather than
adding a second one for the same change.

### 2. Decide what is worth an entry

One line per change a reader would notice or care about:

- **Added** — something the app can now do.
- **Changed** — something it does differently, including framework upgrades,
  architecture rules that constrain future work, and repo-wide formatting passes.
- **Fixed** — a bug, a security hole, a data-integrity problem.

Keep the three headings in that order, and omit any that are empty. Deprecated,
Removed and Security are available if a change genuinely calls for one, in the
Keep a Changelog order.

Not every commit earns a line. Fold these into the entry they belong to, or leave
them out: refactors with no outside effect, test-only changes, lockfile and routine
dependency bumps, typo fixes, work on `specs/` or `prompts/`. If the whole branch
is invisible from the outside — a pure refactor, a spec rewrite — say so and add
nothing.

### 3. Write the line

Match the voice already in the file:

- Present tense, describing today's behaviour: _"The whole SMS body is escaped,
  not just its newlines."_ Not "Fixed escaping" and not "will escape".
- The subject is the app or the person using it, not the developer and not the
  code: _"An owner can report that several of their discs are waiting."_
- English, even though the UI is Finnish. Quote Finnish only when naming what a
  user reads on screen.
- One sentence, full stop at the end. A second clause is fine when the first
  needs a limit or a reason (_"Selections are capped at 20 discs."_).
- No PR numbers, no commit hashes, no author names, no file paths — unless the
  path _is_ the change (an architecture rule, a route that must keep working).
- When the change has a document in `docs/`, link it at the end of the line:
  `([docs/name.md](docs/name.md))`.
- Name the club when a change applies to only one of them.

### 4. Verify

```bash
sed -n '/## \[Unreleased\]/,/^## [0-9]/p' CHANGELOG.md
npx prettier --check CHANGELOG.md
```

Check that the new line reads correctly to someone who has not seen the diff,
that it sits under the right heading, and that no entry duplicates one already
in the file.

### 5. Commit

Stage `CHANGELOG.md` on its own, so the entry is legible in review:

```bash
git add CHANGELOG.md
git commit -m "docs(changelog): <the change, in the same words as the entry>"
```

Follow the `git-commit` skill for the message shape.

## Closing a month

When the user decides a month is done — not before, and never as part of a PR:

1. Rename `## [Unreleased]` to `## YYYY-MM — <theme>`. The theme is a short phrase
   naming the arc of the work, in the style of _"Getting a disc back to its owner"_
   and _"Adding discs in the web app"_. Propose one; the user picks.
2. Insert a fresh `## [Unreleased]` block directly above it.
3. Leave every earlier section untouched, including the closing note on the early
   history.
