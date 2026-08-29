-- Discs added through the web app have no Google Sheet row, so they have no
-- internal_disc_id. They are identified by external_id instead.
--
-- Sheet-imported discs keep their row number: syncNewDiscs() still uses
-- max(internal_disc_id) to work out which sheet rows have not been imported,
-- and NULLs are ignored by that MAX, so web-added discs cannot shadow it.

ALTER TABLE public.discs
  ALTER COLUMN internal_disc_id DROP NOT NULL;
