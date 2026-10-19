-- Owner phone numbers in one of three forms, enforced by the database.
--
-- discs.owner_phone_number was free text copied from the clubs' Google Sheets,
-- so "050 123 4567" and "0501234567" did not match each other as text. Every
-- writer now stores one form (app/phoneNumber.ts), and this constraint is what
-- makes that true rather than hoped for: a writer that forgets — the disabled
-- Sheets sync included, should it come back — gets an error instead of
-- quietly storing a messy value. See specs/16-phone-number-format.md.
--
-- The three forms:
--   NULL                    no number
--   +358501112222           E.164: "+", country code, the rest, digits only
--   2222                    the anonymised tail kept once a disc is closed
--
-- Apply ONLY after `npm run normalise:phones -- --dry-run` reports nothing left
-- to convert or fix; before that, this fails on the first messy row.

ALTER TABLE public.discs
  ADD CONSTRAINT discs_owner_phone_number_format
  CHECK (owner_phone_number ~ '^(\+[1-9][0-9]{6,14}|[0-9]{4})$');

COMMENT ON CONSTRAINT discs_owner_phone_number_format ON public.discs IS
  'NULL, E.164 (+ and 7-15 digits) or the four-digit anonymised tail. Written by app/phoneNumber.ts normalisePhoneNumber.';
