-- Discs the club has stopped listing, without claiming to know what became of
-- them.
--
-- The public list only shows discs that are neither returned nor released for
-- sale/donation, which leaves years of unresolved rows on the front page for
-- ever. Marking those returned or sold would record something that did not
-- happen; archiving records only what is true — the club no longer lists them.
--
-- Nullable and reversible: clearing the column puts a disc back on the list.
-- Statistics deliberately ignore it (getDiscsForStats reads every row for the
-- club), so archiving does not rewrite the club's history.

ALTER TABLE public.discs
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- The public list filters on it on every load.
CREATE INDEX IF NOT EXISTS discs_archived_at_idx ON public.discs (archived_at);

COMMENT ON COLUMN public.discs.archived_at IS
  'When the club stopped listing this disc publicly. NULL = still listed. Says nothing about where the disc ended up.';
