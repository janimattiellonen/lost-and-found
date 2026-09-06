import type { SupabaseClient } from '@supabase/supabase-js';

import { currentClubId } from '~/config/clubs';
import { UNIQUE_VIOLATION, type CategoryWriteResult } from './categoryColumns';

/** Adds a category to this club. The name is expected trimmed and non-empty. */
export async function queryCreateMessageTemplateCategory(
  supabase: SupabaseClient,
  name: string,
): Promise<CategoryWriteResult> {
  const { error } = await supabase.from('message_template_categories').insert({ club_id: currentClubId(), name });

  if (!error) {
    return { ok: true };
  }

  return { ok: false, reason: error.code === UNIQUE_VIOLATION ? 'duplicate' : 'failed' };
}
