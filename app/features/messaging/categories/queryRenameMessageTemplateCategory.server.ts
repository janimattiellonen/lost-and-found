import type { SupabaseClient } from '@supabase/supabase-js';

import { currentClubId } from '~/config/clubs';
import { toWriteResult, type CategoryWriteResult } from './categoryWriteResult.server';

type Input = {
  id: number;
  name: string;
};

/**
 * Renames one of this club's categories.
 *
 * Nothing else about a category can change, and nothing that points at one
 * needs updating: templates hold the row id, and so does
 * `~/config/messageTemplateCategories`.
 */
export async function queryRenameMessageTemplateCategory(
  supabase: SupabaseClient,
  input: Input,
): Promise<CategoryWriteResult> {
  const { data, error } = await supabase
    .from('message_template_categories')
    .update({ name: input.name, updated_at: new Date().toISOString() })
    .eq('id', input.id)
    .eq('club_id', currentClubId())
    .select('id');

  return toWriteResult(error, data?.length ?? 0);
}
