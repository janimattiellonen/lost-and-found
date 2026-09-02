-- message_log rows are keyed on the disc's external_id.
--
-- internal_disc_id is a Google Sheet row number, so a disc added through the
-- web app has none -- and could therefore never be messaged, since both the
-- send page and its log were addressed by that id. external_id is on every
-- disc (see 20260829000000_discs_external_id.sql), so it keys both.

ALTER TABLE public.message_log
  ADD COLUMN IF NOT EXISTS external_id UUID;

-- Every existing row belongs to a sheet-imported disc. Matched on the pair,
-- since a sheet row number is only unique within its own club.
UPDATE public.message_log AS ml
  SET external_id = d.external_id
  FROM public.discs AS d
  WHERE ml.external_id IS NULL
    AND ml.internal_disc_id = d.internal_disc_id
    AND ml.club_id = d.club_id;

-- Nothing writes internal_disc_id any more. The column stays for the history
-- it already holds -- a message logged against a disc since deleted has no
-- external_id to backfill from -- but it can no longer be required.
ALTER TABLE public.message_log
  ALTER COLUMN internal_disc_id DROP NOT NULL;

-- Left nullable rather than made NOT NULL for that same reason.
CREATE INDEX IF NOT EXISTS message_log_external_id_idx
  ON public.message_log (external_id);
