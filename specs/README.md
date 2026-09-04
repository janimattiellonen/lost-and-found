# Specs

Feature specifications for the lost-and-found app. This file is the index: one line
per feature, linking to its own spec once written.

## Features

| # | Feature | What it covers | Code |
|---|---------|----------------|------|
| 1 | [Public disc list & search](01-public-disc-list.md) | Browsable/searchable list of lost discs, course filter, number search. Anonymous view + admin columns. | `features/discs/list/`, `routes/_index.tsx`, `routes/discs.data.tsx` |
| 2 | [Disc submission](02-disc-submission.md) | Single-field free-text entry, text parser, browser draft storage, persistence. | `features/discs/submission/`, `routes/discs.add.tsx`, `routes/discs.create.tsx` |
| 3 | [Disc lifecycle actions](03-disc-lifecycle-actions.md) | Return to owner/club, disposal, deletion, course change, retrieval list. | `features/discs/{return,disposal,deletion,courseChange,retrieval}/` |
| 4 | [Batch operations](04-batch-operations.md) | Select many discs, apply one action to all. | `features/discs/batch/`, `routes/discs.batch.tsx` |
| 5 | [Owner link & responses](05-owner-link-and-responses.md) | Token link from SMS: owner picks handover method, adds discs, gives address. Admin response inbox. | `features/discs/ownerResponse/`, `routes/kiekko.$token.tsx`, `routes/vastaukset.tsx` |
| 6 | [SMS messaging & templates](06-messaging-and-templates.md) | Send to one owner or a batch, template CRUD with tokens, preview, message log. | `features/messaging/`, `routes/message*.tsx` |
| 7 | [Found-disc & bin-full notifications](07-notifications.md) | Public QR forms at a course, rate limiting, admin inbox, QR posters. | `features/notifications/`, `routes/notify*.tsx`, `routes/bin.full.$courseSlug.tsx` |
| 8 | [Emptying log](08-emptying-log.md) | Record and show when a course's collection bin was emptied. | `features/emptyingLog/`, `routes/emptying-log.tsx` |
| 9 | [Google Sheets sync](09-google-sheets-sync.md) | Per-club importers pulling disc rows from Sheets, reconciled into the DB. | `import/`, `features/discSync/`, `models/syncDiscs.server.ts` |
| 10 | [Statistics](10-statistics.md) | Returned-to-owner vs. club, most-lost disc names, trends over time. | `features/stats/`, `routes/stats.tsx` |
| 11 | [Auth & authorization](11-auth-and-authorization.md) | Supabase sign-in, cookie sessions, admin-only routes, RLS policies. | `features/auth/`, `routes/sign-in.tsx`, `docs/rls.md` |
| 12 | [Multi-club configuration](12-multi-club-configuration.md) | One deployment per club: club-scoped data, course catalog, per-club feature flags. | `APP_CLUB_ID`, `config/courses`, `models/clubs.server.ts` |
| 13 | [Admin navigation menu](13-admin-navigation.md) | The top bar of admin links and its phone layout: hamburger button, slide-in panel, focus trap, scroll lock, waiting counts. | `ui/AdminMenu.tsx`, `root.tsx` |

All paths are relative to `app/`.

Each spec follows [_TEMPLATE.md](_TEMPLATE.md) and describes the system **as built**,
not as wished for. Known bugs and gaps are recorded under each spec's
"Edge cases & known gaps".

Before writing or changing a spec, read the `specs` skill
(`.claude/skills/specs/SKILL.md`) — it covers when a spec must be written, how it
is verified against the code afterwards, and how to write it so someone who does
not know this codebase can follow it.
