-- discs.external_id: a non-guessable public identifier for admin features.
-- The BIGSERIAL primary key stays as the internal identifier; external_id is
-- what URLs and other outward-facing surfaces should use.

-- gen_random_uuid() is built in from PostgreSQL 13 on; pgcrypto covers older DBs.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Add the column, nullable at first so existing rows survive the ALTER.
ALTER TABLE public.discs
  ADD COLUMN IF NOT EXISTS external_id UUID;

-- 2. Backfill every existing row with its own UUID.
--    (A plain DEFAULT would not fill rows that already exist.)
UPDATE public.discs
  SET external_id = gen_random_uuid()
  WHERE external_id IS NULL;

-- 3. New rows get one automatically, and the column can now be mandatory.
ALTER TABLE public.discs
  ALTER COLUMN external_id SET DEFAULT gen_random_uuid();

ALTER TABLE public.discs
  ALTER COLUMN external_id SET NOT NULL;

-- 4. Unique, and indexed for lookups by external_id.
CREATE UNIQUE INDEX IF NOT EXISTS discs_external_id_key
  ON public.discs (external_id);
