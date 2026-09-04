-- An owner with several discs waiting.
--
-- Postage depends on how many discs go in the parcel, and the club would rather
-- agree that by message than build a basket into the owner-facing page. So the
-- posting option carries one checkbox: "minulla on useampia kiekkoja". Ticking
-- it submits the answer without an address -- there is no point collecting one
-- for a parcel whose contents are still being agreed -- and the admin gets in
-- touch.
--
-- See docs/getting-a-disc-back-to-its-owner.md.

-- 1. The flag itself.
ALTER TABLE public.disc_owner_responses
  ADD COLUMN IF NOT EXISTS has_more_discs BOOLEAN NOT NULL DEFAULT false;

-- 2. Posting without an address is now legal in exactly one more case.
--
-- The constraint still refuses a posting that simply arrived without one: an
-- answer either carries an address, has had it wiped after the parcel went out,
-- or says out loud that the address is coming later.
ALTER TABLE public.disc_owner_responses
  DROP CONSTRAINT IF EXISTS owner_response_address_pairing;

ALTER TABLE public.disc_owner_responses
  ADD CONSTRAINT owner_response_address_pairing CHECK (
    handover_method IS DISTINCT FROM 0
    OR shipping_street IS NOT NULL
    OR shipping_cleared_at IS NOT NULL
    OR has_more_discs
  );

-- The flag only means anything on a posting: nothing about collecting a disc
-- depends on how many the owner has.
ALTER TABLE public.disc_owner_responses
  DROP CONSTRAINT IF EXISTS owner_response_more_discs_only_for_post;

ALTER TABLE public.disc_owner_responses
  ADD CONSTRAINT owner_response_more_discs_only_for_post CHECK (
    has_more_discs = false OR handover_method = 0
  );

-- 3. The submit function takes the flag.
--
-- Dropped and recreated rather than CREATE OR REPLACE: a new parameter makes a
-- different signature, which Postgres would keep alongside the old one as an
-- overload, and a call with the original arguments would then be ambiguous.
-- Dropping also drops the grant, so anon is granted again below.
DROP FUNCTION IF EXISTS public.submit_owner_response(UUID, SMALLINT, SMALLINT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.submit_owner_response(
  p_token UUID,
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
BEGIN
  SELECT id INTO v_disc_id
    FROM discs
    WHERE owner_link_token = p_token
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
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_owner_response(
  UUID, SMALLINT, SMALLINT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_owner_response(
  UUID, SMALLINT, SMALLINT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN
) TO anon, authenticated;

COMMENT ON COLUMN public.disc_owner_responses.has_more_discs IS
  'The owner said they have several discs waiting; postage and contents are agreed by message, so no address was collected.';
