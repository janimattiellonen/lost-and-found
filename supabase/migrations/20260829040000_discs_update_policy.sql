-- The UPDATE policy on discs was created with a WITH CHECK clause but no
-- USING clause. For a FOR UPDATE policy those cover different halves: USING
-- decides which existing rows may be targeted, WITH CHECK validates the row
-- after the change. With no USING, no policy grants access to any existing
-- row, so an UPDATE matches zero rows -- silently, since row-level security
-- filters rather than raising.
--
-- That is why marking a disc returned or for sale did nothing while inserting
-- worked: an INSERT policy only ever has a WITH CHECK.

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.discs;

CREATE POLICY "Enable update for authenticated users only"
  ON public.discs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
