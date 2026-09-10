-- A disc the club is keeping is an errand too.
--
-- Until now the retrieval list held one kind of errand: fetch the disc out of
-- storage because its owner wants it. A disc released for sale or donation was
-- the opposite -- queryPendingRetrievals filtered it off the list -- even though
-- it has to come off the same shelf before it can be sold or donated. The admin
-- kept that second list in his head.
--
-- Both kinds are now rows in disc_retrievals, written the same way the
-- "Lisää noutolistalle" button writes one. All the schema needs for that is one
-- thing: a row with no handover method.

-- retrieval_method answers "how does the owner want the disc", and a disc the
-- club is keeping has no answer to it -- it is not going to anybody. So NULL
-- becomes a value with a meaning: this disc is being fetched, but not for its
-- owner. Nothing else writes NULL, so the list can read it as exactly that.
--
-- The one open row per disc stays the invariant it always was: a disc asked for
-- and then marked sold keeps its single open row rather than gaining a second.
--
-- (Written when the disposal mark cleared that row's method. It no longer does:
-- the owner's request is left on the row and the page reads the disc's own
-- can_be_sold_or_donated to decide what to show. The schema is unchanged either
-- way -- this comment is corrected rather than the statement below.)
ALTER TABLE public.disc_retrievals
  ALTER COLUMN retrieval_method DROP NOT NULL;

ALTER TABLE public.disc_retrievals
  DROP CONSTRAINT IF EXISTS disc_retrievals_method_check;

ALTER TABLE public.disc_retrievals
  ADD CONSTRAINT disc_retrievals_method_check
    CHECK (retrieval_method IS NULL OR retrieval_method IN (0, 1));

COMMENT ON COLUMN public.disc_retrievals.retrieval_method IS
  'How the owner wants the disc: 0 = post, 1 = collected from the admin. NULL = it is not going back to them; the club is keeping it.';

-- An owner giving the disc up is an errand as well.
--
-- Same signature and same reasoning as
-- 20260904030000_owner_answer_creates_retrieval.sql, which made "post it to me"
-- an errand; only the body changes, so no DROP FUNCTION and the existing GRANTs
-- stand. The admin's own mark writes its row from the app, but an owner's
-- answer cannot: anon has no privilege on disc_retrievals, and this function --
-- SECURITY DEFINER, running with its creator's rights -- is the only way in.
--
-- The answer still changes nothing about the disc. can_be_sold_or_donated
-- remains the admin's alone to set, and until he sets it the disc stays on the
-- public list; what the answer creates is a to-do item on a page he reads.
    CREATE OR REPLACE FUNCTION public.submit_owner_response(
  p_token UUID,
  p_club_id BIGINT,
  p_choice SMALLINT,
  p_handover_method SMALLINT,
  p_shipping_name TEXT DEFAULT NULL,
  p_shipping_street TEXT DEFAULT NULL,
  p_shipping_postal_code TEXT DEFAULT NULL,
  p_shipping_city TEXT DEFAULT NULL,
  p_shipping_country TEXT DEFAULT NULL,
  p_has_more_discs BOOLEAN DEFAULT false
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_disc_id BIGINT;
  v_response_id BIGINT;
  v_retrieval_method SMALLINT;
BEGIN
  SELECT id INTO v_disc_id
    FROM discs
    WHERE owner_link_token = p_token
      AND club_id = p_club_id
      AND is_returned_to_owner = false
      AND can_be_sold_or_donated = false
      AND archived_at IS NULL;

  IF v_disc_id IS NULL THEN
    RAISE EXCEPTION 'unknown token';
  END IF;

  -- Collecting from the storage is only an option while the disc is in it. The
  -- page does not offer it otherwise; this refuses a form that posts it anyway,
  -- so no row can claim an owner is collecting from somewhere the disc is not.
  IF p_handover_method = 2 AND NOT public.disc_is_in_storage(v_disc_id) THEN
    RAISE EXCEPTION 'unknown token';
  END IF;

  INSERT INTO disc_owner_responses (
    disc_id, choice, handover_method, has_more_discs,
    shipping_name, shipping_street, shipping_postal_code, shipping_city, shipping_country
  ) VALUES (
    v_disc_id, p_choice, p_handover_method, COALESCE(p_has_more_discs, false),
    p_shipping_name, p_shipping_street, p_shipping_postal_code, p_shipping_city, p_shipping_country
  )
  RETURNING id INTO v_response_id;

  -- Which answers are an errand for the admin: all of them but one.
  --
  -- The owner wants the disc back and it has to reach him first, by post
  -- (method 0) or by being collected from him (method 1) -- fetch it for its
  -- owner, and the row says which. Or the owner gives the disc up (choice 0) --
  -- fetch it for the club, and the row has no method.
  --
  -- Method 2, the owner collecting from the koppi, is the one that is not. The
  -- disc never leaves the club's storage on the admin's account, so there is
  -- nothing for him to fetch -- the same narrowing needsFetchingFromStorage()
  -- makes.
  IF p_choice = 0 THEN
    v_retrieval_method := NULL;
  ELSIF p_handover_method IN (0, 1) THEN
    v_retrieval_method := p_handover_method;
  ELSE
    RETURN;
  END IF;

  INSERT INTO disc_retrievals (disc_id, retrieval_method, owner_response_id)
  VALUES (v_disc_id, v_retrieval_method, v_response_id)
  -- Answering twice is how an owner changes their mind, and the partial unique
  -- index allows one open request per disc, so a second answer would otherwise
  -- raise -- and every failure in here surfaces to the owner as "this link is no
  -- longer in use", which would be both untrue and nothing they could act on.
  --
  -- The owner is the authority on what they want, so their newer word replaces
  -- whatever was on the line, whether it was an earlier answer or the admin's
  -- transcription of an sms. requested_at is deliberately left alone: the errand
  -- is as old as the first time they asked.
  ON CONFLICT (disc_id) WHERE retrieved_at IS NULL DO UPDATE
    SET retrieval_method = EXCLUDED.retrieval_method,
        owner_response_id = EXCLUDED.owner_response_id;
END;
$$;
