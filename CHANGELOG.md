# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project is deployed continuously and does not use version numbers, so releases
are grouped by the period in which the work landed, newest first. Add new entries
under **Unreleased** as you merge them.

Entries cover the whole project, from the first commit on 2023-07-20. Sections up to
2026-02 were reconstructed from the diffs rather than the commit messages; see
[A note on the early history](#a-note-on-the-early-history) at the bottom.

## [Unreleased]

### Added

- A disc marked for sale or donation goes onto the retrieval list, so it is fetched off the shelf with everything else waiting to be picked up; it reads "Myyntiin tai lahjoitukseen" instead of a handover method. If its owner had already asked for that disc, the list says so in amber — the sale does not quietly bury the request.
- An owner who gives their disc up from the link in the message puts it on the retrieval list too, the way asking for it back already did.
- Marking a bin emptied can record a day other than today: ticking "pvm" on a course's row opens a date picker, for when the bin was checked but logged later.
- The statistics page breaks its two headline totals down by method: how many discs are waiting to be sold and how many donated, and how many went back to their owners by post and how many were picked up. Discs whose method was never filled in are shown as "Ei kirjattu" rather than dropped, so each breakdown still adds up to the total above it.
- A checkbox under "Top 10 kadotettua kiekkomallia" on the statistics page counts discs by model rather than by the exact name typed in, so "Destroyer, Star", "Destroyer, Halo" and "destroyer" share one bar.
- Every disc in the list has a pencil icon opening a page that edits it: name, colour, manufacturer, owner, phone number, course and the club's internal notes, so a typo is fixed in the app rather than in the database.

### Changed

- The retrieval list is ordered newest request first, so the errands that have just come in are at the top.
- Tapping an owner's phone number on the retrieval list or the responses view now opens a message to them instead of placing a call.
- A disc marked returned or marked for sale by mistake can be put back on the public list: the edit page carries both marks as checkboxes, and unticking one clears its date and method. Every other way of making those marks is still one-way.

### Fixed

- A message written for several selected discs at once names the course the disc was found on. It had been left blank there — "on löytynyt radalta" — while the same template filled the course in correctly when the message was opened for a single disc.

## 2026-09 — Getting a disc back to its owner

### Added

- Owner link page: an owner can answer straight from the link in the SMS, one question at a time, and say whether they will collect the disc or want it posted. Available to both clubs. ([docs/getting-a-disc-back-to-its-owner.md](docs/getting-a-disc-back-to-its-owner.md))
- An owner can report that several of their discs are waiting.
- Disc retrieval list: retrieval errands are kept in the app rather than in a notepad, as their own `disc_retrievals` rows. An owner's answer creates the errand automatically, in every club.
- Batch actions in the disc list: tick discs to message their owners, or mark or delete a whole selection at once. Selections are capped at 20 discs.
- Message templates can be grouped into categories, and a template can name the course.
- The responses view shows when the disc was registered.
- The admin menu has a phone layout (hamburger menu).
- Saving a message template now says so.

### Changed

- Every route is named in English.
- The batch actions are one dropdown rather than four buttons.
- The two admin cards on the responses view share one layout.

### Fixed

- The whole SMS body is escaped, not just its newlines.
- The owner link is scoped to the club serving it, and a category belonging to another club is rejected.
- Addresses an owner submits are length-capped where anonymous callers cannot get around it.
- Three database linter errors cleared.

## 2026-08 — Adding discs in the web app

### Added

- Discs can be added, edited and deleted in the web app; the Google Sheet sync is retired.
- Free-text disc parser: a whole disc entry is typed as one line and parsed into structured fields, including genitive manufacturer names and unknown discs. A `/demo` page exercises the parser.
- A disc can be marked as returned to its owner, or for sale or donation.
- The course a disc was found on is recorded, filterable, and choosable when adding discs by hand.
- Discs the club no longer lists can be archived.
- Private notes typed after a pipe are recorded.
- Puskasoturit club support, including an additive sheet import script and per-club logo, intro text and contact address.
- Admins see the whole phone number; the number is grouped for reading in the list and on the send page.
- Web-added discs can be messaged too.

### Changed

- Routes are thin wiring only; features live in `app/features/` and cross-feature imports fail the build.
- Prettier applied across the repo, and the remaining ESLint warnings cleared.

## 2026-06 — Framework and UI modernisation

### Changed

- Migrated from Remix 1.19 to React Router 7 with Vite, deployed on Vercel via the `@vercel/react-router` preset.
- Upgraded to React 19 and React Router 7.18.
- Replaced MUI and Emotion entirely with StyleX components (Button, TextField, Select, Checkbox, Radio, Collapse, spinner, Paper, inline SVG icons) and a Downshift combobox in `DiscSelector`.
- Replaced react-data-grid with TanStack Table on a native table.
- Migrated auth from `@supabase/auth-helpers-remix` to `@supabase/ssr`.
- Upgraded to Vite 8, ESLint 9 flat config, date-fns 4, Supabase CLI 2, and Node 22.

### Added

- Sort direction indicators in the disc table.
- Playwright e2e coverage for `DiscSelector`.

## 2026-02 – 2026-04 — Found-disc notifications

### Added

- Found-disc notifications with QR poster generation as a PDF.
- Bin-full notifications with their own QR poster.

### Changed

- The disc table sorts newest first by default.
- Prettier and ESLint scripts added to the project.

## 2024-10 – 2025-12 — Maintenance

### Changed

- A disc is flagged as at risk of being sold or donated after three months at the club, not six.
- The date an owner was notified is parsed from the Tali sheet, stored, and shown on the message page along with the owner's name.
- Node 20 is required, pinned in `.nvmrc`.

## 2023-09 – 2023-10 — SMS messaging

### Added

- Message templates: create, edit and list them, with one marked as the default.
- A message page per disc that fills the template in, resolves the `[colour]` and `[disc]` tokens against the disc, shows a preview, and opens the text in the phone's own SMS app with the owner's full number.
- Sent messages are recorded in a message log, so an owner is not contacted twice about the same disc.
- Back links between the message template pages.

### Changed

- The front page loads its discs through a fetcher after the first render rather than in the route loader, which stopped a slow query blocking the page, and shows a loading indicator while they arrive.

## 2023-08 – 2023-09 — Statistics

### Added

- A statistics page for admins, with a vertical and a horizontal bar chart.
- Charts for discs returned to the club and discs returned to their owners, over time.
- A chart of the most frequently lost disc models.
- Counts of returned discs and of discs sold or donated.

### Changed

- Clearer wording for the chart and page titles.

## 2023-08 — Public list, login and the bin log

### Added

- Email and password login against Supabase, with a session cookie, guarding the admin pages behind it.
- An admin menu and a header showing the club's name, plus the club name in the page title.
- Talin Tallaajat branding: logo and favicon.
- Bin emptying log (`Tyhjennysloki`): the front page shows when each bin was last emptied, and an admin can mark one as emptied.
- Search discs by the last digits of the owner's phone number, and pick a disc model from an autocomplete rather than a plain dropdown.
- A red warning icon on discs that have been at the club long enough to be at risk of being sold or donated.
- Info text on the front page explaining what the list contains, what is deliberately not published about an owner, and where to ask about a disc.
- The time of the last full sync is stored on the club.

### Changed

- The disc list moved from `/discs` to the front page.
- Only the owner's last four phone-number digits reach the public list.
- The intro text is shown for Talin Tallaajat only, whose site it links to.
- Prettier configuration added and applied.

### Fixed

- Rows without an id, name or date are skipped when importing a sheet.
- Sync writes go through the signed-in user's Supabase client, so row-level security applies.

## 2023-07 — First version

### Added

- Remix application on Supabase, deployed to Vercel, with Tailwind for styling.
- Google Sheets importers for Talin Tallaajat and Puskasoturit, and routes to sync one disc or all of them.
- The disc list as a sortable table, with a filter by disc model.
- DTO and mapper layer between the snake_case database and the camelCase application code.

## A note on the early history

Everything up to 2026-02-23 was reconstructed by reading the diffs: the commit messages
from that period are things like `Fixes`, `Improvements`, `ddd` and `sfddfg`, and say
nothing about what changed. Small commits have been folded into the feature they belong
to, so the entries above describe what the code did, not what any single commit claimed.
