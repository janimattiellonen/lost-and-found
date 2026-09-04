# Row Level Security (RLS) Policies

## disc_found_notifications

```sql
-- 1. Enable RLS on the table
ALTER TABLE disc_found_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Anyone (including anonymous visitors) can insert
CREATE POLICY "Allow public insert"
  ON disc_found_notifications
  FOR INSERT
  WITH CHECK (true);

-- 3. Only authenticated users can read
CREATE POLICY "Allow authenticated select"
  ON disc_found_notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Only authenticated users can update (for marking as read)
CREATE POLICY "Allow authenticated update"
  ON disc_found_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Only authenticated users can delete
CREATE POLICY "Allow authenticated delete"
  ON disc_found_notifications
  FOR DELETE
  TO authenticated
  USING (true);
```

## disc_owner_responses

What a disc's owner answered from the link in the sms. The only table an
anonymous visitor causes writes to, and it has **no anon policy at all** —
`anon` gets `EXECUTE` on one function instead:

```sql
-- Applied by supabase/migrations/20260903010000_owner_responses.sql
CREATE POLICY "Allow authenticated select" ON public.disc_owner_responses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated update" ON public.disc_owner_responses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete" ON public.disc_owner_responses
  FOR DELETE TO authenticated USING (true);
```

There is deliberately no INSERT policy. `SUPABASE_KEY` is the anon key and it is
in every page's source, so an INSERT policy would let anyone write answers —
shipping addresses included — for any `disc_id`, which is a bigint and therefore
enumerable. No link required. Instead:

```sql
GRANT EXECUTE ON FUNCTION public.submit_owner_response(...) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owner_link_disc(UUID)      TO anon, authenticated;
```

Both are `SECURITY DEFINER` and resolve `discs.owner_link_token` themselves, so
holding a link is the whole permission and the columns an anonymous visitor can
read are fixed in the migration rather than in a query. `owner_link_disc()`
returns nothing for a disc already returned, released or archived, and every
failure in `submit_owner_response()` raises the same `unknown token`, so a bad
guess teaches nothing.

`disc_is_in_storage(BIGINT)` is revoked from `PUBLIC` and granted to nobody: it
is only ever called from inside those two, which run as its owner.

## disc_retrievals

Only the club's own admin has anything to do with the retrieval list: it is read
behind a signed-in page, and both writes come from admin actions. Deliberately
nothing for `anon` — the owner-facing page that lets a disc's owner say what they
want is a separate feature, and will bring its own, narrower way in rather than
widening this.

The `UPDATE` policy carries `USING` as well as `WITH CHECK`, for the reason given
under `discs` below.

Applied by `supabase/migrations/20260903000000_disc_retrievals.sql`, which also
enables RLS on the table.

```sql
CREATE POLICY "Allow authenticated select" ON public.disc_retrievals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON public.disc_retrievals
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON public.disc_retrievals
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete" ON public.disc_retrievals
  FOR DELETE TO authenticated USING (true);
```

## discs

The UPDATE policy needs a `USING` clause as well as `WITH CHECK`. `USING`
decides which existing rows may be targeted; `WITH CHECK` validates the row
after the change. A policy with only `WITH CHECK` lets no existing row be
updated at all, and row-level security filters rather than raising, so the
statement quietly affects zero rows.

Applied by `supabase/migrations/20260829040000_discs_update_policy.sql`.

```sql
CREATE POLICY "Enable update for authenticated users only"
  ON public.discs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

The other three policies on `discs`: `SELECT` to `public` (the list is public),
`INSERT` and `DELETE` to `authenticated`.
