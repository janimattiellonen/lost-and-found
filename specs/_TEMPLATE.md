# <Feature name>

> Status: as-built (describes what exists today, not a wishlist)
>
> Writing rules — reader who does not know this codebase, every abbreviation
> explained on first use, plain words over jargon, as long as the subject needs.
> See `.claude/skills/specs/SKILL.md`.

## Purpose
Two or three sentences: what problem this solves and for whom.

## Actors
Who uses it — anonymous visitor, club admin, system/cron.

## User-facing behaviour
Numbered scenarios in the form "When X, then Y". Cover the happy path first,
then the notable variations. Keep each to one or two lines.

## Data
Tables, columns and enums this feature owns or depends on. Note which are
nullable and why, and any invariants that are not enforced by the schema.

## Routes & entry points
| Route | Method(s) | Auth | Purpose |

## Rules & constraints
Validation limits, rate limits, authorization rules, club scoping. Anything a
future change could break without a test noticing.

## Edge cases & known gaps
Things that are unhandled, deliberately out of scope, or a bit sharp.

## Open questions
Decisions not yet made. Empty is a fine answer.
