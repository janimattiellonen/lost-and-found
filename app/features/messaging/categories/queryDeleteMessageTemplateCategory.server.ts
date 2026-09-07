import type { SupabaseClient } from '@supabase/supabase-js';

import { currentClubId } from '~/config/clubs';
import { toWriteResult, type CategoryWriteResult } from './categoryWriteResult.server';

/**
 * Removes one of this club's categories.
 *
 * The templates in it are kept: `message_templates.category_id` is
 * `ON DELETE SET NULL`, so they become uncategorised as the row goes. There is
 * deliberately no code here that clears the column first — the foreign key
 * cannot forget to.
 */
export async function queryDeleteMessageTemplateCategory(
  supabase: SupabaseClient,
  id: number,
): Promise<CategoryWriteResult> {
  const { data, error } = await supabase
    .from('message_template_categories')
    .delete()
    .eq('id', id)
    .eq('club_id', currentClubId())
    .select('id');

  return toWriteResult(error, data?.length ?? 0);
}
