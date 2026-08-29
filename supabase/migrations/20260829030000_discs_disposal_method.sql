-- Marking a disc for sale or donation gets the same treatment as marking one
-- returned: can_be_sold_or_donated_text and _date already exist, so only the
-- method is new.
--
-- Postgres has no TINYINT; SMALLINT is its narrowest integer.
-- 0 = SOLD (myydään), 1 = DONATED (lahjoitetaan).
ALTER TABLE public.discs
  ADD COLUMN IF NOT EXISTS can_be_sold_or_donated_method SMALLINT;

-- Mirrors the DisposalMethod enum in
-- app/features/discDisposal/disposalMethod.ts. Extend both together when a new
-- method is added.
ALTER TABLE public.discs
  DROP CONSTRAINT IF EXISTS discs_can_be_sold_or_donated_method_check;

ALTER TABLE public.discs
  ADD CONSTRAINT discs_can_be_sold_or_donated_method_check
  CHECK (can_be_sold_or_donated_method IS NULL OR can_be_sold_or_donated_method IN (0, 1));
