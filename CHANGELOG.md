# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project is deployed continuously and does not use version numbers, so releases
are grouped by the period in which the work landed, newest first. Add new entries
under **Unreleased** as you merge them.

Entries start at 2026-02-23, the first commit whose message is descriptive enough to
turn into a changelog entry; see [Earlier history](#earlier-history) at the bottom.

## [Unreleased]

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

## Earlier history

Development before 2026-02-23 (`903f33b`) is not documented here. Those commits carry
messages like `Fixes`, `Improvements` and `ddd`, so a changelog for them would have to be
reconstructed from the diffs rather than the log. Broadly, that period built the
application itself: the disc list and search, the Google Sheets sync, Supabase storage
and login, SMS messaging with templates, the statistics page, and the warning icon on
discs at risk of being sold or donated.
