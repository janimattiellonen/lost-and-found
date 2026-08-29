-- Marking a disc as returned used to be a free-text note copied from the
-- Google Sheet ("29.8.2026 (Janimatti), postitettu"). These two columns record
-- the same facts as data.

ALTER TABLE public.discs
  ADD COLUMN IF NOT EXISTS returned_to_owner_date DATE;

-- Postgres has no TINYINT; SMALLINT is its narrowest integer.
-- 0 = BY_MAIL (postitettu), 1 = PICKED_UP (noudettu).
ALTER TABLE public.discs
  ADD COLUMN IF NOT EXISTS return_method SMALLINT;

-- Mirrors the ReturnMethod enum in app/features/discReturn/returnMethod.ts.
-- Extend both together when a new method is added.
ALTER TABLE public.discs
  DROP CONSTRAINT IF EXISTS discs_return_method_check;

ALTER TABLE public.discs
  ADD CONSTRAINT discs_return_method_check CHECK (return_method IS NULL OR return_method IN (0, 1));
