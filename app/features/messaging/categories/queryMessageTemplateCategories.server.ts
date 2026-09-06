import type { SupabaseClient } from '@supabase/supabase-js';

import { currentClubId } from '~/config/clubs';
import { CATEGORY_COLUMNS, toCategory, type CategoryRow } from './categoryRow.server';

import type { MessageTemplateCategoryDTO } from '~/types';

/**
 * This club's categories, in the order a dropdown should list them.
 *
 * By name, because the admin has no way to order them by hand and alphabetical
 * is the only order they can predict.
 */
export async function queryMessageTemplateCategories(supabase: SupabaseClient): Promise<MessageTemplateCategoryDTO[]> {
  const { data, error } = await supabase
    .from('message_template_categories')
    .select(CATEGORY_COLUMNS)
    .eq('club_id', currentClubId())
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Kategorioiden haku epäonnistui: ${error.message}`);
  }

  return ((data ?? []) as CategoryRow[]).map(toCategory);
}
