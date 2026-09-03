-- What the owner of a lost disc says when they follow the link in the sms:
-- whether they want the disc back and how, or whether the club may keep it.
--
-- See docs/getting-a-disc-back-to-its-owner.md. The two things this migration
-- is careful about:
--
--  * The answer is untrusted input, recorded for the admin to act on. It never
--    writes to discs, whose rows hold every owner's phone number and whose
--    is_returned_to_owner / can_be_sold_or_donated columns decide what the
--    public list shows. One forwarded link must not be able to take a disc off
--    that list.
--  * anon gets no rights on any table. The one way in is a function that
--    demands the link token, so a caller who does not hold one can write
--    nothing -- not even with the anon key, which is in every page's source.

-- 1. The link token. A credential, which is why it is not external_id: that one
--    is in admin URLs, every disc resource route accepts it, and message_log
--    rows reference it, so it cannot be rotated without orphaning a disc's
--    message history. This can be replaced for one disc with a single UPDATE,
--    which is what killing a leaked link looks like.
ALTER TABLE public.discs
  ADD COLUMN IF NOT EXISTS owner_link_token UUID;

UPDATE public.discs
  SET owner_link_token = gen_random_uuid()
  WHERE owner_link_token IS NULL;

ALTER TABLE public.discs
  ALTER COLUMN owner_link_token SET DEFAULT gen_random_uuid();

ALTER TABLE public.discs
  ALTER COLUMN owner_link_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS discs_owner_link_token_key
  ON public.discs (owner_link_token);

COMMENT ON COLUMN public.discs.owner_link_token IS
  'What the owner-facing link in the sms is built on. Rotate it to invalidate every link sent for this disc.';

