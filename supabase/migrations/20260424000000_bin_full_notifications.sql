-- Bin-full notifications: signaled by a public user scanning a QR code when
-- the lost-and-found bin on a course is full and no new discs fit.

CREATE TABLE IF NOT EXISTS public.bin_full_notifications (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  club_id     BIGINT NOT NULL,
  course_name TEXT NOT NULL,
  read_at     TIMESTAMPTZ
);

ALTER TABLE public.bin_full_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert"
  ON public.bin_full_notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated select"
  ON public.bin_full_notifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update"
  ON public.bin_full_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete"
  ON public.bin_full_notifications
  FOR DELETE
  TO authenticated
  USING (true);
