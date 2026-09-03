-- The retrieval list: discs the admin has to fetch out of the club's storage
-- because their owner asked for them by post or in person.
--
-- This is the club's own errand, not the handover to the owner. A disc is put
-- on the list when the owner asks, and comes off it when the disc is out of
-- storage and in the admin's hands -- the return to the owner is recorded
-- separately, in is_returned_to_owner and its date and method.
--
-- Replaces a note typed into a phone's notepad app ("punainen Destroyer, 21.8,
-- 050 111 2222, nouto") with the same facts as data.

ALTER TABLE public.discs
  ADD COLUMN IF NOT EXISTS retrieval_requested_at TIMESTAMPTZ;

ALTER TABLE public.discs
  ADD COLUMN IF NOT EXISTS retrieved_at TIMESTAMPTZ;

-- How the owner wants the disc: 0 = BY_MAIL (postitus), 1 = PICKED_UP (nouto).
-- The numbers deliberately match return_method's, but the column is its own:
-- this is what the owner asked for, which is known months before -- and can
-- differ from -- how the disc actually got back to them.
--
-- Mirrors the RetrievalMethod enum in
-- app/features/discs/retrieval/retrievalMethod.ts. Extend both together when a
-- new method is added.
ALTER TABLE public.discs
  ADD COLUMN IF NOT EXISTS retrieval_method SMALLINT;

ALTER TABLE public.discs
  DROP CONSTRAINT IF EXISTS discs_retrieval_method_check;

ALTER TABLE public.discs
  ADD CONSTRAINT discs_retrieval_method_check CHECK (retrieval_method IS NULL OR retrieval_method IN (0, 1));

-- The list reads exactly the rows this covers: asked for, not yet fetched.
CREATE INDEX IF NOT EXISTS discs_retrieval_pending_idx
  ON public.discs (club_id, retrieval_requested_at)
  WHERE retrieval_requested_at IS NOT NULL AND retrieved_at IS NULL;

COMMENT ON COLUMN public.discs.retrieval_requested_at IS
  'When the owner asked for the disc, putting it on the admin''s retrieval list. NULL = not on the list.';

COMMENT ON COLUMN public.discs.retrieved_at IS
  'When the admin took the disc out of the club''s storage. NULL while it is still there. Says nothing about the owner having it.';
