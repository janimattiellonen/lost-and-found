# Supabase migrations

Each file in `migrations/` is a plain SQL script applied in filename order.

## Running migrations

Two options.

### A. Supabase CLI (recommended once linked)

First-time setup:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

Then, from the repo root:

```bash
npx supabase db push
```

Pushes any un-applied migrations under `supabase/migrations/` to the linked
remote project.

### B. Paste into the SQL Editor

Open the Supabase dashboard for your project, go to the SQL Editor, and paste
the contents of the migration file. Run it once.
