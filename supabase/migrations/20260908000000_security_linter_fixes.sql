-- Fixes the three ERROR-level findings from the Supabase database linter
-- (report of 2026-09-08). None of the three objects is referenced anywhere in
-- this codebase -- all were created by hand in the dashboard.
--
-- 1 & 2: distinct_disc_colours / distinct_disc_names are SECURITY DEFINER
-- views, so they run with the permissions and RLS of their creator instead of
-- the querying user. Switching them to security_invoker makes them respect the
-- policies on public.discs. Both views only list distinct values of columns
-- that anon may already select from discs (the public disc list is public), so
-- this changes no visible data -- it just stops the views from being a way
-- around discs' policies later.
--
-- ALTER VIEW ... SET is used rather than CREATE OR REPLACE VIEW so the
-- hand-written view bodies stay exactly as they are.

ALTER VIEW public.distinct_disc_colours SET (security_invoker = on);
ALTER VIEW public.distinct_disc_names SET (security_invoker = on);

-- 3: public.countries is exposed to PostgREST with RLS disabled, so anyone
-- with the anon key can read it. It holds only the leftover Supabase
-- quickstart sample rows (Nepal, Vietnam), nothing in the app touches it, and
-- it was never created by a migration -- it is quickstart debris, so it is
-- dropped rather than hardened.
--
-- Deliberately no CASCADE: if anything unknown does depend on this table, the
-- migration should fail loudly here instead of quietly dropping the dependent
-- objects too.

DROP TABLE public.countries;
