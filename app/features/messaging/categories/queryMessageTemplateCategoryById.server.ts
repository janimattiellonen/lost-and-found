import type { SupabaseClient } from '@supabase/supabase-js';

import { currentClubId } from '~/config/clubs';
import { CATEGORY_COLUMNS, toCategory, type CategoryRow } from './categoryRow.server';

import type { MessageTemplateCategoryDTO } from '~/types';

/**
 * One category, or null.
 *
 * Null covers every way an id can fail to name a category of this club: it was
 * deleted, it belongs to the other club, or it was never a real id at all.
 * Callers treat all three the same, which is what lets a hand-edited
 * `?category=` in the URL be harmless.
 */
export async function queryMessageTemplateCategoryById(
  supabase: SupabaseClient,
  id: number,
): Promise<MessageTemplateCategoryDTO | null> {
  const { data } = await supabase
    .from('message_template_categories')
    .select(CATEGORY_COLUMNS)
    .eq('id', id)
    .eq('club_id', currentClubId())
    .maybeSingle();

  return data ? toCategory(data as CategoryRow) : null;
}
