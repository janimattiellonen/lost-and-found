-- Categories for message templates.
--
-- A club accumulates templates written for quite different moments: "your disc
-- has been found at Oittaa", "this disc has been with us since spring", "about
-- posting your disc back". A page that messages an owner for one of those
-- reasons should offer only the templates written for it, and until now every
-- page offered all of them.
--
-- The names are the admin's own, managed at /message-template-categories, which
-- is why they live in a table rather than in an enum or in app/config: adding
-- "Noutopyyntö" should not be a deploy.
--
-- Which category a given page uses is decided in code, by row id --
-- app/config/messageTemplateCategories.ts. Not by name, which the admin renames
-- freely; and not by a second immutable string key, which would survive the
-- rename but then disagree with the name the admin sees. The id is the only
-- identifier here that is both stable and never shown to anyone.

CREATE TABLE IF NOT EXISTS public.message_template_categories (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,

  -- Club-scoped like message_templates itself: the two clubs share a database
  -- and one club's admin must never see or rename the other's categories.
  club_id BIGINT NOT NULL,

  name TEXT NOT NULL,

  CONSTRAINT message_template_categories_name_not_blank CHECK (btrim(name) <> '')
);

-- One club cannot end up with the same name twice in a dropdown. Case
-- insensitive, because "Vastaus" and "vastaus" are the same category to the
-- person reading the list. This index is also what the create and rename
-- actions rely on to report a duplicate -- they let the insert fail rather than
-- checking first, so two saves at once cannot both get through.
CREATE UNIQUE INDEX IF NOT EXISTS message_template_categories_club_name_idx
  ON public.message_template_categories (club_id, lower(name));

-- Nullable, and deliberately so: a template in no category is the normal
-- starting state, not a mistake.
--
-- ON DELETE SET NULL rather than CASCADE or RESTRICT. Deleting a category is a
-- decision about the grouping, never about the messages written under it, so
-- the templates stay and simply become uncategorised. Doing it in the foreign
-- key rather than in the delete action means no application code has to
-- remember to clear the column first.
ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS category_id BIGINT
    REFERENCES public.message_template_categories (id) ON DELETE SET NULL;

-- The composer's filtered dropdown reads exactly this.
CREATE INDEX IF NOT EXISTS message_templates_category_idx
  ON public.message_templates (category_id);

-- The one category code knows about today, one row per club.
--
-- Seeded with explicit ids so that app/config/messageTemplateCategories.ts can
-- name 1 and 2 and be right in every environment, instead of depending on
-- whatever the insert order produced in each database. The sequence is moved
-- past them afterwards, or the next admin-created category would try to reuse
-- id 1 and fail on the primary key.
INSERT INTO public.message_template_categories (id, club_id, name)
VALUES
  (1, 1, 'Omistajan vastaus'),
  (2, 2, 'Omistajan vastaus')
ON CONFLICT (id) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('public.message_template_categories', 'id'),
  GREATEST((SELECT max(id) FROM public.message_template_categories), 1)
);

-- Only the club's admin has anything to do with this table. The category list
-- is read behind signed-in pages and written from the admin tool; there is
-- deliberately nothing for anon, which holds the key that ships in every page's
-- source.
ALTER TABLE public.message_template_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated select" ON public.message_template_categories;
CREATE POLICY "Allow authenticated select"
  ON public.message_template_categories
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON public.message_template_categories;
CREATE POLICY "Allow authenticated insert"
  ON public.message_template_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- USING as well as WITH CHECK: without USING no existing row may be targeted at
-- all, and row level security filters rather than raising, so a rename would
-- quietly affect nothing. See 20260829040000_discs_update_policy.sql.
DROP POLICY IF EXISTS "Allow authenticated update" ON public.message_template_categories;
CREATE POLICY "Allow authenticated update"
  ON public.message_template_categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON public.message_template_categories;
CREATE POLICY "Allow authenticated delete"
  ON public.message_template_categories
  FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE public.message_template_categories IS
  'Admin-managed groups for message_templates. Referred to from code by row id; message_templates.category_id is ON DELETE SET NULL.';
