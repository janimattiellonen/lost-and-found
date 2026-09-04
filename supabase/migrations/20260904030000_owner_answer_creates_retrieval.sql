-- An owner's answer puts the disc on the retrieval list by itself.
--
-- Until now an answer of "post it to me" landed in disc_owner_responses and
-- stopped there: the admin read the inbox and re-entered the same disc on the
-- retrieval list by hand. That is the copying the whole feature exists to
-- remove, so the answer now creates the errand.
--
-- Reverses open question 2 of specs/05-owner-link-and-responses.md, which was
-- decided "no" on the grounds that an anonymous link must not change a disc.
-- It still cannot: a disc_retrievals row is the admin's to-do item -- visible
-- on a page he already reads, and closed with one tap -- not a fact about the
-- disc. can_be_sold_or_donated, is_returned_to_owner and return_method remain
-- his alone to set, so a forwarded link can add him a trip but cannot take a
-- disc off the public list or mark it returned.
--
-- anon still has no policy on disc_retrievals. The insert happens inside
-- submit_owner_response(), which is SECURITY DEFINER (it runs with its
-- creator's rights rather than the caller's), so the way in is still the
-- function that resolves the token itself.

-- 1. Which answer put the disc on the list.
--
-- 20260904010000_owner_link_club_scope.sql dropped requested_by (0 = the club,
-- 1 = the owner) because nothing ever wrote anything but 0, and said in its own
-- comment that provenance should come back as owner_response_id if an answer
-- ever created a retrieval. This is that case, and this is that column.
--
-- A foreign key beats the smallint enum it replaces: it says *which* answer, so
-- the address and the phone number the request arrived with are one join away.
-- NULL means the admin put the disc on the list himself, which stays the
-- ordinary case for a disc asked for by sms rather than through the link.
--
-- ON DELETE SET NULL, not CASCADE: losing the answer must not silently lose the
-- errand. The disc still has to be fetched.
ALTER TABLE public.disc_retrievals
  ADD COLUMN IF NOT EXISTS owner_response_id BIGINT
    REFERENCES public.disc_owner_responses (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.disc_retrievals.owner_response_id IS
  'The owner answer that created this errand. NULL = the admin entered it by hand.';

-- 2. submit_owner_response() also writes the errand.
--
-- Same signature as 20260904010000_owner_link_club_scope.sql left it; only the
-- body changes, so no DROP FUNCTION and the existing GRANTs stand.
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

  -- Which answers are an errand for the admin: the owner wants the disc back
  -- (choice 1) and it has to reach him first, by post (method 0) or by being
  -- collected from him (method 1).
  --
  -- Method 2, collecting from the koppi, is deliberately not one. The disc
  -- never leaves the club's storage on the admin's account, so there is nothing
  -- for him to fetch -- which is the same narrowing needsFetchingFromStorage()
  -- and disc_retrievals_method_check already make.
  --
  -- Giving the disc up (choice 0) is no errand either; the club decides what
  -- becomes of it, with the answer as evidence.
  IF p_choice = 1 AND p_handover_method IN (0, 1) THEN
    INSERT INTO disc_retrievals (disc_id, retrieval_method, owner_response_id)
    VALUES (v_disc_id, p_handover_method, v_response_id)
    -- Answering twice is how an owner changes their mind, and the partial
    -- unique index allows one open request per disc, so a second answer would
    -- otherwise raise -- and every failure in here surfaces to the owner as
    -- "this link is no longer in use", which would be both untrue and nothing
    -- they could act on.
    --
    -- The owner is the authority on what they want, so their newer word
    -- replaces whatever was on the line, whether it was an earlier answer or
    -- the admin's transcription of an sms. requested_at is deliberately left
    -- alone: the errand is as old as the first time they asked.
    ON CONFLICT (disc_id) WHERE retrieved_at IS NULL DO UPDATE
      SET retrieval_method = EXCLUDED.retrieval_method,
          owner_response_id = EXCLUDED.owner_response_id;
  END IF;
END;
$$;
