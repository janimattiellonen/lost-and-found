> **Warning**  
> The `@remix-run/vercel` runtime adapter has been deprecated in favor of out of
> the box Vercel functionality and will be removed in Remix v2.  
> This means you don't have to use the Vercel template & can just use the Remix
> template instead.

# Welcome to Remix!

- [Remix Docs](https://remix.run/docs)

## Project layout

- `app/routes/` — pages and resource routes (flat routes), plus the components a
  page owns. A route file with no default export is a resource route: it answers
  `fetch` with JSON rather than a rendered document.
- `app/features/<feature>/` — logic that runs in the browser or in both places:
  the disc-text parser, the client side of each admin action, and the small
  shared helpers under `app/features/api/`. Nothing here talks to the database.
- `app/models/*.server.ts` — everything that does talk to the database, plus the
  DTO mappers that carry snake_case columns to camelCase fields.
- `app/import/` — the per-club Google Sheet importers.
- `supabase/migrations/` — schema changes; see `docs/rls.md` for the row-level
  security policies.

Unit tests (Vitest) sit next to the code they cover as `*.test.ts`; the
Playwright suite lives in `e2e/`.

## Deployment

After having run the `create-remix` command and selected "Vercel" as a deployment target, you only need to [import your Git repository](https://vercel.com/new) into Vercel, and it will be deployed.

If you'd like to avoid using a Git repository, you can also deploy the directory by running [Vercel CLI](https://vercel.com/cli):

```sh
npm i -g vercel
vercel
```

It is generally recommended to use a Git repository, because future commits will then automatically be deployed by Vercel, through its [Git Integration](https://vercel.com/docs/concepts/git).

## Development

To run your Remix app locally, make sure your project's local dependencies are installed:

```sh
npm install
```

Afterwards, start the Remix development server like so:

```sh
npm run dev
```

Open up [http://localhost:3000](http://localhost:3000) and you should be ready to go!

If you're used to using the `vercel dev` command provided by [Vercel CLI](https://vercel.com/cli) instead, you can also use that, but it's not needed.
