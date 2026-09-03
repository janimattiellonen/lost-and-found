-- Two corrections to what the branch shipped.
--
-- See docs/getting-a-disc-back-to-its-owner.md.

-- 1. The owner-facing path is scoped to a club, like every other query.
--
-- Both clubs share this database, and each runs its own deployment. Every admin
-- query filters discs.club_id; these two did not, so a Talin token opened on
-- the Puskasoturit deployment rendered and accepted an answer -- shown that
-- club's payee number, contact address and collection district, none of which
-- apply to the disc. The caller passes the club it is serving and a disc from
-- any other is simply not found, which is the same answer an unknown token
-- gets.
DROP FUNCTION IF EXISTS public.owner_link_disc(UUID);

CREATE OR REPLACE FUNCTION public.owner_link_disc(p_token UUID, p_club_id BIGINT)
RETURNS TABLE (
  disc_name TEXT,
  disc_colour TEXT,
  disc_manufacturer TEXT,
  phone_number_ending TEXT,
  in_storage BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT d.disc_name,
         d.disc_colour,
         d.disc_manufacturer,
         NULLIF(RIGHT(REGEXP_REPLACE(COALESCE(d.owner_phone_number, ''), '\D', '', 'g'), 4), '')::TEXT,
         public.disc_is_in_storage(d.id)
    FROM discs d
   WHERE d.owner_link_token = p_token
     AND d.club_id = p_club_id
     AND d.is_returned_to_owner = false
     AND d.can_be_sold_or_donated = false
     AND d.archived_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.owner_link_disc(UUID, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_link_disc(UUID, BIGINT) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.submit_owner_response(
  UUID, SMALLINT, SMALLINT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN
);

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
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_owner_response(
  UUID, BIGINT, SMALLINT, SMALLINT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_owner_response(
  UUID, BIGINT, SMALLINT, SMALLINT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN
) TO anon, authenticated;

-- 2. disc_retrievals.requested_by goes.
--
-- Section 10 of the spec says provenance becomes owner_response_id when the
-- flag page lands. It has landed, in this same branch, and nothing ever wrote
-- anything but 0 (the club) -- an owner's answer is a row in
-- disc_owner_responses, not a retrieval someone asked for. A column with one
-- value is worse than no column: it reads like a fact that is being kept.
ALTER TABLE public.disc_retrievals
  DROP CONSTRAINT IF EXISTS disc_retrievals_requested_by_check;

ALTER TABLE public.disc_retrievals
  DROP COLUMN IF EXISTS requested_by;