-- 2. The answers. Append-only in practice: an owner who changes their mind
--    answers again and the latest row wins, which is also how a typo in an
--    address is corrected -- the page never shows a stored address back, so
--    there is nothing to edit in place.
CREATE TABLE IF NOT EXISTS public.disc_owner_responses (
  id BIGSERIAL PRIMARY KEY,
  disc_id BIGINT NOT NULL REFERENCES public.discs (id) ON DELETE CASCADE,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 0 = the club may keep the disc, 1 = wants it back.
  choice SMALLINT NOT NULL,

  -- How they want it: the shared handover method (0 post, 1 collect from the
  -- admin, 2 collect from the club's storage). Mirrors the HandoverMethod enum
  -- in app/features/discs/handoverMethod.ts; extend both together.
  handover_method SMALLINT,

  -- Where a posted disc goes. Structured rather than one free-text block:
  -- these end up copied onto a parcel, and a wrong postal code means it comes
  -- back. Only ever populated for handover_method = 0.
  shipping_name TEXT,
  shipping_street TEXT,
  shipping_postal_code TEXT,
  shipping_city TEXT,
  -- NULL means Finland.
  shipping_country TEXT,

  -- When the address was wiped after the disc went out. An address is needed to
  -- write a label and for nothing afterwards, and the club should not end up
  -- holding a standing list of members' home addresses.
  shipping_cleared_at TIMESTAMPTZ,

  -- When the admin dealt with this answer. Drives the count beside the menu
  -- item, the way disc_found_notifications.read_at does.
  handled_at TIMESTAMPTZ,

  CONSTRAINT owner_response_choice_check CHECK (choice IN (0, 1)),
  CONSTRAINT owner_response_method_check CHECK (handover_method IS NULL OR handover_method IN (0, 1, 2)),

  -- Wants it back <=> there is a method. Giving the disc up names none.
  CONSTRAINT owner_response_method_pairing CHECK ((choice = 1) = (handover_method IS NOT NULL)),

  -- Post => an address, unless it has since been wiped. That "unless" is why
  -- shipping_cleared_at exists: without it, honouring the retention rule would
  -- make the row fail its own constraint on the way out.
  CONSTRAINT owner_response_address_pairing CHECK (
    handover_method IS DISTINCT FROM 0
    OR shipping_street IS NOT NULL
    OR shipping_cleared_at IS NOT NULL
  ),

  -- An address only ever accompanies a posting.
  CONSTRAINT owner_response_address_only_for_post CHECK (
    handover_method = 0 OR shipping_street IS NULL
  )
);

-- The admin reads the latest answer per disc, and counts the unhandled ones.
CREATE INDEX IF NOT EXISTS disc_owner_responses_disc_idx
  ON public.disc_owner_responses (disc_id, responded_at DESC);

CREATE INDEX IF NOT EXISTS disc_owner_responses_unhandled_idx
  ON public.disc_owner_responses (responded_at)
  WHERE handled_at IS NULL;

-- 3. Row-level security. Reading and marking handled are the admin's; writing
--    happens only through the function below. Deliberately no anon policy of
--    any kind: an INSERT policy would let anyone holding the anon key spray
--    answers -- addresses included -- at every disc id, with no link needed.
ALTER TABLE public.disc_owner_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated select" ON public.disc_owner_responses;
CREATE POLICY "Allow authenticated select"
  ON public.disc_owner_responses
  FOR SELECT
  TO authenticated
  USING (true);

-- USING as well as WITH CHECK; see 20260829040000_discs_update_policy.sql for
-- what a missing USING does to an UPDATE policy.
DROP POLICY IF EXISTS "Allow authenticated update" ON public.disc_owner_responses;
CREATE POLICY "Allow authenticated update"
  ON public.disc_owner_responses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON public.disc_owner_responses;
CREATE POLICY "Allow authenticated delete"
  ON public.disc_owner_responses
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. Where a club keeps its discs, which is what decides the owner's options.
--
-- Talin Tallaajat's discs sit in the club's own storage until the admin fetches
-- one home; Puskasoturit's are at his house from the day they are found. So an
-- owner may be offered "I'll collect it from the storage" for one club's disc
-- and not the other's -- and only while it is actually still there.
--
-- A column on clubs rather than a club id in SQL: the fact belongs to the club,
-- and the queries below then read it instead of naming a number.
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS stores_discs_offsite BOOLEAN NOT NULL DEFAULT false;

UPDATE public.clubs SET stores_discs_offsite = true WHERE id = 2;

COMMENT ON COLUMN public.clubs.stores_discs_offsite IS
  'True when found discs go to a storage the admin has to travel to, rather than straight to his home.';

-- Whether a disc is still in that storage: its club keeps one, and nobody has
-- fetched this disc out of it. Derived rather than stored -- a fetch is the only
-- move the app records, so there is nothing else for a column to know.
--
-- Not granted to anon: it is called from inside the two SECURITY DEFINER
-- functions below, which run as this function's owner.
CREATE OR REPLACE FUNCTION public.disc_is_in_storage(p_disc_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(c.stores_discs_offsite, false)
     AND NOT EXISTS (
       SELECT 1 FROM disc_retrievals r
        WHERE r.disc_id = d.id AND r.retrieved_at IS NOT NULL
     )
    FROM discs d
    LEFT JOIN clubs c ON c.id = d.club_id
   WHERE d.id = p_disc_id;
$$;

REVOKE ALL ON FUNCTION public.disc_is_in_storage(BIGINT) FROM PUBLIC;

-- 5. What the owner-facing page may read.
--
-- A function rather than a SELECT with the anon key, so the columns an
-- anonymous visitor can reach are fixed here instead of in a query someone
-- could later widen by accident. It returns exactly what section 2 of
-- docs/getting-a-disc-back-to-its-owner.md lists, and no row at all for a disc
-- the club has already dealt with.
--
-- The phone number is cut to its last four *digits* -- separators stripped
-- first, because the club's stored numbers are not all tidy ('050-123 45 67').
CREATE OR REPLACE FUNCTION public.owner_link_disc(p_token UUID)
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
  SELECT d.disc_name::TEXT,
         d.disc_colour::TEXT,
         d.disc_manufacturer::TEXT,
         NULLIF(RIGHT(REGEXP_REPLACE(COALESCE(d.owner_phone_number, ''), '\D', '', 'g'), 4), '')::TEXT,
         public.disc_is_in_storage(d.id)
    FROM discs d
   WHERE d.owner_link_token = p_token
     AND d.is_returned_to_owner = false
     AND d.can_be_sold_or_donated = false
     AND d.archived_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.owner_link_disc(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_link_disc(UUID) TO anon, authenticated;

-- 6. The one way an owner's answer gets in.
--
-- SECURITY DEFINER, so it runs with the table owner's rights while anon has
-- none of its own: holding a valid link token is the whole permission. The
-- token is looked up rather than trusted, and every failure raises the same
-- message, so nothing is learned from a bad one.
--
-- The disc must still be one the club is listing. A disc already returned,
-- released for sale or donation, or archived is refused: it may be in the post
-- or already given away, and an answer at that point needs a conversation, not
-- a form.
CREATE OR REPLACE FUNCTION public.submit_owner_response(
  p_token UUID,
  p_choice SMALLINT,
  p_handover_method SMALLINT,
  p_shipping_name TEXT DEFAULT NULL,
  p_shipping_street TEXT DEFAULT NULL,
  p_shipping_postal_code TEXT DEFAULT NULL,
  p_shipping_city TEXT DEFAULT NULL,
  p_shipping_country TEXT DEFAULT NULL
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
    disc_id, choice, handover_method,
    shipping_name, shipping_street, shipping_postal_code, shipping_city, shipping_country
  ) VALUES (
    v_disc_id, p_choice, p_handover_method,
    p_shipping_name, p_shipping_street, p_shipping_postal_code, p_shipping_city, p_shipping_country
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_owner_response(UUID, SMALLINT, SMALLINT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_owner_response(UUID, SMALLINT, SMALLINT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO anon, authenticated;

COMMENT ON TABLE public.disc_owner_responses IS
  'What a disc''s owner answered from the sms link. Untrusted input; the club acts on it. Written only through submit_owner_response().';
