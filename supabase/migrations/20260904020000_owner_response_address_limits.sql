-- How long a line of a shipping address may be.
--
-- The five columns were unbounded text, and the page's own check is not the
-- boundary: submit_owner_response() is granted to anon and the anon key is in
-- every page's source, so anyone holding a link token can call it directly and
-- never go past parseOwnerResponse. The limits belong here as well, where that
-- caller cannot get around them.
--
-- The numbers are the ones the form uses, and are what fits on a parcel label:
-- see ADDRESS_LIMITS in app/features/discs/ownerResponse/parseOwnerResponse.ts.
-- Change them together.
--
-- NULL passes each of these, which is what an answer that names no address --
-- a collection, or a posting whose address has since been wiped -- is made of.

ALTER TABLE public.disc_owner_responses
  DROP CONSTRAINT IF EXISTS owner_response_address_lengths;

ALTER TABLE public.disc_owner_responses
  ADD CONSTRAINT owner_response_address_lengths CHECK (
    char_length(shipping_name) <= 100
    AND char_length(shipping_street) <= 150
    AND char_length(shipping_postal_code) <= 16
    AND char_length(shipping_city) <= 60
    AND char_length(shipping_country) <= 60
  );
