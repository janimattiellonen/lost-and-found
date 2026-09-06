import type { SupabaseClient } from '@supabase/supabase-js';

import { currentClubId } from '~/config/clubs';
import { UNIQUE_VIOLATION, type CategoryWriteResult } from './categoryColumns';

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
  const { error } = await supabase
    .from('message_template_categories')
    .update({ name: input.name, updated_at: new Date().toISOString() })
    .eq('id', input.id)
    .eq('club_id', currentClubId());

  if (!error) {
    return { ok: true };
  }

  return { ok: false, reason: error.code === UNIQUE_VIOLATION ? 'duplicate' : 'failed' };
}
