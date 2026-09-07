import type { SupabaseClient } from '@supabase/supabase-js';

import { queryMessageTemplateCategoryById } from './queryMessageTemplateCategoryById.server';

/**
 * The posted category id, but only if it names a category of *this* club.
 *
 * Both template forms run what they were sent through here before storing it.
 * Neither the foreign key nor the club scoping on the write would catch a
 * foreign id on its own: the key only proves the row exists somewhere, and the
 * `club_id` filter scopes the template being written, not the category it
 * points at. Without this check a posted `category-id` of the other club's row
 * is stored happily, and the template then disappears from every filtered
 * dropdown while its list card shows the other club's category name.
 *
 * That matters more than it looks, because neither template action checks that
 * anyone is signed in — see specs/06-messaging-and-templates.md.
 *
 * An id that fails becomes null, the same as "Ei kategoriaa". Refusing the
 * whole save would tell a prodder which ids are real.
 */
export async function queryOwnCategoryId(supabase: SupabaseClient, categoryId: number | null): Promise<number | null> {
  if (categoryId === null) {
    return null;
  }

  const category = await queryMessageTemplateCategoryById(supabase, categoryId);

  return category ? category.id : null;
}
