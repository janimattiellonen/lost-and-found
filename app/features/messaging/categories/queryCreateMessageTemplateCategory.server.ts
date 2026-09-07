import type { SupabaseClient } from '@supabase/supabase-js';

import { currentClubId } from '~/config/clubs';
import { toWriteResult, type CategoryWriteResult } from './categoryWriteResult.server';

/** Adds a category to this club. The name is expected trimmed and non-empty. */
export async function queryCreateMessageTemplateCategory(
  supabase: SupabaseClient,
  name: string,
): Promise<CategoryWriteResult> {
  const { data, error } = await supabase
    .from('message_template_categories')
    .insert({ club_id: currentClubId(), name })
    .select('id');

  return toWriteResult(error, data?.length ?? 0);
}
