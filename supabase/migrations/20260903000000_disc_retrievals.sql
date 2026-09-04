-- The retrieval list: discs the admin has to fetch out of the club's storage
-- because their owner asked for them by post or in person.
--
-- This is the club's own errand, not the handover to the owner. A disc goes on
-- the list when its owner asks, and comes off it when it is out of storage and
-- in the admin's hands -- the return to the owner is recorded separately, in
-- discs.is_returned_to_owner and its date and method, and can be days later.
--
-- Replaces a note typed into a phone's notepad app ("punainen Destroyer, 21.8,
-- 050 111 2222, nouto") with the same facts as data.
--
-- A table rather than another pair of columns on discs, for three reasons:
--
--  * A request is an event, and the same disc can be asked for more than once
--    -- fetched, never collected, put back, asked for again. Columns keep only
--    the latest of those; here every one of them is a row, so the club can
--    answer "how long does a fetch take" and "how many get posted" from its own
--    history rather than from memory.
--  * discs already carries four workflow stages (returned, released, archived,
--    and this) as date-and-method pairs. It is a description of a disc, not a
--    log of what has been done with one.
--  * The next feature lets an owner say what they want from a link in an sms,
--    with no login. A request that lives in its own table can be granted to
--    that page without ever opening discs to anonymous writes -- which is the
--    part worth being careful with, since discs holds every owner's phone
--    number.

CREATE TABLE IF NOT EXISTS public.disc_retrievals (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- The numeric key, not external_id: the foreign key is what keeps the two
  -- tables honest, and the club scoping on every write happens through the
  -- lookup that turns an external_id into this. A deleted disc takes its
  -- history with it, the way the rest of its record goes.
  disc_id BIGINT NOT NULL REFERENCES public.discs (id) ON DELETE CASCADE,

  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- How the owner wants the disc: 0 = BY_MAIL (postitus), 1 = PICKED_UP (nouto).
  -- The numbers deliberately match discs.return_method's, but this is not that
  -- column: it is what the owner asked for, which is known before the disc
  -- leaves storage and can differ from how it finally got back to them.
  --
  -- Mirrors the RetrievalMethod enum in
  -- app/features/discs/retrieval/retrievalMethod.ts. Extend both together when
  -- a new method is added.
  retrieval_method SMALLINT NOT NULL,

  -- Who said so: 0 = the club (the admin, transcribing an sms), 1 = the owner
  -- (from the link in the message). Nothing sets 1 yet; the column is here
  -- because a request that arrives without anyone at the club reading it is
  -- worth telling apart from one that was.
  requested_by SMALLINT NOT NULL DEFAULT 0,

  -- When the disc came out of storage. NULL while it is still there, which is
  -- what puts the row on the list. Says nothing about the owner having it.
  retrieved_at TIMESTAMPTZ,

  CONSTRAINT disc_retrievals_method_check CHECK (retrieval_method IN (0, 1)),
  CONSTRAINT disc_retrievals_requested_by_check CHECK (requested_by IN (0, 1)),
  -- A disc cannot be fetched before it was asked for.
  CONSTRAINT disc_retrievals_order_check CHECK (retrieved_at IS NULL OR retrieved_at >= requested_at)
);

-- At most one open request per disc. This is what lets the rest of the app
-- speak of "the" pending retrieval: a second ask while one is still open
-- updates the row rather than making a duplicate, and two requests arriving at
-- once cannot both land.
CREATE UNIQUE INDEX IF NOT EXISTS disc_retrievals_one_open_per_disc
  ON public.disc_retrievals (disc_id)
  WHERE retrieved_at IS NULL;

-- The list, the count and the icons in the disc list all read exactly this.
CREATE INDEX IF NOT EXISTS disc_retrievals_pending_idx
  ON public.disc_retrievals (requested_at)
  WHERE retrieved_at IS NULL;

-- Only the club's own admin has anything to do with this table: the list is
-- read behind a signed-in page, and both writes come from admin actions.
-- Deliberately nothing for anon -- the owner-facing page is a separate feature
-- and will bring its own, narrower way in.
ALTER TABLE public.disc_retrievals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated select" ON public.disc_retrievals;
CREATE POLICY "Allow authenticated select"
  ON public.disc_retrievals
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON public.disc_retrievals;
CREATE POLICY "Allow authenticated insert"
  ON public.disc_retrievals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- USING as well as WITH CHECK: without USING no existing row may be targeted at
-- all, and row-level security filters rather than raising, so the statement
-- would quietly affect nothing. See 20260829040000_discs_update_policy.sql.
DROP POLICY IF EXISTS "Allow authenticated update" ON public.disc_retrievals;
CREATE POLICY "Allow authenticated update"
  ON public.disc_retrievals
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON public.disc_retrievals;
CREATE POLICY "Allow authenticated delete"
  ON public.disc_retrievals
  FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE public.disc_retrievals IS
  'Requests to fetch a disc out of the club''s storage. One open row per disc; retrieved_at closes it.';
